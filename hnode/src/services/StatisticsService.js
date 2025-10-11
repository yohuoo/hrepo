const { Contact, Customer, EmailHistory, SalesRecord, User, Department } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const DepartmentService = require('./DepartmentService');

const departmentService = new DepartmentService();

class StatisticsService {
  // 获取仪表板数据
  async getDashboardStatistics(userId, userRole, userDepartmentId, timeRange = '30d', filterUserId = null, filterDepartmentId = null) {
    // 计算时间范围
    const { startDate, endDate } = this.calculateDateRange(timeRange);
    
    // 根据筛选条件和角色获取用户ID列表
    let targetUserIds;
    
    if (filterUserId) {
      // 按用户筛选：只看该用户的数据
      targetUserIds = [filterUserId];
      console.log('  筛选模式: 按用户');
    } else if (filterDepartmentId) {
      // 按部门筛选：获取该部门及子部门的所有用户
      const subDeptIds = await departmentService.getSubDepartmentIds(filterDepartmentId);
      const deptIds = [filterDepartmentId, ...subDeptIds];
      
      console.log('  筛选模式: 按部门');
      console.log('  部门IDs（含子部门）:', deptIds);
      
      const users = await User.findAll({
        where: { department_id: { [Op.in]: deptIds } },
        attributes: ['id', 'username']
      });
      
      console.log('  部门内的用户:', users.map(u => ({ id: u.id, username: u.username })));
      
      targetUserIds = users.map(u => u.id);
      
      if (targetUserIds.length === 0) {
        console.warn('  ⚠️ 该部门下没有用户！');
        targetUserIds = [0]; // 使用一个不存在的ID，确保查询结果为空
      }
    } else {
      // 无筛选：按角色权限获取
      console.log('  筛选模式: 全部数据（按角色权限）');
      targetUserIds = await this.getTargetUserIds(userId, userRole, userDepartmentId);
    }
    
    console.log('📊 统计查询参数:');
    console.log('  当前用户ID:', userId, '角色:', userRole, '部门ID:', userDepartmentId);
    console.log('  筛选条件 - 用户ID:', filterUserId, '部门ID:', filterDepartmentId);
    console.log('  时间范围:', timeRange, '→', startDate, '至', endDate);
    console.log('  最终目标用户IDs:', targetUserIds);
    
    // 并行获取所有统计数据
    const [contactStats, customerStats, emailStats, salesStats] = await Promise.all([
      this.getContactStatistics(targetUserIds, startDate, endDate),
      this.getCustomerStatistics(targetUserIds, startDate, endDate),
      this.getEmailStatistics(targetUserIds, startDate, endDate),
      this.getSalesStatisticsData(targetUserIds, startDate, endDate)
    ]);
    
    console.log('📈 统计结果:');
    console.log('  联系人:', contactStats.total);
    console.log('  客户:', customerStats.total);
    console.log('  邮件 - 发送:', emailStats.sent, '接收:', emailStats.received);
    console.log('  销售:', salesStats.total_records, '笔，金额:', salesStats.total_amount);
    
    return {
      time_range: timeRange,
      start_date: startDate,
      end_date: endDate,
      contacts: contactStats,
      customers: customerStats,
      emails: emailStats,
      sales: salesStats
    };
  }

  // 计算日期范围
  calculateDateRange(timeRange) {
    // 获取当前日期（UTC零点）
    const now = new Date();
    const endDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59));
    let startDate = new Date();
    
    if (timeRange === '1d') {
      startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0));
    } else if (timeRange === '7d') {
      startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0));
    } else if (timeRange === '30d') {
      startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - 30, 0, 0, 0));
    } else if (timeRange === '3m') {
      startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 3, now.getDate(), 0, 0, 0));
    } else if (timeRange === '6m') {
      startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 6, now.getDate(), 0, 0, 0));
    } else if (timeRange === 'all') {
      // 全部时间：从2020年1月1日开始
      startDate = new Date(Date.UTC(2020, 0, 1, 0, 0, 0));
    } else if (timeRange.includes('|')) {
      // 自定义范围：'2025-10-01|2025-10-31'
      const [start, end] = timeRange.split('|');
      const startParts = start.split('-');
      const endParts = end.split('-');
      startDate = new Date(Date.UTC(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]), 0, 0, 0));
      endDate.setTime(new Date(Date.UTC(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]), 23, 59, 59)).getTime());
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }

  // 获取目标用户ID列表
  async getTargetUserIds(userId, userRole, departmentId) {
    if (userRole === 'super_admin') {
      // 超级管理员：所有用户
      const users = await User.findAll({ attributes: ['id'] });
      return users.map(u => u.id);
    }
    
    if (userRole === 'admin' && departmentId) {
      // 管理员：本部门及子部门所有用户
      const deptIds = await departmentService.getAccessibleDepartmentIds(userId, userRole, departmentId);
      const users = await User.findAll({
        where: { department_id: { [Op.in]: deptIds } },
        attributes: ['id']
      });
      return users.map(u => u.id);
    }
    
    // 普通用户：只有自己
    return [userId];
  }

  // 联系人统计
  async getContactStatistics(userIds, startDate, endDate) {
    // 构建UTC时间范围
    const startParts = startDate.split('-');
    const endParts = endDate.split('-');
    const startDateTime = new Date(Date.UTC(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]), 0, 0, 0));
    const endDateTime = new Date(Date.UTC(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]), 23, 59, 59));
    
    const whereClause = {
      user_id: { [Op.in]: userIds },
      created_at: {
        [Op.between]: [startDateTime, endDateTime]
      }
    };
    
    console.log('  联系人查询时间范围:', startDateTime.toISOString(), '至', endDateTime.toISOString());
    
    // 总数
    const total = await Contact.count({ where: whereClause });
    
    // 按日期统计
    const dailyStats = await Contact.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      raw: true
    });
    
    // 标签分布
    const tagStats = await Contact.findAll({
      where: whereClause,
      attributes: [
        'tags',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['tags'],
      raw: true
    });
    
    return {
      total,
      daily: dailyStats,
      by_tags: tagStats.filter(t => t.tags)
    };
  }

  // 客户统计
  async getCustomerStatistics(userIds, startDate, endDate) {
    // 构建UTC时间范围
    const startParts = startDate.split('-');
    const endParts = endDate.split('-');
    const startDateTime = new Date(Date.UTC(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]), 0, 0, 0));
    const endDateTime = new Date(Date.UTC(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]), 23, 59, 59));
    
    const whereClause = {
      user_id: { [Op.in]: userIds },
      created_at: {
        [Op.between]: [startDateTime, endDateTime]
      }
    };
    
    console.log('  客户查询时间范围:', startDateTime.toISOString(), '至', endDateTime.toISOString());
    
    // 总数
    const total = await Customer.count({ where: whereClause });
    
    // 按日期统计
    const dailyStats = await Customer.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      raw: true
    });
    
    // 兴趣度分布
    const interestStats = await Customer.findAll({
      where: whereClause,
      attributes: [
        'interest_level',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['interest_level'],
      raw: true
    });
    
    // 映射中文兴趣度到英文（用于前端显示）
    const mappedInterestStats = interestStats.map(item => {
      let mappedLevel = item.interest_level;
      if (item.interest_level === '高兴趣') mappedLevel = 'high';
      else if (item.interest_level === '中等兴趣') mappedLevel = 'medium';
      else if (item.interest_level === '低兴趣') mappedLevel = 'low';
      else if (item.interest_level === '无兴趣') mappedLevel = 'none';
      
      return {
        interest_level: mappedLevel,
        count: item.count
      };
    });
    
    return {
      total,
      daily: dailyStats,
      by_interest: mappedInterestStats
    };
  }

  // 邮件统计
  async getEmailStatistics(userIds, startDate, endDate) {
    // 构建UTC时间范围
    const startParts = startDate.split('-');
    const endParts = endDate.split('-');
    const startDateTime = new Date(Date.UTC(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]), 0, 0, 0));
    const endDateTime = new Date(Date.UTC(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]), 23, 59, 59));
    
    const whereClause = {
      user_id: { [Op.in]: userIds },
      send_time: {
        [Op.between]: [startDateTime, endDateTime]
      }
    };
    
    console.log('  邮件查询时间范围:', startDateTime.toISOString(), '至', endDateTime.toISOString());
    
    // 发送邮件统计
    const sentCount = await EmailHistory.count({
      where: { ...whereClause, email_type: 'sent' }
    });
    
    // 接收邮件统计
    const receivedCount = await EmailHistory.count({
      where: { ...whereClause, email_type: 'received' }
    });
    
    // 互动客户数
    const activeCustomers = await EmailHistory.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('customer_id'))), 'count']
      ],
      raw: true
    });
    
    return {
      sent: sentCount,
      received: receivedCount,
      active_customers: parseInt(activeCustomers[0]?.count || 0)
    };
  }

  // 销售统计
  async getSalesStatisticsData(userIds, startDate, endDate) {
    // sale_date 是 DATE 类型，直接使用字符串比较即可
    const whereClause = {
      user_id: { [Op.in]: userIds },
      sale_date: {
        [Op.between]: [startDate, endDate]
      }
    };
    
    console.log('  销售查询条件:');
    console.log('    - userIds:', userIds);
    console.log('    - 时间范围:', startDate, '至', endDate);
    
    // 先查询所有符合用户条件的销售记录，看看有哪些数据
    const allRecords = await SalesRecord.findAll({
      where: { user_id: { [Op.in]: userIds } },
      attributes: ['id', 'sale_date', 'product_name', 'amount'],
      order: [['sale_date', 'DESC']],
      limit: 10,
      raw: true
    });
    console.log('    - 该用户的所有销售记录（最多10条）:', allRecords);
    
    // 汇总统计
    const stats = await SalesRecord.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_records'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity']
      ],
      raw: true
    });
    
    // 按日期统计
    const dailyStats = await SalesRecord.findAll({
      where: whereClause,
      attributes: [
        'sale_date',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'amount'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'quantity']
      ],
      group: ['sale_date'],
      order: [['sale_date', 'ASC']],
      raw: true
    });
    
    console.log('    - 汇总结果:', stats[0]);
    console.log('    - 每日统计数量:', dailyStats.length);
    
    return {
      total_records: stats[0]?.total_records || 0,
      total_amount: stats[0]?.total_amount || 0,
      total_quantity: stats[0]?.total_quantity || 0,
      daily: dailyStats.map(d => ({
        date: d.sale_date,
        count: parseInt(d.count),
        amount: parseFloat(d.amount),
        quantity: parseFloat(d.quantity)
      }))
    };
  }

  /**
   * 生成数据洞察
   * 分析各项指标的趋势变化
   */
  async generateDataInsights(userId, userRole, userDepartmentId, timeRange = '30d', filterUserId = null, filterDepartmentId = null) {
    console.log('🔍 开始生成数据洞察，用户ID:', userId, '角色:', userRole);
    
    try {
      // 获取统计数据
      const stats = await this.getDashboardStatistics(userId, userRole, userDepartmentId, timeRange, filterUserId, filterDepartmentId);
      
      // 准备分析数据
      const analysisData = {
        contacts: {
          total: stats.contacts?.total || 0,
          daily: stats.contacts?.daily || []
        },
        customers: {
          total: stats.customers?.total || 0,
          daily: stats.customers?.daily || [],
          by_interest: stats.customers?.by_interest || []
        },
        emails: {
          sent: stats.emails?.sent || 0,
          received: stats.emails?.received || 0
        },
        sales: {
          total_amount: parseFloat(stats.sales?.total_amount || 0),
          total_records: stats.sales?.total_records || 0,
          daily: stats.sales?.daily || []
        },
        timeRange: timeRange
      };
      
      // 构建AI提示词
      const prompt = `你是一个专业的数据分析师。请分析以下CRM业务数据的趋势，并给出洞察。

**联系人数据：**
- 总数：${analysisData.contacts.total}
- 每日数据点：${analysisData.contacts.daily.length}天

**客户数据：**
- 总数：${analysisData.customers.total}
- 每日数据点：${analysisData.customers.daily.length}天
- 高兴趣客户：${analysisData.customers.by_interest.find(i => i.interest_level === 'high')?.count || 0}

**邮件互动：**
- 发送：${analysisData.emails.sent}
- 接收：${analysisData.emails.received}

**销售数据：**
- 成交金额：$${analysisData.sales.total_amount.toLocaleString()}
- 成交笔数：${analysisData.sales.total_records}
- 每日数据点：${analysisData.sales.daily.length}天

**时间范围：** ${timeRange}

请分析以上数据并返回JSON格式的洞察列表。每个洞察包括：
- metric: 指标名称（如"联系人增长"、"客户转化率"、"销售业绩"等）
- trend: 趋势类型（"up"上升、"down"下降、"volatile"剧烈波动、"stable"稳定）
- severity: 严重程度（"high"高、"medium"中、"low"低）
- description: 简短描述（一句话）

返回格式示例：
{
  "insights": [
    {
      "metric": "联系人增长",
      "trend": "up",
      "severity": "medium",
      "description": "联系人数量呈稳定增长趋势"
    }
  ]
}

只返回JSON，不要其他内容。`;

      const OpenAI = require('openai');
      const config = require('../config/config');
      const openai = new OpenAI({
        apiKey: config.openai.apiKey,
        baseURL: config.openai.baseUrl || config.openai.baseURL
      });

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的数据分析师，擅长分析CRM业务数据趋势。请严格按照JSON格式返回分析结果。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      });

      console.log('🤖 AI数据洞察响应:', response.choices[0].message.content);

      // 解析AI返回的JSON
      let insights = [];
      try {
        const content = response.choices[0].message.content;
        // 尝试提取JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          insights = parsed.insights || [];
        }
      } catch (parseError) {
        console.error('❌ 解析AI响应失败:', parseError);
        insights = [];
      }

      console.log('✅ 数据洞察生成成功，共', insights.length, '条');
      return insights;

    } catch (error) {
      console.error('❌ 生成数据洞察失败:', error);
      throw new Error('生成数据洞察失败: ' + error.message);
    }
  }

  /**
   * 生成AI行动建议
   * 基于当前统计数据给出具体的行动建议
   */
  async generateAISuggestions(userId, userRole, userDepartmentId, timeRange = '30d', filterUserId = null, filterDepartmentId = null) {
    console.log('🤖 开始生成AI行动建议，用户ID:', userId, '角色:', userRole);
    
    try {
      // 获取统计数据
      const stats = await this.getDashboardStatistics(userId, userRole, userDepartmentId, timeRange, filterUserId, filterDepartmentId);
      
      // 准备数据摘要
      const summary = {
        contacts: stats.contacts || {},
        customers: stats.customers || {},
        emails: stats.emails || {},
        sales: stats.sales || {},
        interest_distribution: stats.customers?.by_interest || []
      };
      
      // 分析角色和数据范围
      let dataScope = '';
      if (filterDepartmentId) {
        dataScope = '该部门';
      } else if (filterUserId) {
        dataScope = '该用户';
      } else if (userRole === 'super_admin' || userRole === 'admin') {
        dataScope = '全公司';
      } else {
        dataScope = '您';
      }
      
      // 构建AI提示词
      const prompt = `你是一个专业的CRM数据分析师。请基于以下${dataScope}的业务数据，给出3-5条具体、可执行的行动建议。

**联系人数据：**
- 总数：${summary.contacts?.total || 0}

**客户数据：**
- 总数：${summary.customers?.total || 0}
- 高兴趣客户：${summary.customers?.by_interest?.find(i => i.interest_level === 'high')?.count || 0}
- 活跃客户：${summary.customers?.active_customers || 0}

**邮件沟通：**
- 总发送：${summary.emails?.sent || 0}
- 总接收：${summary.emails?.received || 0}
- 邮件总互动：${(summary.emails?.sent || 0) + (summary.emails?.received || 0)}

**销售数据：**
- 总成交金额：$${parseFloat(summary.sales?.total_amount || 0).toLocaleString()}
- 总成交笔数：${summary.sales?.total_records || 0}
- 总销售数量：${parseFloat(summary.sales?.total_quantity || 0).toLocaleString()}

**客户兴趣分布：**
${summary.interest_distribution && summary.interest_distribution.length > 0 
  ? summary.interest_distribution.map(d => {
      const levelName = d.interest_level === 'high' ? '高兴趣' : 
                       d.interest_level === 'medium' ? '中等兴趣' :
                       d.interest_level === 'low' ? '低兴趣' : '无兴趣';
      return `- ${levelName}：${d.count}人`;
    }).join('\n')
  : '- 暂无客户数据'}

请分析以上数据，识别问题和机会，给出明确的行动建议。每条建议应该：
1. 简洁明确（一句话）
2. 具有可操作性
3. 基于数据洞察
4. 优先级从高到低排列

示例：
- 本周邮件回复率较低（XX%），建议优化邮件话术并增加跟进频次
- 有XX名高兴趣客户长时间未跟进，建议立即联系推进成交
`;

      const OpenAI = require('openai');
      const config = require('../config/config');
      const openai = new OpenAI({
        apiKey: config.openai.apiKey,
        baseURL: config.openai.baseUrl || config.openai.baseURL
      });

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的CRM数据分析师。请基于业务数据给出简洁、可执行的行动建议。必须以JSON格式返回。'
          },
          {
            role: 'user',
            content: prompt + '\n\n请严格按照以下JSON格式返回（可以使用```json代码块包裹）：\n```json\n{"suggestions": [{"priority": "high/medium/low", "action": "具体行动建议"}]}\n```'
          }
        ]
      });

      console.log('AI行动建议响应收到');

      const messageContent = response.choices[0].message.content;
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
      
      return result.suggestions || [];

    } catch (error) {
      console.error('生成AI行动建议失败:', error);
      throw new Error(`生成AI行动建议失败: ${error.message}`);
    }
  }
}

module.exports = StatisticsService;

