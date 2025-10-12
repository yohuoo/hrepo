const { ZoomMeeting, Customer } = require('../models');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const NotificationService = require('./NotificationService');

class ZoomService {
  constructor() {}

  // 创建会议记录（上传视频后）
  async createMeetingFromUpload(meetingData, videoFile, userId) {
    try {
      // 验证客户是否存在
      const customer = await Customer.findOne({
        where: {
          id: meetingData.customer_id,
          user_id: userId
        }
      });

      if (!customer) {
        throw new Error('客户不存在或无权访问');
      }

      // 创建会议记录
      const zoomMeeting = await ZoomMeeting.create({
        user_id: userId,
        customer_id: meetingData.customer_id,
        meeting_title: meetingData.meeting_title || videoFile.originalname,
        meeting_date: meetingData.meeting_date || new Date(),
        video_file_path: videoFile.path,
        video_file_name: videoFile.originalname,
        video_file_size: videoFile.size,
        status: 'pending'
      });

      // 异步处理视频（转文字+AI总结）
      this.processVideoAsync(zoomMeeting.id).catch(error => {
        console.error(`异步处理视频失败 [ID:${zoomMeeting.id}]:`, error);
      });

      return zoomMeeting;
    } catch (error) {
      throw new Error(`创建会议记录失败: ${error.message}`);
    }
  }

  // 异步处理视频：语音转文字 + AI总结
  async processVideoAsync(meetingId) {
    try {
      console.log(`🎬 开始处理视频 [ID:${meetingId}]`);

      // 更新状态为处理中
      await ZoomMeeting.update(
        { status: 'processing' },
        { where: { id: meetingId } }
      );

      const meeting = await ZoomMeeting.findByPk(meetingId);
      if (!meeting) {
        throw new Error('会议记录不存在');
      }

      // 第1步：语音转文字
      console.log(`🎤 [ID:${meetingId}] 开始语音转文字...`);
      await ZoomMeeting.update(
        { status: 'transcribing' },
        { where: { id: meetingId } }
      );

      const transcriptText = await this.transcribeVideo(meeting.video_file_path);
      
      await meeting.update({ transcript_text: transcriptText });

      // 第2步：AI生成摘要
      console.log(`🤖 [ID:${meetingId}] 开始生成AI摘要...`);
      await ZoomMeeting.update(
        { status: 'summarizing' },
        { where: { id: meetingId } }
      );

      // 检查转录文本是否有效
      let aiSummary;
      if (!transcriptText || transcriptText.trim().length < 20) {
        console.log(`⚠️ [ID:${meetingId}] 转录文本太少，跳过AI摘要生成`);
        aiSummary = `⚠️ 视频中未检测到足够的语音内容，无法生成会议纪要。\n\n转录结果:\n${transcriptText}\n\n建议:\n1. 确保视频包含清晰的语音内容\n2. 检查视频音频是否正常\n3. 可以手动添加会议内容或重新上传包含语音的视频`;
      } else {
        aiSummary = await this.generateMeetingSummary(
          transcriptText,
          meeting.meeting_title
        );
      }

      // 第3步：更新为完成状态
      await meeting.update({
        ai_summary: aiSummary,
        status: 'completed'
      });

      // 发送会议记录完成通知
      await this.sendMeetingNotification(meeting.user_id, meeting);

      console.log(`✅ [ID:${meetingId}] 视频处理完成`);
      return meeting;
    } catch (error) {
      console.error(`❌ [ID:${meetingId}] 视频处理失败:`, error);
      
      // 更新状态为失败
      await ZoomMeeting.update(
        {
          status: 'failed',
          error_message: error.message
        },
        { where: { id: meetingId } }
      );
      
      throw error;
    }
  }

  /**
   * 发送会议记录完成通知
   */
  async sendMeetingNotification(userId, meeting) {
    try {
      const duration = meeting.video_file_size ? 
        `${Math.round(meeting.video_file_size / 1024 / 1024)}MB` : '未知大小';
      
      await NotificationService.addNotification(
        userId,
        'meeting',
        '会议记录',
        '视频会议记录处理完成',
        {
          meetingId: meeting.id,
          meetingTitle: meeting.meeting_title,
          duration: duration,
          customerId: meeting.customer_id,
          status: 'completed'
        }
      );

      console.log(`✅ 会议记录通知已发送: ${userId} - ${meeting.meeting_title}`);
    } catch (error) {
      console.error('发送会议记录通知失败:', error);
    }
  }

  // 语音转文字（使用OpenAI Whisper API）
  async transcribeVideo(videoFilePath) {
    try {
      console.log(`📝 开始转录: ${videoFilePath}`);

      // 使用OpenAI Whisper API进行语音转文字
      const formData = new FormData();
      formData.append('file', fs.createReadStream(videoFilePath));
      formData.append('model', 'whisper-1');
      formData.append('language', 'zh'); // 中文
      formData.append('response_format', 'text');

      const response = await axios.post(
        `${process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'}/audio/transcriptions`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            ...formData.getHeaders()
          },
          timeout: 600000, // 10分钟超时
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      const transcriptText = response.data;
      console.log(`✅ 转录完成，文本长度: ${transcriptText.length} 字符`);
      
      return transcriptText;
    } catch (error) {
      console.error(`❌ 语音转文字失败:`, error.response?.data || error.message);
      
      // 如果Whisper API失败，返回占位符
      return `语音转文字失败: ${error.message}\n\n请手动添加会议内容或重新处理。`;
    }
  }

  // 使用AI生成会议纪要
  async generateMeetingSummary(transcriptText, meetingTitle = null) {
    try {
      console.log(`🤖 开始生成AI会议纪要...`);

      const prompt = `请根据以下会议录音转录内容生成一份专业的会议纪要：

${meetingTitle ? `会议主题: ${meetingTitle}\n\n` : ''}会议内容转录:
${transcriptText}

请按以下格式生成会议纪要：

## 会议概要
（用2-3句话概括本次会议的主要内容和目的）

## 关键讨论点
1. ...
2. ...
3. ...

## 决策事项
（列出会议中达成的具体决策，如无则说明"无"）

## 行动项
（列出需要后续执行的任务，包括负责人和截止日期，如无则说明"无"）

## 下次会议安排
（如有则说明，如无则说明"待定"）

请用简洁专业的语言，突出重点内容。`;

      // 构建请求体
      const requestBody = {
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的会议纪要生成助手，擅长从会议记录中提取关键信息并生成结构化的会议纪要。'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      };

      // GPT-5模型使用max_completion_tokens，其他模型使用max_tokens
      const model = process.env.OPENAI_MODEL || 'gpt-4';
      if (model.includes('gpt-5')) {
        requestBody.max_completion_tokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 2000;
        // GPT-5不支持temperature参数，使用默认值
      } else {
        requestBody.max_tokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 2000;
        requestBody.temperature = 0.7;
      }

      const response = await axios.post(
        `${process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'}/chat/completions`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      const aiSummary = response.data.choices[0].message.content;
      console.log(`✅ AI会议纪要生成成功`);
      
      return aiSummary;
    } catch (error) {
      console.error(`❌ AI会议纪要生成失败:`, error.response?.data || error.message);
      return `AI摘要生成失败: ${error.message}\n\n原始文本:\n${transcriptText.substring(0, 1000)}...`;
    }
  }

  // 获取用户与特定客户的会议列表
  async getUserZoomMeetings(userId, options = {}) {
    try {
      const { customer_id, status, page = 1, pageSize = 20 } = options;

      const where = { user_id: userId };

      if (customer_id) {
        where.customer_id = customer_id;
      }

      if (status) {
        where.status = status;
      }

      const { count, rows } = await ZoomMeeting.findAndCountAll({
        where,
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'email', 'company']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: pageSize,
        offset: (page - 1) * pageSize
      });

      return {
        meetings: rows,
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize)
      };
    } catch (error) {
      throw new Error(`获取会议列表失败: ${error.message}`);
    }
  }

  // 获取单个会议详情
  async getZoomMeetingById(meetingId, userId) {
    try {
      const meeting = await ZoomMeeting.findOne({
        where: {
          id: meetingId,
          user_id: userId
        },
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'email', 'company']
          }
        ]
      });

      return meeting;
    } catch (error) {
      throw new Error(`获取会议详情失败: ${error.message}`);
    }
  }

  // 删除会议记录（包括文件）
  async deleteZoomMeeting(meetingId, userId) {
    try {
      const meeting = await this.getZoomMeetingById(meetingId, userId);
      
      if (!meeting) {
        return false;
      }

      // 删除视频文件
      if (meeting.video_file_path && fs.existsSync(meeting.video_file_path)) {
        fs.unlinkSync(meeting.video_file_path);
        console.log(`🗑️  已删除视频文件: ${meeting.video_file_path}`);
      }

      // 删除音频文件（如果有）
      if (meeting.audio_file_path && fs.existsSync(meeting.audio_file_path)) {
        fs.unlinkSync(meeting.audio_file_path);
        console.log(`🗑️  已删除音频文件: ${meeting.audio_file_path}`);
      }

      // 删除数据库记录
      await meeting.destroy();
      
      return true;
    } catch (error) {
      throw new Error(`删除会议记录失败: ${error.message}`);
    }
  }

  // 重新处理会议
  async reprocessMeeting(meetingId, userId) {
    try {
      const meeting = await this.getZoomMeetingById(meetingId, userId);
      
      if (!meeting) {
        throw new Error('会议记录不存在');
      }

      if (!meeting.video_file_path || !fs.existsSync(meeting.video_file_path)) {
        throw new Error('视频文件不存在，无法重新处理');
      }

      // 重置状态
      await meeting.update({
        status: 'pending',
        error_message: null
      });

      // 异步重新处理
      this.processVideoAsync(meetingId).catch(error => {
        console.error(`重新处理视频失败 [ID:${meetingId}]:`, error);
      });

      return meeting;
    } catch (error) {
      throw new Error(`重新处理会议失败: ${error.message}`);
    }
  }
}

module.exports = ZoomService;