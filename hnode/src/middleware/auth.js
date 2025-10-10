const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { User } = require('../models');
const { sessionManager } = require('../config/redis');

// JWT + Redis会话认证中间件
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问令牌缺失，请先登录'
      });
    }

    // 1. 先验证JWT token的有效性
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: '无效的访问令牌'
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: '访问令牌已过期，请重新登录'
        });
      }
      throw error;
    }

    // 2. 验证Redis中的会话是否存在
    const session = await sessionManager.getSession(token);
    if (!session) {
      return res.status(401).json({
        success: false,
        message: '会话已失效，请重新登录'
      });
    }

    // 3. 验证用户是否存在且激活
    const user = await User.findByPk(decoded.id);
    if (!user || !user.is_active) {
      // 会话无效，删除Redis中的会话
      await sessionManager.deleteSession(token, decoded.id);
      return res.status(401).json({
        success: false,
        message: '用户不存在或已被禁用'
      });
    }

    // 4. 刷新会话过期时间（活跃用户自动续期）
    await sessionManager.refreshSession(token);

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      is_active: user.is_active,
      is_admin: user.is_admin
    };
    req.token = token; // 保存token供后续使用
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '认证验证失败',
      error: error.message
    });
  }
};

// JWT token验证中间件（完整版本）
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问令牌缺失'
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: '用户不存在或已被禁用'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的访问令牌'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '访问令牌已过期'
      });
    }
    return res.status(500).json({
      success: false,
      message: '认证验证失败',
      error: error.message
    });
  }
};

module.exports = {
  authenticateToken,
  verifyToken
};
