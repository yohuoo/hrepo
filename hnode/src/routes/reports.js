const express = require('express');
const router = express.Router();
const { authenticateToken, requirePasswordChange, requireAdmin, requireSuperAdmin } = require('../middleware/auth');
const ReportService = require('../services/ReportService');
const { Report, User, Department } = require('../models');

const reportService = new ReportService();

// 生成个人报告
router.post('/personal', authenticateToken, requirePasswordChange, async (req, res) => {
  try {
    const { year, month, week, period_type = 'month' } = req.body;
    
    const report = await reportService.generatePersonalReport(
      req.user.id,
      parseInt(year),
      month ? parseInt(month) : null,
      week ? parseInt(week) : null,
      period_type,
      req.user.id
    );
    
    res.json({
      success: true,
      report,
      message: '个人报告生成成功'
    });
  } catch (error) {
    console.error('生成个人报告错误:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 为指定用户生成报告（仅管理员和超级管理员）
router.post('/user/:userId', authenticateToken, requirePasswordChange, requireAdmin, async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.userId);
    const { year, month, week, period_type = 'month' } = req.body;
    
    // 权限检查：管理员只能为本部门用户生成报告
    if (req.user.role === 'admin') {
      const targetUser = await User.findByPk(targetUserId);
      if (!targetUser || targetUser.department_id !== req.user.department_id) {
        return res.status(403).json({
          success: false,
          message: '只能为本部门用户生成报告'
        });
      }
    }
    
    const report = await reportService.generatePersonalReport(
      targetUserId,
      parseInt(year),
      month ? parseInt(month) : null,
      week ? parseInt(week) : null,
      period_type,
      req.user.id
    );
    
    res.json({
      success: true,
      report,
      message: '用户报告生成成功'
    });
  } catch (error) {
    console.error('生成用户报告错误:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 生成部门报告（管理员及以上）
router.post('/department/:departmentId', authenticateToken, requirePasswordChange, requireAdmin, async (req, res) => {
  try {
    const departmentId = parseInt(req.params.departmentId);
    const { year, month, week, period_type = 'month' } = req.body;
    
    // 权限检查：管理员只能生成自己部门的报告
    if (req.user.role === 'admin' && req.user.department_id !== departmentId) {
      return res.status(403).json({
        success: false,
        message: '只能生成本部门的报告'
      });
    }
    
    const report = await reportService.generateDepartmentReport(
      departmentId,
      parseInt(year),
      month ? parseInt(month) : null,
      week ? parseInt(week) : null,
      period_type,
      req.user.id
    );
    
    res.json({
      success: true,
      report,
      message: '部门报告生成成功'
    });
  } catch (error) {
    console.error('生成部门报告错误:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 生成公司报告（仅超级管理员）
router.post('/company', authenticateToken, requirePasswordChange, requireSuperAdmin, async (req, res) => {
  try {
    const { year, month, week, period_type = 'month' } = req.body;
    
    const report = await reportService.generateCompanyReport(
      parseInt(year),
      month ? parseInt(month) : null,
      week ? parseInt(week) : null,
      period_type,
      req.user.id
    );
    
    res.json({
      success: true,
      report,
      message: '公司报告生成成功'
    });
  } catch (error) {
    console.error('生成公司报告错误:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取报告列表
router.get('/', authenticateToken, requirePasswordChange, async (req, res) => {
  try {
    const result = await reportService.getReports(
      req.user.id,
      req.user.role,
      req.user.department_id,
      req.query
    );
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('获取报告列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取报告列表失败',
      error: error.message
    });
  }
});

// 获取报告详情
router.get('/:id', authenticateToken, requirePasswordChange, async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    
    const report = await Report.findByPk(reportId, {
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
      ]
    });
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: '报告不存在'
      });
    }
    
    // 权限检查
    if (req.user.role === 'user' && report.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }
    
    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('获取报告详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取报告详情失败',
      error: error.message
    });
  }
});

module.exports = router;

