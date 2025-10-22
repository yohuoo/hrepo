const { Report, User, Department } = require('../models');
const StatisticsService = require('./StatisticsService');
const OpenAIService = require('./OpenAIService');
const { Op } = require('sequelize');

const statisticsService = new StatisticsService();
const openAIService = new OpenAIService();

class ReportService {
  // 生成个人报告
  async generatePersonalReport(userId, year, month, week, periodType, generatedBy) {
    // 计算时间范围
    const { startDate, endDate } = this.calculatePeriodRange(year, month, week, periodType);
    
    // 检查是否已存在
    const existingReport = await Report.findOne({
      where: {
        report_type: 'personal',
        period_type: periodType,
        year,
        month: month || null,
        week: week || null,
        user_id: userId
      }
    });
    
    // 如果已存在，更新它（不删除，避免列表中消失）
    if (existingReport) {
      console.log('📝 更新现有报告，ID:', existingReport.id);
      
      // 获取统计数据
      const stats = await statisticsService.getDashboardStatistics(
        userId,
        'user',
        null,
        `${startDate}|${endDate}`,
        userId,
        null
      );
      
      console.log('📊 个人报告数据 - 用户ID:', userId, '时间:', startDate, '至', endDate);
      console.log('📊 统计结果:', stats);
      
      // 获取用户信息
      const user = await User.findByPk(userId, {
        include: [{ model: Department, as: 'department', attributes: ['id', 'name'] }]
      });
      
      // 先更新为"生成中"状态（summary为null）
      await existingReport.update({
        summary: null,
        statistics: stats,
        start_date: startDate,
        end_date: endDate
      });
      
      // 异步生成AI内容
      this.generatePersonalReportWithAI(user, stats, periodType, year, month, week)
        .then(aiSummary => {
          existingReport.update({ summary: aiSummary });
          console.log('✅ 报告AI内容生成完成，ID:', existingReport.id);
        })
        .catch(error => {
          console.error('❌ AI生成失败，使用降级方案:', error);
          const periodText = periodType === 'month' ? `${year}年${month}月` : `${year}年${month}月第${week}周`;
          const fallbackSummary = this.generateFallbackPersonalReport(user, stats, periodText);
          existingReport.update({ summary: fallbackSummary });
        });
      
      return existingReport;
    }
    
    // 创建新报告
    // 获取统计数据
    const stats = await statisticsService.getDashboardStatistics(
      userId,
      'user',
      null,
      `${startDate}|${endDate}`,
      userId,
      null
    );
    
    console.log('📊 个人报告数据 - 用户ID:', userId, '时间:', startDate, '至', endDate);
    console.log('📊 统计结果:', stats);
    
    // 获取用户信息
    const user = await User.findByPk(userId, {
      include: [{ model: Department, as: 'department', attributes: ['id', 'name'] }]
    });
    
    // 先创建报告（summary为null表示"生成中"）
    const report = await Report.create({
      report_type: 'personal',
      period_type: periodType,
      year,
      month: month || null,
      week: week || null,
      start_date: startDate,
      end_date: endDate,
      user_id: userId,
      department_id: null,
      generated_by: generatedBy,
      summary: null,  // 生成中
      statistics: stats
    });
    
    console.log('📝 创建新报告，ID:', report.id);
    
    // 异步生成AI内容
    this.generatePersonalReportWithAI(user, stats, periodType, year, month, week)
      .then(aiSummary => {
        report.update({ summary: aiSummary });
        console.log('✅ 报告AI内容生成完成，ID:', report.id);
      })
      .catch(error => {
        console.error('❌ AI生成失败，使用降级方案:', error);
        const periodText = periodType === 'month' ? `${year}年${month}月` : `${year}年${month}月第${week}周`;
        const fallbackSummary = this.generateFallbackPersonalReport(user, stats, periodText);
        report.update({ summary: fallbackSummary });
      });
    
    return report;
  }

  // 生成部门报告
  async generateDepartmentReport(departmentId, year, month, week, periodType, generatedBy) {
    console.time('📊 部门报告总耗时');
    console.time('⏱️ 计算日期范围');
    const { startDate, endDate } = this.calculatePeriodRange(year, month, week, periodType);
    console.timeEnd('⏱️ 计算日期范围');
    
    console.time('⏱️ 查询现有报告');
    // 检查是否已存在
    let existingReport = await Report.findOne({
      where: {
        report_type: 'department',
        period_type: periodType,
        year,
        month: month || null,
        week: week || null,
        department_id: departmentId
      }
    });
    console.timeEnd('⏱️ 查询现有报告');
    
    console.time('⏱️ 获取部门信息和成员');
    // 并行查询部门信息和成员
    const DepartmentService = require('./DepartmentService');
    const deptService = new DepartmentService();
    
    const [department, subDeptIds] = await Promise.all([
      Department.findByPk(departmentId, {
        include: [{ model: User, as: 'manager', attributes: ['id', 'username', 'email'] }]
      }),
      deptService.getSubDepartmentIds(departmentId)
    ]);
    
    if (!department) {
      throw new Error('部门不存在');
    }
    
    const deptIds = [departmentId, ...subDeptIds];
    console.log('📊 部门报告 - 部门IDs（含子部门）:', deptIds);
    
    const members = await User.findAll({
      where: { department_id: { [Op.in]: deptIds }, is_active: true },
      attributes: ['id', 'username']
    });
    console.timeEnd('⏱️ 获取部门信息和成员');
    
    console.log('📊 部门报告 - 成员数:', members.length);
    
    if (members.length === 0) {
      throw new Error('该部门下没有活跃用户');
    }
    
    console.time('⏱️ 获取统计数据');
    // 获取统计数据
    const stats = await statisticsService.getDashboardStatistics(
      generatedBy,
      'super_admin',
      null,
      `${startDate}|${endDate}`,
      null,
      departmentId
    );
    console.timeEnd('⏱️ 获取统计数据');
    
    console.log('📊 部门报告统计结果 - 联系人:', stats.contacts?.total, '客户:', stats.customers?.total);
    
    // 如果已存在，更新它
    if (existingReport) {
      console.log('📝 更新现有部门报告，ID:', existingReport.id);
      
      await existingReport.update({
        summary: null,
        statistics: stats,
        start_date: startDate,
        end_date: endDate
      });
      
      console.timeEnd('📊 部门报告总耗时');
      
      // 异步生成AI内容
      console.time('🤖 AI生成部门报告');
      this.generateDepartmentReportWithAI(department, members.length, stats, periodType, year, month, week)
        .then(aiSummary => {
          existingReport.update({ summary: aiSummary });
          console.timeEnd('🤖 AI生成部门报告');
          console.log('✅ 部门报告AI内容生成完成，ID:', existingReport.id);
        })
        .catch(error => {
          console.error('❌ AI生成失败:', error);
          console.timeEnd('🤖 AI生成部门报告');
          existingReport.update({ summary: '# 报告生成失败\n\n' + error.message });
        });
      
      return existingReport;
    }
    
    console.time('⏱️ 创建报告记录');
    // 创建新报告
    const report = await Report.create({
      report_type: 'department',
      period_type: periodType,
      year,
      month: month || null,
      week: week || null,
      start_date: startDate,
      end_date: endDate,
      user_id: null,
      department_id: departmentId,
      generated_by: generatedBy,
      summary: null,  // 生成中
      statistics: stats
    });
    console.timeEnd('⏱️ 创建报告记录');
    
    console.log('📝 创建新部门报告，ID:', report.id);
    console.timeEnd('📊 部门报告总耗时');
    
    // 异步生成AI内容
    console.time('🤖 AI生成部门报告');
    this.generateDepartmentReportWithAI(department, members.length, stats, periodType, year, month, week)
      .then(aiSummary => {
        report.update({ summary: aiSummary });
        console.timeEnd('🤖 AI生成部门报告');
        console.log('✅ 部门报告AI内容生成完成，ID:', report.id);
      })
      .catch(error => {
        console.error('❌ AI生成失败:', error);
        console.timeEnd('🤖 AI生成部门报告');
        report.update({ summary: '# 报告生成失败\n\n' + error.message });
      });
    
    return report;
  }

  // 生成公司报告
  async generateCompanyReport(year, month, week, periodType, generatedBy) {
    const { startDate, endDate } = this.calculatePeriodRange(year, month, week, periodType);
    
    // 检查是否已存在
    let existingReport = await Report.findOne({
      where: {
        report_type: 'company',
        period_type: periodType,
        year,
        month: month || null,
        week: week || null
      }
    });
    
    // 不删除，而是更新
    
    // 获取所有用户统计
    const allUsers = await User.findAll({
      where: { is_active: true },
      attributes: ['id', 'username']
    });
    
    console.log('📊 公司报告 - 活跃用户数:', allUsers.length);
    
    const userIds = allUsers.map(u => u.id);
    
    if (userIds.length === 0) {
      throw new Error('公司没有活跃用户');
    }
    
    // 获取统计数据 - 不传filterUserId和filterDepartmentId，查询所有用户数据
    const stats = await statisticsService.getDashboardStatistics(
      generatedBy,
      'super_admin',
      null,
      `${startDate}|${endDate}`,
      null,  // filterUserId - 不筛选
      null   // filterDepartmentId - 不筛选，查询全公司数据
    );
    
    console.log('📊 公司报告统计结果:', stats);
    
    // 如果已存在，更新它
    if (existingReport) {
      console.log('📝 更新现有公司报告，ID:', existingReport.id);
      
      await existingReport.update({
        summary: null,
        statistics: stats,
        start_date: startDate,
        end_date: endDate
      });
      
      // 异步生成AI内容
      this.generateCompanyReportWithAI(allUsers.length, stats, periodType, year, month, week)
        .then(aiSummary => {
          existingReport.update({ summary: aiSummary });
          console.log('✅ 公司报告AI内容生成完成，ID:', existingReport.id);
        })
        .catch(error => {
          console.error('❌ AI生成失败:', error);
          existingReport.update({ summary: '# 报告生成失败\n\n' + error.message });
        });
      
      return existingReport;
    }
    
    // 创建新报告
    const report = await Report.create({
      report_type: 'company',
      period_type: periodType,
      year,
      month: month || null,
      week: week || null,
      start_date: startDate,
      end_date: endDate,
      user_id: null,
      department_id: null,
      generated_by: generatedBy,
      summary: null,  // 生成中
      statistics: stats
    });
    
    console.log('📝 创建新公司报告，ID:', report.id);
    
    // 异步生成AI内容
    this.generateCompanyReportWithAI(allUsers.length, stats, periodType, year, month, week)
      .then(aiSummary => {
        report.update({ summary: aiSummary });
        console.log('✅ 公司报告AI内容生成完成，ID:', report.id);
      })
      .catch(error => {
        console.error('❌ AI生成失败:', error);
        report.update({ summary: '# 报告生成失败\n\n' + error.message });
      });
    
    return report;
  }

  // 获取报告列表
  async getReports(userId, userRole, departmentId, filters = {}) {
    const { report_type, period_type, year, month, page = 1, pageSize = 20 } = filters;
    
    const whereClause = {};
    
    if (report_type) {
      whereClause.report_type = report_type;
    }
    
    if (period_type) {
      whereClause.period_type = period_type;
    }
    
    if (year) {
      whereClause.year = parseInt(year);
    }
    
    if (month) {
      whereClause.month = parseInt(month);
    }
    
    // 权限过滤
    if (userRole === 'user') {
      whereClause.user_id = userId;
    } else if (userRole === 'admin' && departmentId) {
      whereClause[Op.or] = [
        { user_id: userId },
        { department_id: departmentId }
      ];
    }
    
    const offset = (page - 1) * pageSize;
    
    const { count, rows } = await Report.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'generator',
          attributes: ['id', 'username']
        }
      ],
      offset,
      limit: pageSize,
      order: [['created_at', 'DESC']]
    });
    
    return {
      reports: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize)
    };
  }

  // 计算周期时间范围
  calculatePeriodRange(year, month, week, periodType) {
    let startDate, endDate;
    
    if (periodType === 'month' && month) {
      // 月报：该月1号到月底（使用UTC时间避免时区问题）
      const startDateTime = new Date(Date.UTC(year, month - 1, 1));
      const endDateTime = new Date(Date.UTC(year, month, 0));  // 下个月的第0天=当月最后一天
      
      startDate = startDateTime.toISOString().split('T')[0];
      endDate = endDateTime.toISOString().split('T')[0];
      
      console.log('📅 月报时间范围:', `${year}年${month}月`, '→', startDate, '至', endDate);
    } else if (periodType === 'week' && week && month) {
      // 周报：按自然周（周一到周日）划分，只统计当月内的日期
      const monthStart = new Date(Date.UTC(year, month - 1, 1));
      const monthEnd = new Date(Date.UTC(year, month, 0));  // 当月最后一天
      
      // 获取1号是星期几 (0=周日, 1=周一, ..., 6=周六)
      const firstDayOfWeek = monthStart.getUTCDay();
      
      // 计算当月各周的起止日期
      let weekRanges = [];
      let currentDate = new Date(monthStart);
      
      // 第1周：从1号开始到本周周日
      if (firstDayOfWeek === 0) {
        // 如果1号是周日，第1周就是1号
        weekRanges.push({
          start: new Date(currentDate),
          end: new Date(currentDate)
        });
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      } else {
        // 1号到本周周日
        const daysUntilSunday = 7 - firstDayOfWeek;
        const firstWeekEnd = new Date(currentDate.getTime() + daysUntilSunday * 24 * 60 * 60 * 1000);
        weekRanges.push({
          start: new Date(currentDate),
          end: firstWeekEnd
        });
        currentDate = new Date(firstWeekEnd.getTime() + 24 * 60 * 60 * 1000); // 下周一
      }
      
      // 后续完整周（周一到周日）
      while (currentDate <= monthEnd) {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate.getTime() + 6 * 24 * 60 * 60 * 1000);
        
        if (weekEnd > monthEnd) {
          // 最后一周，截止到月底
          weekRanges.push({
            start: weekStart,
            end: monthEnd
          });
          break;
        } else {
          weekRanges.push({
            start: weekStart,
            end: weekEnd
          });
          currentDate = new Date(weekEnd.getTime() + 24 * 60 * 60 * 1000); // 下周一
        }
      }
      
      // 检查week参数是否有效
      if (week < 1 || week > weekRanges.length) {
        throw new Error(`${month}月只有${weekRanges.length}周，请选择1-${weekRanges.length}`);
      }
      
      // 获取第N周的日期范围
      const targetWeek = weekRanges[week - 1];
      startDate = targetWeek.start.toISOString().split('T')[0];
      endDate = targetWeek.end.toISOString().split('T')[0];
      
      console.log('📅 周报时间范围:', `${year}年${month}月第${week}周`, '→', startDate, '至', endDate);
      console.log(`   (共${weekRanges.length}周)`);
    } else {
      throw new Error('无效的时间参数');
    }
    
    return {
      startDate,
      endDate
    };
  }

  // AI生成个人报告
  async generatePersonalReportWithAI(user, stats, periodType, year, month, week) {
    const periodText = periodType === 'month' ? `${year}年${month}月` : `${year}年${month}月第${week}周`;
    
    const prompt = `请为员工生成一份${periodText}的工作报告。

**员工信息：**
- 姓名：${user.username}
- 部门：${user.department ? user.department.name : '未分配'}

**数据统计：**
- 新增联系人：${stats.contacts?.total || 0} 人
- 新增客户：${stats.customers?.total || 0} 家
- 发送邮件：${stats.emails?.sent || 0} 封
- 接收邮件：${stats.emails?.received || 0} 封
- 销售额：$${stats.sales?.total_amount || 0}
- 销售记录：${stats.sales?.total_records || 0} 笔

请生成一份专业的工作报告，包含以下部分：
1. **数据概览** - 用表格或列表展示关键数据
2. **工作亮点** - 分析优秀表现
3. **需要改进** - 指出不足之处
4. **趋势分析** - 对比历史数据（如果有）
5. **下月/下周建议** - 给出可行建议

使用Markdown格式，专业、客观、数据驱动。`;

    try {
      const aiResponse = await openAIService.generateCompletion([
        { role: 'system', content: '你是一个专业的HR数据分析师，擅长生成工作报告。' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.7,
        maxTokens: 2000
      });
      
      return aiResponse;
    } catch (error) {
      console.error('AI生成报告失败:', error);
      return this.generateFallbackPersonalReport(user, stats, periodText);
    }
  }

  // AI生成部门报告
  async generateDepartmentReportWithAI(department, memberCount, stats, periodType, year, month, week) {
    const periodText = periodType === 'month' ? `${year}年${month}月` : `${year}年${month}月第${week}周`;
    
    const prompt = `请为部门生成一份${periodText}的工作报告。

**部门信息：**
- 部门名称：${department.name}
- 部门人数：${memberCount} 人
- 部门主管：${department.manager ? department.manager.username : '未设置'}

**整体数据统计：**
- 新增联系人：${stats.contacts?.total || 0} 人
- 新增客户：${stats.customers?.total || 0} 家
- 发送邮件：${stats.emails?.sent || 0} 封
- 接收邮件：${stats.emails?.received || 0} 封
- 销售额：$${stats.sales?.total_amount || 0}

请生成一份部门工作报告，包含：
1. **部门概览** - 整体表现
2. **关键指标** - 重要数据
3. **团队亮点** - 优秀成果
4. **改进方向** - 提升空间
5. **下期目标** - 具体建议

使用Markdown格式。`;

    try {
      const aiResponse = await openAIService.generateCompletion([
        { role: 'system', content: '你是一个专业的团队管理顾问。' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.7,
        maxTokens: 2500
      });
      
      return aiResponse;
    } catch (error) {
      console.error('AI生成部门报告失败:', error);
      return this.generateFallbackDepartmentReport(department, memberCount, stats, periodText);
    }
  }

  // AI生成公司报告
  async generateCompanyReportWithAI(totalUsers, stats, periodType, year, month, week) {
    const periodText = periodType === 'month' ? `${year}年${month}月` : `${year}年${month}月第${week}周`;
    
    const prompt = `请为公司生成一份${periodText}的运营报告。

**公司规模：**
- 总员工数：${totalUsers} 人

**整体业绩：**
- 新增联系人：${stats.contacts?.total || 0} 人
- 新增客户：${stats.customers?.total || 0} 家
- 邮件互动：发送${stats.emails?.sent || 0}封，接收${stats.emails?.received || 0}封
- 销售业绩：$${stats.sales?.total_amount || 0}

请生成一份公司运营报告，包含：
1. **运营概览** - 整体情况
2. **业绩分析** - 销售和客户数据
3. **市场表现** - 客户获取和转化
4. **战略建议** - 公司级别的建议

使用Markdown格式，高管视角。`;

    try {
      const aiResponse = await openAIService.generateCompletion([
        { role: 'system', content: '你是一个资深的企业运营顾问。' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.7,
        maxTokens: 3000
      });
      
      return aiResponse;
    } catch (error) {
      console.error('AI生成公司报告失败:', error);
      return this.generateFallbackCompanyReport(totalUsers, stats, periodText);
    }
  }

  // 降级方案：生成简单的个人报告
  generateFallbackPersonalReport(user, stats, periodText) {
    return `# ${periodText} 个人工作报告

## 📊 数据概览

- **新增联系人**: ${stats.contacts?.total || 0} 人
- **新增客户**: ${stats.customers?.total || 0} 家
- **发送邮件**: ${stats.emails?.sent || 0} 封
- **接收邮件**: ${stats.emails?.received || 0} 封
- **销售额**: $${stats.sales?.total_amount || 0}
- **销售记录**: ${stats.sales?.total_records || 0} 笔

## 💼 工作总结

本期内共新增客户${stats.customers?.total || 0}家，发送邮件${stats.emails?.sent || 0}封，完成销售额$${stats.sales?.total_amount || 0}。

*AI生成失败，以上为自动生成的基础报告。*
`;
  }

  // 降级方案：生成简单的部门报告
  generateFallbackDepartmentReport(department, memberCount, stats, periodText) {
    return `# ${periodText} ${department.name} 部门工作报告

## 📊 部门概况

- **部门人数**: ${memberCount} 人
- **部门主管**: ${department.manager ? department.manager.username : '未设置'}

## 📈 整体数据

- **新增联系人**: ${stats.contacts?.total || 0} 人
- **新增客户**: ${stats.customers?.total || 0} 家
- **邮件互动**: 发送${stats.emails?.sent || 0}封，接收${stats.emails?.received || 0}封
- **销售业绩**: $${stats.sales?.total_amount || 0}

*AI生成失败，以上为自动生成的基础报告。*
`;
  }

  // 降级方案：生成简单的公司报告
  generateFallbackCompanyReport(totalUsers, stats, periodText) {
    return `# ${periodText} 公司运营报告

## 📊 公司概况

- **总员工数**: ${totalUsers} 人

## 📈 整体业绩

- **新增联系人**: ${stats.contacts?.total || 0} 人
- **新增客户**: ${stats.customers?.total || 0} 家
- **邮件互动**: 发送${stats.emails?.sent || 0}封，接收${stats.emails?.received || 0}封
- **销售业绩**: $${stats.sales?.total_amount || 0}

*AI生成失败，以上为自动生成的基础报告。*
`;
  }
}

module.exports = ReportService;

