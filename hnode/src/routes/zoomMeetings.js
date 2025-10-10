const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const ZoomService = require('../services/ZoomService');

const zoomService = new ZoomService();

// 上传会议视频并开始处理
router.post('/upload', authenticateToken, upload.single('video'), async (req, res) => {
  try {
    const { customer_id, meeting_title, meeting_date } = req.body;

    if (!customer_id) {
      return res.status(400).json({
        success: false,
        message: '客户ID是必需的'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传视频文件'
      });
    }

    const zoomMeeting = await zoomService.createMeetingFromUpload(
      {
        customer_id: parseInt(customer_id),
        meeting_title,
        meeting_date
      },
      req.file,
      req.user.id
    );

    res.status(201).json({
      success: true,
      meeting: {
        id: zoomMeeting.id,
        user_id: zoomMeeting.user_id,
        customer_id: zoomMeeting.customer_id,
        meeting_title: zoomMeeting.meeting_title,
        meeting_date: zoomMeeting.meeting_date,
        video_file_name: zoomMeeting.video_file_name,
        video_file_size: zoomMeeting.video_file_size,
        status: zoomMeeting.status,
        created_at: zoomMeeting.created_at,
        updated_at: zoomMeeting.updated_at
      },
      message: '视频上传成功，正在后台处理（语音转文字 + AI摘要）',
      // 提示前端如何查询处理状态
      poll_url: `/api/zoom-meetings/${zoomMeeting.id}`,
      estimated_time: '预计处理时间: 10-60秒（取决于视频长度）'
    });
  } catch (error) {
    console.error('上传会议视频错误:', error);
    res.status(500).json({
      success: false,
      message: '上传会议视频失败',
      error: error.message
    });
  }
});

// 获取会议列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { customer_id, status, page = 1, pageSize = 20 } = req.query;

    const result = await zoomService.getUserZoomMeetings(req.user.id, {
      customer_id: customer_id ? parseInt(customer_id) : null,
      status,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });

    const meetings = result.meetings.map(meeting => ({
      id: meeting.id,
      user_id: meeting.user_id,
      customer_id: meeting.customer_id,
      customer: meeting.customer ? {
        id: meeting.customer.id,
        name: meeting.customer.name,
        email: meeting.customer.email,
        company: meeting.customer.company
      } : null,
      meeting_title: meeting.meeting_title,
      meeting_date: meeting.meeting_date,
      video_file_name: meeting.video_file_name,
      video_file_size: meeting.video_file_size,
      has_transcript: !!meeting.transcript_text,
      has_summary: !!meeting.ai_summary,
      ai_summary: meeting.ai_summary || null,  // 返回完整摘要内容
      status: meeting.status,
      error_message: meeting.error_message,
      created_at: meeting.created_at,
      updated_at: meeting.updated_at
    }));

    res.json({
      success: true,
      meetings,
      total: result.total,
      page: result.page,
      page_size: result.pageSize,
      total_pages: result.totalPages
    });
  } catch (error) {
    console.error('获取会议列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取会议列表失败',
      error: error.message
    });
  }
});

// 获取单个会议详情
router.get('/:meetingId', authenticateToken, async (req, res) => {
  try {
    const meeting = await zoomService.getZoomMeetingById(
      parseInt(req.params.meetingId),
      req.user.id
    );

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: '会议记录不存在'
      });
    }

    res.json({
      success: true,
      meeting: {
        id: meeting.id,
        user_id: meeting.user_id,
        customer_id: meeting.customer_id,
        customer: meeting.customer ? {
          id: meeting.customer.id,
          name: meeting.customer.name,
          email: meeting.customer.email,
          company: meeting.customer.company
        } : null,
        meeting_title: meeting.meeting_title,
        meeting_date: meeting.meeting_date,
        video_file_name: meeting.video_file_name,
        video_file_size: meeting.video_file_size,
        video_file_path: meeting.video_file_path,
        transcript_text: meeting.transcript_text,
        ai_summary: meeting.ai_summary,
        status: meeting.status,
        error_message: meeting.error_message,
        created_at: meeting.created_at,
        updated_at: meeting.updated_at
      }
    });
  } catch (error) {
    console.error('获取会议详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取会议详情失败',
      error: error.message
    });
  }
});

// 删除会议记录
router.delete('/:meetingId', authenticateToken, async (req, res) => {
  try {
    const success = await zoomService.deleteZoomMeeting(
      parseInt(req.params.meetingId),
      req.user.id
    );

    if (!success) {
      return res.status(404).json({
        success: false,
        message: '会议记录不存在'
      });
    }

    res.json({
      success: true,
      message: '会议记录删除成功（包括视频文件）'
    });
  } catch (error) {
    console.error('删除会议记录错误:', error);
    res.status(500).json({
      success: false,
      message: '删除会议记录失败',
      error: error.message
    });
  }
});

// 重新处理会议
router.post('/:meetingId/reprocess', authenticateToken, async (req, res) => {
  try {
    const meeting = await zoomService.reprocessMeeting(
      parseInt(req.params.meetingId),
      req.user.id
    );

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: '会议记录不存在'
      });
    }

    res.json({
      success: true,
      message: '重新处理任务已创建，正在后台处理',
      meeting: {
        id: meeting.id,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('重新处理会议错误:', error);
    res.status(500).json({
      success: false,
      message: '重新处理会议失败',
      error: error.message
    });
  }
});

module.exports = router;