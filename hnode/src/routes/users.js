const express = require('express');
const router = express.Router();
const { authenticateToken, requireSuperAdmin, requireAdmin } = require('../middleware/auth');
const UserService = require('../services/UserService');
const PagePermissionService = require('../services/PagePermissionService');

const userService = new UserService();
const permissionService = new PagePermissionService();

// 获取用户列表（仅管理员和超级管理员）
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { department_id, role, search, page, pageSize } = req.query;
    
    // 普通管理员只能查看自己部门及子部门的用户
    let filterDepartmentId = department_id ? parseInt(department_id) : null;
    if (req.user.role === 'admin' && !filterDepartmentId) {
      filterDepartmentId = req.user.department_id;
    }
    
    const result = await userService.getUsers({
      department_id: filterDepartmentId,
      role,
      search,
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
      requester_role: req.user.role,
      requester_department_id: req.user.department_id
    });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: error.message
    });
  }
});

// 创建用户
router.post('/', authenticateToken, async (req, res) => {
  try {
    // 权限检查：只有管理员和超级管理员可以创建用户
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '权限不足，只有管理员才能创建用户'
      });
    }
    
    const user = await userService.createUser(req.body, req.user.role);
    
    // 自动初始化用户权限（所有权限）
    try {
      await permissionService.initializeUserPermissions(user.id, user.department_id, req.user.id);
      console.log('✅ 用户权限初始化成功');
    } catch (permError) {
      console.error('⚠️ 用户权限初始化失败:', permError);
      // 不影响用户创建，只记录错误
    }
    
    res.status(201).json({
      success: true,
      user,
      message: '用户创建成功，默认密码：Admin123456'
    });
  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 更新用户
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // 权限检查
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }
    
    const userId = parseInt(req.params.id);
    const user = await userService.updateUser(userId, req.body, req.user.role);
    
    res.json({
      success: true,
      user,
      message: '用户信息更新成功'
    });
  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 重置用户密码
router.post('/:id/reset-password', authenticateToken, async (req, res) => {
  try {
    // 权限检查
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '权限不足，只有管理员才能重置密码'
      });
    }
    
    const userId = parseInt(req.params.id);
    await userService.resetPassword(userId, req.user.id, req.user.role);
    
    res.json({
      success: true,
      message: '密码已重置为：Admin123456，用户下次登录需要修改密码'
    });
  } catch (error) {
    console.error('重置密码错误:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 修改密码
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    
    if (!old_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: '请提供旧密码和新密码'
      });
    }
    
    if (new_password.length < 8) {
      return res.status(400).json({
        success: false,
        message: '新密码长度至少为8位'
      });
    }
    
    await userService.changePassword(req.user.id, old_password, new_password);
    
    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 检查密码状态
router.get('/password-status', authenticateToken, async (req, res) => {
  try {
    const status = await userService.checkPasswordStatus(req.user.id);
    
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('检查密码状态错误:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

