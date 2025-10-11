const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const DepartmentService = require('../services/DepartmentService');
const PagePermissionService = require('../services/PagePermissionService');

const departmentService = new DepartmentService();
const permissionService = new PagePermissionService();

// 获取部门树
router.get('/tree', authenticateToken, async (req, res) => {
  try {
    const tree = await departmentService.getDepartmentTree();
    
    res.json({
      success: true,
      departments: tree
    });
  } catch (error) {
    console.error('获取部门树错误:', error);
    res.status(500).json({
      success: false,
      message: '获取部门树失败',
      error: error.message
    });
  }
});

// 获取部门详情
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const departmentId = parseInt(req.params.id);
    const department = await departmentService.getDepartmentById(departmentId);
    
    res.json({
      success: true,
      department
    });
  } catch (error) {
    console.error('获取部门详情错误:', error);
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

// 创建部门（仅超级管理员）
router.post('/', authenticateToken, async (req, res) => {
  try {
    // 权限检查
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: '权限不足，仅超级管理员可以创建部门'
      });
    }
    
    const { name, parent_id, manager_id, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: '部门名称不能为空'
      });
    }
    
    const department = await departmentService.createDepartment({
      name,
      parent_id,
      manager_id,
      description
    });
    
    // 自动初始化部门权限（所有权限）
    try {
      await permissionService.initializeDepartmentPermissions(department.id, req.user.id);
      console.log('✅ 部门权限初始化成功');
    } catch (permError) {
      console.error('⚠️ 部门权限初始化失败:', permError);
      // 不影响部门创建，只记录错误
    }
    
    res.status(201).json({
      success: true,
      department,
      message: '部门创建成功'
    });
  } catch (error) {
    console.error('创建部门错误:', error);
    res.status(500).json({
      success: false,
      message: '创建部门失败',
      error: error.message
    });
  }
});

// 更新部门（仅超级管理员）
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // 权限检查
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: '权限不足，仅超级管理员可以修改部门'
      });
    }
    
    const departmentId = parseInt(req.params.id);
    const department = await departmentService.updateDepartment(departmentId, req.body);
    
    res.json({
      success: true,
      department,
      message: '部门更新成功'
    });
  } catch (error) {
    console.error('更新部门错误:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 删除部门（仅超级管理员）
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // 权限检查
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: '权限不足，仅超级管理员可以删除部门'
      });
    }
    
    const departmentId = parseInt(req.params.id);
    await departmentService.deleteDepartment(departmentId);
    
    res.json({
      success: true,
      message: '部门删除成功'
    });
  } catch (error) {
    console.error('删除部门错误:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取部门成员
router.get('/:id/members', authenticateToken, async (req, res) => {
  try {
    const departmentId = parseInt(req.params.id);
    const includeSubDepartments = req.query.includeSubDepartments === 'true';
    
    const members = await departmentService.getDepartmentMembers(
      departmentId,
      includeSubDepartments
    );
    
    res.json({
      success: true,
      members,
      total: members.length
    });
  } catch (error) {
    console.error('获取部门成员错误:', error);
    res.status(500).json({
      success: false,
      message: '获取部门成员失败',
      error: error.message
    });
  }
});

module.exports = router;

