const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config/config');
const { sessionManager } = require('../config/redis');

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 验证必填字段
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名、邮箱和密码都是必需的'
      });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: '邮箱格式不正确'
      });
    }

    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少为6位'
      });
    }

    // 检查用户名是否已存在
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }

    // 检查邮箱是否已存在
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: '邮箱已被注册'
      });
    }

    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    console.log(`🔐 注册用户 ${username}:`);
    console.log(`  - 原始密码: ${password}`);
    console.log(`  - Hash长度: ${hashedPassword.length}`);
    console.log(`  - Hash前20字符: ${hashedPassword.substring(0, 20)}...`);

    // 创建用户
    const user = await User.create({
      username,
      email,
      hashed_password: hashedPassword,
      is_active: true,
      is_admin: false
    });
    
    console.log(`✅ 用户创建成功，ID: ${user.id}`);

    // 生成JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn
      }
    );

    // 保存会话到Redis
    await sessionManager.saveSession(
      user.id,
      token,
      {
        username: user.username,
        email: user.email,
        is_active: user.is_active,
        is_admin: user.is_admin
      },
      7 * 24 * 60 * 60 // 7天
    );

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_active: user.is_active,
        is_admin: user.is_admin,
        created_at: user.created_at
      },
      token,
      message: '注册成功'
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '注册失败',
      error: error.message
    });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码都是必需的'
      });
    }

    console.log(`🔍 登录尝试: ${username}`);
    
    // 查找用户（支持用户名或邮箱登录）
    const user = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { username },
          { email: username }
        ]
      }
    });

    if (!user) {
      console.log(`❌ 用户不存在: ${username}`);
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    console.log(`✅ 找到用户: ID=${user.id}, Username=${user.username}`);
    console.log(`  - 数据库Hash长度: ${user.hashed_password.length}`);
    console.log(`  - 数据库Hash前20字符: ${user.hashed_password.substring(0, 20)}...`);
    console.log(`  - 输入密码: ${password}`);

    // 检查用户是否激活
    if (!user.is_active) {
      console.log(`❌ 用户已禁用: ${username}`);
      return res.status(403).json({
        success: false,
        message: '账户已被禁用，请联系管理员'
      });
    }

    // 验证密码
    console.log(`🔐 开始验证密码...`);
    const isPasswordValid = await bcrypt.compare(password, user.hashed_password);
    console.log(`  - 验证结果: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
      console.log(`❌ 密码验证失败`);
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    console.log(`✅ 密码验证通过`);

    // 生成JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn
      }
    );

    // 保存会话到Redis
    await sessionManager.saveSession(
      user.id,
      token,
      {
        username: user.username,
        email: user.email,
        is_active: user.is_active,
        is_admin: user.is_admin
      },
      7 * 24 * 60 * 60 // 7天
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        department_id: user.department_id,
        role: user.role,
        is_active: user.is_active,
        is_admin: user.is_admin,
        password_changed: user.password_changed,
        created_at: user.created_at
      },
      token,
      requires_password_change: !user.password_changed,
      message: '登录成功'
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
});

// 获取当前用户信息
router.get('/me', require('../middleware/auth').authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'email', 'is_active', 'is_admin', 'created_at', 'updated_at']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    });
  }
});

// 用户登出
router.post('/logout', require('../middleware/auth').authenticateToken, async (req, res) => {
  try {
    // 从Redis中删除会话
    await sessionManager.deleteSession(req.token, req.user.id);

    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({
      success: false,
      message: '登出失败',
      error: error.message
    });
  }
});

// 登出所有设备
router.post('/logout-all', require('../middleware/auth').authenticateToken, async (req, res) => {
  try {
    // 删除用户的所有会话
    const count = await sessionManager.deleteAllUserSessions(req.user.id);

    res.json({
      success: true,
      message: `已登出${count}个设备`,
      sessions_deleted: count
    });
  } catch (error) {
    console.error('登出所有设备错误:', error);
    res.status(500).json({
      success: false,
      message: '登出失败',
      error: error.message
    });
  }
});

// 获取当前用户的所有活跃会话
router.get('/sessions', require('../middleware/auth').authenticateToken, async (req, res) => {
  try {
    const sessions = await sessionManager.getUserSessions(req.user.id);

    res.json({
      success: true,
      sessions,
      total: sessions.length,
      message: '获取会话列表成功'
    });
  } catch (error) {
    console.error('获取会话列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取会话列表失败',
      error: error.message
    });
  }
});

module.exports = router;
