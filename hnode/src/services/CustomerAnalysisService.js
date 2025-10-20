const { CustomerAnalysis, Customer, EmailHistory, ZoomMeeting } = require('../models');
const axios = require('axios');
const { Op } = require('sequelize');

class CustomerAnalysisService {
  constructor() {}

  // 分析客户进度
  async analyzeCustomer(customerId, userId) {
    try {
      console.log(`🔍 开始分析客户 [CustomerID:${customerId}, UserID:${userId}]`);

      // 1. 获取客户信息
      const customer = await Customer.findOne({
        where: {
          id: customerId,
          user_id: userId
        }
      });

      if (!customer) {
        throw new Error('客户不存在或无权访问');
      }

      // 2. 获取所有邮件往来（按时间正序）
      // 查询该用户所有邮箱与该客户邮箱的所有往来
      const customerEmail = customer.email;
      const emailHistory = await EmailHistory.findAll({
        where: {
          user_id: userId,
          [Op.or]: [
            { send_address: customerEmail },     // 客户发给我
            { receive_address: customerEmail }   // 我发给客户
          ]
        },
        order: [['send_time', 'ASC']],
        attributes: ['id', 'title', 'content', 'send_time', 'send_address', 'receive_address', 'email_type']
      });

      // 3. 获取所有会议纪要（按时间正序）
      const meetings = await ZoomMeeting.findAll({
        where: {
          user_id: userId,
          customer_id: customerId,
          status: 'completed'
        },
        order: [['meeting_date', 'ASC']],
        attributes: ['id', 'meeting_title', 'meeting_date', 'transcript_text', 'ai_summary']
      });

      console.log(`📧 找到 ${emailHistory.length} 封邮件`);
      console.log(`🎥 找到 ${meetings.length} 次会议`);

      // 4. 准备分析数据
      const analysisContext = this.prepareAnalysisContext(customer, emailHistory, meetings);

      // 5. 调用LLM进行分析
      const analysisResult = await this.analyzeWithLLM(analysisContext);

      // 6. 保存到数据库
      const savedAnalysis = await CustomerAnalysis.create({
        user_id: userId,
        customer_id: customerId,
        customer_email: customer.email,
        customer_name: customer.name,
        customer_first_name: customer.first_name,
        customer_last_name: customer.last_name,
        current_progress: analysisResult.current_progress,
        opportunities: analysisResult.opportunities,
        risks: analysisResult.risks,
        strategic_suggestions: analysisResult.strategic_suggestions,
        next_actions: analysisResult.next_actions,
        analysis_data: {
          email_count: emailHistory.length,
          meeting_count: meetings.length,
          analysis_timestamp: new Date().toISOString()
        }
      });

      console.log(`✅ 客户分析完成并保存 [AnalysisID:${savedAnalysis.id}]`);

      return {
        ...savedAnalysis.toJSON(),
        from_cache: false
      };
    } catch (error) {
      throw new Error(`分析客户失败: ${error.message}`);
    }
  }

  // 准备分析上下文
  prepareAnalysisContext(customer, emailHistory, meetings) {
    let context = `# 客户信息\n`;
    context += `- 客户姓名: ${customer.name}\n`;
    context += `- 公司: ${customer.company || '未知'}\n`;
    context += `- 邮箱: ${customer.email}\n`;
    context += `- 当前沟通进度: ${customer.communication_progress || '未知'}\n`;
    context += `- 兴趣程度: ${customer.interest_level || '未知'}\n\n`;

    // 邮件往来
    if (emailHistory.length > 0) {
      context += `# 邮件往来记录 (按时间正序，共${emailHistory.length}封)\n\n`;
      emailHistory.forEach((email, index) => {
        context += `## 邮件 ${index + 1} - ${email.send_time}\n`;
        context += `标题: ${email.title || '无标题'}\n`;
        context += `发件人: ${email.send_address}\n`;
        context += `收件人: ${email.receive_address}\n`;
        if (email.content) {
          context += `内容: ${email.content.substring(0, 500)}${email.content.length > 500 ? '...' : ''}\n`;
        }
        context += `\n`;
      });
    } else {
      context += `# 邮件往来记录\n暂无邮件记录\n\n`;
    }

    // 会议纪要
    if (meetings.length > 0) {
      context += `# 会议纪要记录 (按时间正序，共${meetings.length}次)\n\n`;
      meetings.forEach((meeting, index) => {
        context += `## 会议 ${index + 1} - ${meeting.meeting_date}\n`;
        context += `标题: ${meeting.meeting_title || '未命名会议'}\n`;
        if (meeting.ai_summary) {
          context += `会议摘要:\n${meeting.ai_summary}\n`;
        } else if (meeting.transcript_text) {
          context += `会议内容:\n${meeting.transcript_text.substring(0, 500)}${meeting.transcript_text.length > 500 ? '...' : ''}\n`;
        }
        context += `\n`;
      });
    } else {
      context += `# 会议纪要记录\n暂无会议记录\n\n`;
    }

    return context;
  }

  // 使用LLM进行分析（function calling）
  async analyzeWithLLM(context) {
    try {
      console.log(`🤖 开始调用LLM分析...`);

      const systemPrompt = `你是一个专业的销售战略分析师，擅长分析客户沟通记录并提供战略建议。
请仔细分析客户的邮件往来和会议纪要，提供详细的分析报告。

分析维度：
1. 当前沟通进度 - 评估当前与客户的关系阶段和沟通状态
2. 机会点 - 识别潜在的成交机会、客户需求、积极信号
3. 风险点 - 识别竞品威胁、预算问题、决策延迟等风险
4. 战略建议 - 提供具体的销售策略和方法
5. 下一步行动 - 给出可执行的下一步行动计划`;

      const userPrompt = `请分析以下客户的沟通记录：\n\n${context}`;

      const tools = [{
        type: 'function',
        function: {
          name: 'save_customer_analysis',
          description: '保存客户分析结果',
          parameters: {
            type: 'object',
            required: ['current_progress', 'opportunities', 'risks', 'strategic_suggestions', 'next_actions'],
            properties: {
              current_progress: {
                type: 'string',
                description: '当前沟通进度的详细描述，包括客户状态、关系阶段、沟通频率等'
              },
              opportunities: {
                type: 'array',
                description: '机会点列表，每个机会点应该详细说明',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', description: '机会点标题' },
                    description: { type: 'string', description: '详细描述' },
                    priority: { type: 'string', enum: ['高', '中', '低'], description: '优先级' }
                  }
                }
              },
              risks: {
                type: 'array',
                description: '风险点列表，包括竞品、预算、决策等风险',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', description: '风险点标题' },
                    description: { type: 'string', description: '详细描述' },
                    severity: { type: 'string', enum: ['高', '中', '低'], description: '严重程度' }
                  }
                }
              },
              strategic_suggestions: {
                type: 'array',
                description: '战略建议列表，提供可执行的策略',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', description: '建议标题' },
                    description: { type: 'string', description: '详细说明' },
                    expected_outcome: { type: 'string', description: '预期效果' }
                  }
                }
              },
              next_actions: {
                type: 'array',
                description: '下一步行动建议列表，具体可执行',
                items: {
                  type: 'object',
                  properties: {
                    action: { type: 'string', description: '行动内容' },
                    deadline: { type: 'string', description: '建议时间' },
                    priority: { type: 'string', enum: ['紧急', '重要', '一般'], description: '优先级' }
                  }
                }
              }
            }
          }
        }
      }];

      // 构建请求payload
      const payload = {
        model: process.env.OPENAI_MODEL || 'claude-sonnet-4-5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: tools,
        tool_choice: { type: 'function', function: { name: 'save_customer_analysis' } }
      };

      // GPT-5系列模型使用max_completion_tokens，其他模型使用max_tokens
      const model = process.env.OPENAI_MODEL || 'claude-sonnet-4-5';
      if (model.toLowerCase().includes('claude')) {
        payload.max_tokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 4000;
        payload.temperature = 0.7;
      } else if (model.startsWith('gpt-5')) {
        payload.max_completion_tokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 4000;
      } else {
        payload.max_tokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 4000;
        payload.temperature = 0.7;
      }

      const response = await axios.post(
        `${process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'}/chat/completions`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 120000
        }
      );

      // 解析function call结果
      const message = response.data.choices[0].message;
      
      if (message.tool_calls && message.tool_calls.length > 0) {
        const functionCall = message.tool_calls[0].function;
        const analysisResult = JSON.parse(functionCall.arguments);
        
        console.log(`✅ LLM分析完成`);
        return analysisResult;
      } else {
        throw new Error('LLM未返回有效的分析结果');
      }
    } catch (error) {
      console.error(`❌ LLM分析失败:`, error.response?.data || error.message);
      throw error;
    }
  }

  // 获取客户的历史分析记录
  async getCustomerAnalysisHistory(customerId, userId, limit = 10) {
    try {
      const analyses = await CustomerAnalysis.findAll({
        where: {
          user_id: userId,
          customer_id: customerId
        },
        order: [['created_at', 'DESC']],
        limit: limit
      });

      return analyses;
    } catch (error) {
      throw new Error(`获取分析历史失败: ${error.message}`);
    }
  }
}

module.exports = CustomerAnalysisService;
