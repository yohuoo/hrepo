const express = require('express');
const router = express.Router();
const { checkPagePermission } = require('../middleware/permission');
const PagePermissionService = require('../services/PagePermissionService');

const permissionService = new PagePermissionService();

// 中间件：检查登录状态并加载用户权限
async function checkAuth(req, res, next) {
  try {
    // 从cookie或header中获取token
    const token = req.cookies.authToken || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      console.log('⚠️ 未找到认证token，重定向到登录页');
      return res.redirect('/login');
    }
    
    // 验证JWT token
    const jwt = require('jsonwebtoken');
    const config = require('../config/config');
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // 从数据库获取用户信息
    const { User } = require('../models');
    const user = await User.findByPk(decoded.id);
    
    if (!user || !user.is_active) {
      console.log('⚠️ 用户不存在或已禁用，重定向到登录页');
      return res.redirect('/login');
    }
    
    // 设置用户信息
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: user.is_admin,
      role: user.role,
      department_id: user.department_id,
      password_changed: user.password_changed
    };
    
    // 加载用户权限（用于侧边栏显示）
    try {
      const permissions = await permissionService.getUserPermissions(
        user.id,
        user.department_id,
        user.role
      );
      req.userPermissions = permissions;
      res.locals.userPermissions = permissions; // 直接设置到 res.locals
      console.log(`📋 用户 ${user.username} 拥有 ${permissions.length} 个权限:`, permissions.slice(0, 5));
    } catch (permError) {
      console.error('⚠️ 加载用户权限失败:', permError);
      req.userPermissions = [];
      res.locals.userPermissions = [];
    }
    
    next();
  } catch (error) {
    console.error('认证失败:', error.message);
    res.redirect('/login');
  }
}

// 中间件：已登录则跳转到dashboard
function redirectIfAuth(req, res, next) {
  // 暂时跳过重定向
  next();
}

// ==================== 根路径重定向 ====================
router.get('/', (req, res) => {
  // 检查是否登录
  const token = req.cookies.authToken;
  if (token) {
    // 已登录，跳转到dashboard
    res.redirect('/dashboard');
  } else {
    // 未登录，跳转到登录页
    res.redirect('/login');
  }
});

// ==================== 认证页面 ====================
router.get('/login', redirectIfAuth, (req, res) => {
  res.render('pages/auth/login', {
    title: '登录 - CRM系统'
  });
});

router.get('/register', redirectIfAuth, (req, res) => {
  res.render('pages/auth/register', {
    title: '注册 - CRM系统'
  });
});

// 修改密码页面（独立页面，不使用layout）
router.get('/change-password', (req, res) => {
  res.render('pages/auth/change-password', {
    layout: false
  });
});

router.get('/logout', (req, res) => {
  res.clearCookie('authToken');
  if (req.session) {
    req.session.destroy();
  }
  res.redirect('/login');
});

// ==================== 主要页面 ====================
router.get('/', (req, res) => {
  res.redirect('/dashboard');
});

router.get('/dashboard', checkAuth, checkPagePermission('dashboard'), (req, res) => {
  res.render('pages/dashboard/index', {
    title: '控制台 - CRM系统',
    user: req.user,
    currentPath: '/dashboard'
  });
});

// ==================== 联系人 ====================
router.get('/contacts', checkAuth, checkPagePermission('contacts.list'), (req, res) => {
  res.render('pages/contacts/index', {
    title: '联系人管理 - CRM系统',
    user: req.user,
    currentPath: '/contacts'
  });
});

// ==================== 客户 ====================
router.get('/customers', checkAuth, checkPagePermission('customers.list'), (req, res) => {
  res.render('pages/customers/index', {
    title: '客户管理 - CRM系统',
    user: req.user,
    currentPath: '/customers'
  });
});

// ==================== 邮件 ====================
router.get('/emails/inbox', checkAuth, checkPagePermission('emails.inbox'), (req, res) => {
  res.render('pages/emails/inbox', {
    title: '收件箱 - CRM系统',
    user: req.user,
    currentPath: '/emails/inbox'
  });
});

router.get('/emails/sent', checkAuth, checkPagePermission('emails.sent'), (req, res) => {
  res.render('pages/emails/sent', {
    title: '发件箱 - CRM系统',
    user: req.user,
    currentPath: '/emails/sent'
  });
});

router.get('/emails/compose', checkAuth, checkPagePermission('emails.compose'), (req, res) => {
  res.render('pages/emails/compose', {
    title: '写邮件 - CRM系统',
    user: req.user,
    currentPath: '/emails/compose'
  });
});

router.get('/emails/templates', checkAuth, checkPagePermission('emails.templates'), (req, res) => {
  res.render('pages/emails/templates', {
    title: '邮件模板 - CRM系统',
    user: req.user,
    currentPath: '/emails/templates'
  });
});

// ==================== 会议记录 ====================
router.get('/meetings', checkAuth, checkPagePermission('meetings'), (req, res) => {
  res.render('pages/meetings/index', {
    title: '会议记录 - CRM系统',
    user: req.user,
    currentPath: '/meetings'
  });
});

// ==================== 设置 ====================
router.get('/settings', checkAuth, checkPagePermission('settings'), (req, res) => {
  res.render('pages/settings/index', {
    title: '系统设置 - CRM系统',
    user: req.user,
    currentPath: '/settings'
  });
});

router.get('/settings/email', checkAuth, checkPagePermission('settings.email'), (req, res) => {
  res.render('pages/settings/email', {
    title: '邮箱配置 - CRM系统',
    user: req.user,
    currentPath: '/settings/email'
  });
});

// 部门管理页面（通过权限系统控制）
router.get('/settings/departments', checkAuth, checkPagePermission('settings.departments'), (req, res) => {
  res.render('pages/settings/departments', {
    title: '部门管理 - CRM系统',
    user: req.user,
    currentPath: '/settings/departments'
  });
});

// 用户管理页面（通过权限系统控制）
router.get('/settings/users', checkAuth, checkPagePermission('settings.users'), (req, res) => {
  res.render('pages/settings/users', {
    title: '用户管理 - CRM系统',
    user: req.user,
    currentPath: '/settings/users'
  });
});

// 销售数据页面
router.get('/sales', checkAuth, checkPagePermission('sales'), (req, res) => {
  res.render('pages/sales/index', {
    title: '销售数据 - CRM系统',
    user: req.user,
    currentPath: '/sales'
  });
});

// 数据统计页面
router.get('/statistics', checkAuth, checkPagePermission('statistics'), (req, res) => {
  res.render('pages/statistics/index', {
    title: '数据统计 - CRM系统',
    user: req.user,
    currentPath: '/statistics'
  });
});

// 数据报告页面
router.get('/reports', checkAuth, checkPagePermission('reports'), (req, res) => {
  res.render('pages/reports/index', {
    title: '数据报告 - CRM系统',
    user: req.user,
    currentPath: '/reports'
  });
});

// 通知测试页面
router.get('/test/notifications', checkAuth, (req, res) => {
  res.render('pages/test/notifications', {
    title: '通知系统测试 - CRM系统',
    user: req.user,
    currentPath: '/test/notifications'
  });
});

// 案例总结页面
router.get('/case-studies', checkAuth, checkPagePermission('case_studies'), (req, res) => {
  res.render('pages/case-studies/index', {
    title: '案例总结 - CRM系统',
    user: req.user,
    currentPath: '/case-studies'
  });
});

// 页面权限管理页面（仅超级管理员）
router.get('/settings/page-permissions', checkAuth, (req, res) => {
  // 权限检查：只有超级管理员可以访问
  if (req.user.role !== 'super_admin') {
    return res.status(403).render('errors/403', {
      message: '只有超级管理员可以访问页面权限管理'
    });
  }
  
  res.render('pages/settings/page-permissions', {
    title: '页面权限管理 - CRM系统',
    user: req.user,
    currentPath: '/settings/page-permissions'
  });
});

module.exports = router;
