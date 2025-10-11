const express = require('express');
const router = express.Router();
const { authenticateToken, requirePasswordChange } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/permission');
const PagePermissionService = require('../services/PagePermissionService');

const permissionService = new PagePermissionService();

/**
 * 获取页面树结构
 */
router.get('/pages/tree', authenticateToken, requirePasswordChange, requireSuperAdmin, async (req, res) => {
  try {
    const tree = await permissionService.getPageTree();
    
    res.json({
      success: true,
      tree
    });
  } catch (error) {
    console.error('获取页面树失败:', error);
    res.status(500).json({
      success: false,
      message: '获取页面树失败',
      error: error.message
    });
  }
});

/**
 * 获取目标的权限配置
 */
router.get('/target/:targetType/:targetId', authenticateToken, requirePasswordChange, requireSuperAdmin, async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    
    if (!['department', 'user'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: '目标类型无效'
      });
    }
    
    const permissions = await permissionService.getTargetPermissions(targetType, parseInt(targetId));
    
    res.json({
      success: true,
      permissions
    });
  } catch (error) {
    console.error('获取权限配置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取权限配置失败',
      error: error.message
    });
  }
});

/**
 * 更新目标的权限配置
 */
router.put('/target/:targetType/:targetId', authenticateToken, requirePasswordChange, requireSuperAdmin, async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const { permissions } = req.body;
    
    if (!['department', 'user'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: '目标类型无效'
      });
    }
    
    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: '权限数据格式错误'
      });
    }
    
    const result = await permissionService.updateTargetPermissions(
      targetType,
      parseInt(targetId),
      permissions,
      req.user.id,
      req.user.username,
      req.ip,
      req.headers['user-agent']
    );
    
    res.json({
      success: true,
      message: '权限更新成功',
      result
    });
  } catch (error) {
    console.error('更新权限失败:', error);
    res.status(500).json({
      success: false,
      message: '更新权限失败',
      error: error.message
    });
  }
});

/**
 * 获取权限审计日志
 */
router.get('/audit-logs', authenticateToken, requirePasswordChange, requireSuperAdmin, async (req, res) => {
  try {
    const { page, page_size, target_type, target_id } = req.query;
    
    const result = await permissionService.getAuditLogs({
      page: page ? parseInt(page) : 1,
      pageSize: page_size ? parseInt(page_size) : 50,
      targetType: target_type,
      targetId: target_id ? parseInt(target_id) : null
    });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('获取审计日志失败:', error);
    res.status(500).json({
      success: false,
      message: '获取审计日志失败',
      error: error.message
    });
  }
});

module.exports = router;

