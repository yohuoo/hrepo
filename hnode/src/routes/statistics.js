const express = require('express');
const router = express.Router();
const { authenticateToken, requirePasswordChange } = require('../middleware/auth');
const StatisticsService = require('../services/StatisticsService');
const { User } = require('../models');

const statisticsService = new StatisticsService();

// 获取仪表板统计数据
router.get('/dashboard', authenticateToken, requirePasswordChange, async (req, res) => {
  try {
    const { time_range = '30d', user_id, department_id } = req.query;
    
    console.log('📊 接收到的筛选参数:', { time_range, user_id, department_id });
    
    const stats = await statisticsService.getDashboardStatistics(
      req.user.id,
      req.user.role,
      req.user.department_id,
      time_range,
      user_id ? parseInt(user_id) : null,
      department_id ? parseInt(department_id) : null
    );
    
    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('获取仪表板统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败',
      error: error.message
    });
  }
});

// 获取联系人统计详情
router.get('/contacts', authenticateToken, requirePasswordChange, async (req, res) => {
  try {
    const { time_range = '30d', user_id, department_id } = req.query;
    const { startDate, endDate } = statisticsService.calculateDateRange(time_range);
    
    // 权限检查和获取目标用户
    let targetUserIds = [];
    if (req.user.role === 'super_admin') {
      if (user_id) {
        targetUserIds = [parseInt(user_id)];
      } else if (department_id) {
        const users = await User.findAll({
          where: { department_id: parseInt(department_id) },
          attributes: ['id']
        });
        targetUserIds = users.map(u => u.id);
      } else {
        const users = await User.findAll({ attributes: ['id'] });
        targetUserIds = users.map(u => u.id);
      }
    } else {
      targetUserIds = [req.user.id];
    }
    
    const stats = await statisticsService.getContactStatistics(targetUserIds, startDate, endDate);
    
    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('获取联系人统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取联系人统计失败',
      error: error.message
    });
  }
});

// 获取客户统计详情
router.get('/customers', authenticateToken, requirePasswordChange, async (req, res) => {
  try {
    const { time_range = '30d', user_id } = req.query;
    const { startDate, endDate } = statisticsService.calculateDateRange(time_range);
    
    let targetUserIds = [];
    if (req.user.role === 'super_admin' && user_id) {
      targetUserIds = [parseInt(user_id)];
    } else {
      targetUserIds = [req.user.id];
    }
    
    const stats = await statisticsService.getCustomerStatistics(targetUserIds, startDate, endDate);
    
    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('获取客户统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取客户统计失败',
      error: error.message
    });
  }
});

// 获取联系人详细列表
router.get('/contacts/details', authenticateToken, requirePasswordChange, async (req, res) => {
  try {
    const { time_range = '30d' } = req.query;
    const { startDate, endDate } = statisticsService.calculateDateRange(time_range);
    
    const Contact = require('../models/Contact');
    const { Op } = require('sequelize');
    
    // 构建UTC时间范围
    const startParts = startDate.split('-');
    const endParts = endDate.split('-');
    const startDateTime = new Date(Date.UTC(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]), 0, 0, 0));
    const endDateTime = new Date(Date.UTC(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]), 23, 59, 59));
    
    const whereClause = {
      user_id: req.user.id,
      created_at: {
        [Op.between]: [startDateTime, endDateTime]
      }
    };
    
    const contacts = await Contact.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: 100
    });
    
    res.json({
      success: true,
      contacts,
      total: contacts.length
    });
  } catch (error) {
    console.error('获取联系人详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取联系人详情失败',
      error: error.message
    });
  }
});

// 获取客户详细列表
router.get('/customers/details', authenticateToken, requirePasswordChange, async (req, res) => {
  try {
    const { time_range = '30d' } = req.query;
    const { startDate, endDate } = statisticsService.calculateDateRange(time_range);
    
    const Customer = require('../models/Customer');
    const { Op } = require('sequelize');
    
    // 构建UTC时间范围
    const startParts = startDate.split('-');
    const endParts = endDate.split('-');
    const startDateTime = new Date(Date.UTC(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]), 0, 0, 0));
    const endDateTime = new Date(Date.UTC(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]), 23, 59, 59));
    
    const whereClause = {
      user_id: req.user.id,
      created_at: {
        [Op.between]: [startDateTime, endDateTime]
      }
    };
    
    const customers = await Customer.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: 100
    });
    
    res.json({
      success: true,
      customers,
      total: customers.length
    });
  } catch (error) {
    console.error('获取客户详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取客户详情失败',
      error: error.message
    });
  }
});

// AI行动建议
router.get('/ai-suggestions', authenticateToken, requirePasswordChange, async (req, res) => {
  try {
    const { time_range, user_id, department_id } = req.query;
    
    const suggestions = await statisticsService.generateAISuggestions(
      req.user.id,
      req.user.role,
      req.user.department_id,
      time_range || '30d',
      user_id ? parseInt(user_id) : null,
      department_id ? parseInt(department_id) : null
    );
    
    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('获取AI行动建议错误:', error);
    res.status(500).json({
      success: false,
      message: '获取AI行动建议失败',
      error: error.message
    });
  }
});

// 数据洞察
router.get('/data-insights', authenticateToken, requirePasswordChange, async (req, res) => {
  try {
    const { time_range, user_id, department_id } = req.query;
    
    const insights = await statisticsService.generateDataInsights(
      req.user.id,
      req.user.role,
      req.user.department_id,
      time_range || '30d',
      user_id ? parseInt(user_id) : null,
      department_id ? parseInt(department_id) : null
    );
    
    res.json({
      success: true,
      insights
    });
  } catch (error) {
    console.error('获取数据洞察错误:', error);
    res.status(500).json({
      success: false,
      message: '获取数据洞察失败',
      error: error.message
    });
  }
});

module.exports = router;

