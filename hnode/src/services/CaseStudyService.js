const { CaseStudy, Customer, EmailHistory, SalesRecord, CustomerAnalysis, User } = require('../models');
const { Op } = require('sequelize');
const EmailAIService = require('./EmailAIService');

class CaseStudyService {
  constructor() {
    this.emailAIService = new EmailAIService();
  }

  /**
   * 生成案例总结（AI）
   * 只针对已成交的客户
   */
  async generateCaseStudy(customerId, userId) {
    console.log('🤖 开始生成案例总结，客户ID:', customerId);
    
    // 获取客户信息
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      throw new Error('客户不存在');
    }
    
    // 检查是否已成交
    if (customer.deal_status !== '已成交') {
      throw new Error('只能为已成交的客户生成案例总结');
    }
    
    // 检查是否已存在案例
    const existingCase = await CaseStudy.findOne({
      where: { customer_id: customerId }
    });
    
    if (existingCase) {
      console.log('案例已存在，将重新生成');
    }
    
    // 获取客户的邮件往来（最近20封）
    const emails = await EmailHistory.findAll({
      where: { customer_id: customerId },
      order: [['send_time', 'DESC']],
      limit: 20,
      attributes: ['title', 'content', 'email_type', 'send_time']
    });
    
    // 获取客户分析报告（最新的一份）
    const analysis = await CustomerAnalysis.findOne({
      where: { customer_id: customerId },
      order: [['created_at', 'DESC']],
      attributes: ['current_progress', 'opportunities', 'risks', 'strategic_suggestions', 'next_actions']
    });
    
    // 获取销售记录
    const salesRecords = await SalesRecord.findAll({
      where: { customer_id: customerId },
      order: [['sale_date', 'DESC']],
      attributes: ['product_name', 'quantity', 'amount', 'currency', 'sale_date', 'notes']
    });
    
    console.log('📧 邮件数量:', emails.length);
    console.log('📊 分析报告:', analysis ? '有' : '无');
    console.log('💰 销售记录数量:', salesRecords.length);
    
    // 构建AI上下文
    const context = {
      customer: {
        name: customer.name,
        company: customer.company,
        email: customer.email,
        communication_progress: customer.communication_progress,
        interest_level: customer.interest_level
      },
      emails: emails.map(e => ({
        title: e.title,
        content: e.content ? e.content.substring(0, 800) : '',
        type: e.email_type,
        date: e.send_time
      })),
      analysis: analysis ? {
        current_progress: analysis.current_progress,
        opportunities: analysis.opportunities,
        risks: analysis.risks,
        strategic_suggestions: analysis.strategic_suggestions,
        next_actions: analysis.next_actions
      } : null,
      sales: salesRecords.map(s => ({
        product: s.product_name,
        quantity: s.quantity,
        amount: s.amount,
        currency: s.currency,
        date: s.sale_date,
        notes: s.notes
      }))
    };
    
    // 调用AI生成案例内容
    const aiResult = await this.generateCaseStudyContent(context);
    
    // 保存或更新案例
    let caseStudy;
    if (existingCase) {
      await existingCase.update({
        title: aiResult.title,
        customer_info: aiResult.customer_info,
        sales_techniques: aiResult.sales_techniques,
        communication_highlights: aiResult.communication_highlights,
        summary: aiResult.summary,
        generated_by: userId
      });
      caseStudy = existingCase;
      console.log('✅ 案例已更新，ID:', caseStudy.id);
    } else {
      caseStudy = await CaseStudy.create({
        customer_id: customerId,
        user_id: customer.user_id,
        title: aiResult.title,
        customer_info: aiResult.customer_info,
        sales_techniques: aiResult.sales_techniques,
        communication_highlights: aiResult.communication_highlights,
        summary: aiResult.summary,
        generated_by: userId
      });
      console.log('✅ 案例已创建，ID:', caseStudy.id);
    }
    
    return caseStudy;
  }

  /**
   * AI生成案例内容
   */
  async generateCaseStudyContent(context) {
    const { customer, emails, analysis, sales } = context;
    
    const prompt = `你是一个专业的B2B销售案例分析专家。请基于以下已成交客户的信息，生成一份专业的销售案例总结。

**客户基本信息：**
- 客户姓名：${customer.name}
- 公司名称：${customer.company}
- 邮箱：${customer.email}
- 沟通进度：${customer.communication_progress}
- 兴趣程度：${customer.interest_level}

**邮件沟通历史（${emails.length}封）：**
${emails.length > 0 ? emails.slice(0, 10).map((e, i) => `
${i + 1}. [${e.type === 'sent' ? '发送' : '接收'}] ${e.title || '(无标题)'}
   时间：${new Date(e.date).toLocaleDateString('zh-CN')}
   内容摘要：${e.content.substring(0, 300)}...
`).join('\n') : '暂无邮件记录'}

**AI客户分析报告：**
${analysis ? `
- 当前进度：${analysis.current_progress || '无'}
- 机会点：${analysis.opportunities ? JSON.stringify(analysis.opportunities) : '无'}
- 风险点：${analysis.risks ? JSON.stringify(analysis.risks) : '无'}
- 战略建议：${analysis.strategic_suggestions ? JSON.stringify(analysis.strategic_suggestions) : '无'}
- 下一步行动：${analysis.next_actions ? JSON.stringify(analysis.next_actions) : '无'}
` : '暂无分析报告'}

**成交记录（${sales.length}笔）：**
${sales.length > 0 ? sales.map((s, i) => `
${i + 1}. 产品：${s.product}，数量：${s.quantity}，金额：${s.currency} ${s.amount}
   日期：${new Date(s.date).toLocaleDateString('zh-CN')}
   ${s.notes ? '备注：' + s.notes : ''}
`).join('\n') : '暂无销售记录'}

请生成一份结构化的案例总结，包含以下部分：
1. **title**（案例标题）：简洁有力的标题
2. **customer_info**（客户基本信息）：使用Markdown格式（## 标题、- 列表等），描述公司规模、行业、需求特点
3. **sales_techniques**（销售技巧）：使用Markdown格式，列举有效的销售策略和技巧
4. **communication_highlights**（沟通亮点）：使用Markdown格式，列举关键的沟通节点和突破点
5. **summary**（完整总结）：使用Markdown格式，完整叙述整个案例

**重要：customer_info、sales_techniques、communication_highlights 都必须使用Markdown格式，包含标题（##）、列表（-）、加粗（**）等格式，确保显示时层次清晰、美观易读。**

请使用专业、客观的语气，突出可复用的经验和技巧。`;

    try {
      const response = await this.emailAIService.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'claude-sonnet-4-5',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的B2B销售案例分析专家。请分析客户的沟通和交易历史，生成专业的案例总结。必须以JSON格式返回。'
          },
          {
            role: 'user',
            content: prompt + '\n\n请严格按照以下JSON格式返回（可以使用```json代码块包裹）：\n```json\n{\n  "title": "案例标题（字符串）",\n  "customer_info": "客户基本信息（字符串，可以包含换行符\\n）",\n  "sales_techniques": "销售技巧（字符串，可以包含换行符\\n）",\n  "communication_highlights": "沟通亮点（字符串，可以包含换行符\\n）",\n  "summary": "完整总结（字符串，Markdown格式）"\n}\n```\n\n注意：所有字段必须是字符串类型，不要使用数组或对象！如果有多个要点，请使用换行符分隔。'
          }
        ]
      });

      console.log('AI案例总结响应收到');

      const messageContent = response.choices[0].message.content;
      console.log('📝 AI原始响应:', messageContent);
      
      if (!messageContent) {
        throw new Error('AI未返回任何内容');
      }

      let result;
      try {
        result = JSON.parse(messageContent);
      } catch (parseError) {
        console.log('直接解析失败，尝试提取JSON代码块');
        
        let jsonStr = null;
        const jsonBlockMatch = messageContent.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonBlockMatch) {
          jsonStr = jsonBlockMatch[1].trim();
        } else {
          const codeBlockMatch = messageContent.match(/```\s*([\s\S]*?)\s*```/);
          if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1].trim();
          } else {
            const directJsonMatch = messageContent.match(/\{[\s\S]*?\}\s*$/);
            if (directJsonMatch) {
              jsonStr = directJsonMatch[0].trim();
            }
          }
        }
        
        if (jsonStr) {
          if (jsonStr.startsWith('{')) {
            let openCount = 0;
            let closeCount = 0;
            let validEnd = jsonStr.length;
            
            for (let i = 0; i < jsonStr.length; i++) {
              if (jsonStr[i] === '{') openCount++;
              if (jsonStr[i] === '}') {
                closeCount++;
                if (openCount === closeCount) {
                  validEnd = i + 1;
                  break;
                }
              }
            }
            
            jsonStr = jsonStr.substring(0, validEnd);
          }
          
          result = JSON.parse(jsonStr);
        } else {
          console.error('无法提取JSON，原始内容:', messageContent);
          throw new Error('AI返回的内容格式不正确');
        }
      }
      
      // 数据格式转换：确保所有字段都是字符串
      const normalizeToString = (value) => {
        if (typeof value === 'string') {
          return value;
        } else if (Array.isArray(value)) {
          // 如果是数组，转换为换行分隔的字符串
          return value.map(item => {
            if (typeof item === 'string') return item;
            if (typeof item === 'object') return JSON.stringify(item);
            return String(item);
          }).join('\n');
        } else if (typeof value === 'object' && value !== null) {
          // 如果是对象，转换为JSON字符串
          return JSON.stringify(value, null, 2);
        } else {
          return String(value || '');
        }
      };
      
      // 标准化结果
      console.log('🔄 标准化前的结果类型:', {
        title: typeof result.title,
        customer_info: typeof result.customer_info,
        sales_techniques: typeof result.sales_techniques,
        communication_highlights: typeof result.communication_highlights,
        summary: typeof result.summary
      });
      
      const normalized = {
        title: normalizeToString(result.title || '未命名案例'),
        customer_info: normalizeToString(result.customer_info || '暂无客户信息'),
        sales_techniques: normalizeToString(result.sales_techniques || '暂无销售技巧总结'),
        communication_highlights: normalizeToString(result.communication_highlights || '暂无沟通亮点'),
        summary: normalizeToString(result.summary || '暂无完整总结')
      };
      
      console.log('✅ 标准化后的结果类型:', {
        title: typeof normalized.title,
        customer_info: typeof normalized.customer_info,
        sales_techniques: typeof normalized.sales_techniques,
        communication_highlights: typeof normalized.communication_highlights,
        summary: typeof normalized.summary
      });
      console.log('📏 标准化后的内容长度:', {
        title: normalized.title.length,
        customer_info: normalized.customer_info.length,
        sales_techniques: normalized.sales_techniques.length,
        communication_highlights: normalized.communication_highlights.length,
        summary: normalized.summary.length
      });
      
      return normalized;

    } catch (error) {
      console.error('AI生成案例内容失败:', error);
      throw new Error(`AI生成案例内容失败: ${error.message}`);
    }
  }

  /**
   * 获取案例列表（全体可见）
   */
  async getCaseStudies(userId, userRole, options = {}) {
    const {
      page = 1,
      pageSize = 20
    } = options;
    
    // 所有案例全体可见（根据用户确认）
    const { count, rows } = await CaseStudy.findAndCountAll({
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'company', 'email']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'generator',
          attributes: ['id', 'username', 'email']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize
    });
    
    return {
      caseStudies: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize)
    };
  }

  /**
   * 获取案例详情
   */
  async getCaseStudyById(caseStudyId) {
    const caseStudy = await CaseStudy.findByPk(caseStudyId, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'company', 'email', 'deal_status']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'generator',
          attributes: ['id', 'username', 'email']
        }
      ]
    });
    
    if (!caseStudy) {
      throw new Error('案例不存在');
    }
    
    return caseStudy;
  }

  /**
   * 删除案例
   */
  async deleteCaseStudy(caseStudyId, userId, userRole) {
    const caseStudy = await CaseStudy.findByPk(caseStudyId);
    
    if (!caseStudy) {
      throw new Error('案例不存在');
    }
    
    // 权限检查：只有管理员或创建者可以删除
    if (userRole !== 'super_admin' && userRole !== 'admin' && caseStudy.generated_by !== userId) {
      throw new Error('权限不足');
    }
    
    await caseStudy.destroy();
    
    console.log('✅ 案例已删除，ID:', caseStudyId);
    
    return true;
  }
}

module.exports = CaseStudyService;

