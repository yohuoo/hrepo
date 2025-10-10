const express = require('express');
const router = express.Router();

// 中间件：检查登录状态
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
      is_admin: user.is_admin
    };
    
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

router.get('/dashboard', checkAuth, (req, res) => {
  res.render('pages/dashboard/index', {
    title: '控制台 - CRM系统',
    user: req.user,
    currentPath: '/dashboard'
  });
});

// ==================== 联系人 ====================
router.get('/contacts', checkAuth, (req, res) => {
  res.render('pages/contacts/index', {
    title: '联系人管理 - CRM系统',
    user: req.user,
    currentPath: '/contacts'
  });
});

// ==================== 客户 ====================
router.get('/customers', checkAuth, (req, res) => {
  res.render('pages/customers/index', {
    title: '客户管理 - CRM系统',
    user: req.user,
    currentPath: '/customers'
  });
});

// ==================== 邮件 ====================
router.get('/emails/inbox', checkAuth, (req, res) => {
  res.render('pages/emails/inbox', {
    title: '收件箱 - CRM系统',
    user: req.user,
    currentPath: '/emails/inbox'
  });
});

router.get('/emails/sent', checkAuth, (req, res) => {
  res.render('pages/emails/sent', {
    title: '发件箱 - CRM系统',
    user: req.user,
    currentPath: '/emails/sent'
  });
});

router.get('/emails/compose', checkAuth, (req, res) => {
  res.render('pages/emails/compose', {
    title: '写邮件 - CRM系统',
    user: req.user,
    currentPath: '/emails/compose'
  });
});

router.get('/emails/templates', checkAuth, (req, res) => {
  res.render('pages/emails/templates', {
    title: '邮件模板 - CRM系统',
    user: req.user,
    currentPath: '/emails/templates'
  });
});

// ==================== 会议记录 ====================
router.get('/meetings', checkAuth, (req, res) => {
  res.render('pages/meetings/index', {
    title: '会议记录 - CRM系统',
    user: req.user,
    currentPath: '/meetings'
  });
});

// ==================== 设置 ====================
router.get('/settings', checkAuth, (req, res) => {
  res.render('pages/settings/index', {
    title: '系统设置 - CRM系统',
    user: req.user,
    currentPath: '/settings'
  });
});

router.get('/settings/email', checkAuth, (req, res) => {
  res.render('pages/settings/email', {
    title: '邮箱配置 - CRM系统',
    user: req.user,
    currentPath: '/settings/email'
  });
});

module.exports = router;
