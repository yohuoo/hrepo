const Redis = require('ioredis');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB) || 0,
  retryStrategy: (times) => {
    // 最多重试3次，然后放弃
    if (times > 3) {
      console.warn('⚠️  Redis连接失败，会话管理将不可用');
      return null;
    }
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false, // 离线时不排队
  lazyConnect: true // 延迟连接
};

// 创建Redis客户端
const redisClient = new Redis(redisConfig);

let isRedisAvailable = false;

// 连接事件
redisClient.on('connect', () => {
  console.log('✅ Redis连接成功');
  isRedisAvailable = true;
});

redisClient.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') {
    if (!isRedisAvailable) {
      console.warn('⚠️  Redis未启动，会话管理将降级为仅JWT模式');
    }
  } else {
    console.error('❌ Redis错误:', err.message);
  }
  isRedisAvailable = false;
});

redisClient.on('ready', () => {
  console.log('✅ Redis准备就绪');
  isRedisAvailable = true;
});

redisClient.on('close', () => {
  console.warn('⚠️  Redis连接已关闭');
  isRedisAvailable = false;
});

// 尝试连接（不阻塞启动）
redisClient.connect().catch(err => {
  console.warn('⚠️  Redis初始化连接失败，将在需要时自动重试:', err.message);
});

// 会话管理辅助函数
const sessionManager = {
  // 保存用户会话
  async saveSession(userId, token, userData, expiresIn = 604800) {
    if (!isRedisAvailable) {
      console.warn('⚠️  Redis不可用，跳过会话保存（仅使用JWT）');
      return true; // 返回true，允许继续
    }
    
    try {
      const sessionKey = `session:${token}`;
      const userSessionsKey = `user:${userId}:sessions`;
      
      // 保存会话数据
      await redisClient.setex(
        sessionKey,
        expiresIn, // 默认7天
        JSON.stringify({
          userId,
          ...userData,
          createdAt: new Date().toISOString()
        })
      );
      
      // 保存到用户会话列表
      await redisClient.sadd(userSessionsKey, token);
      
      return true;
    } catch (error) {
      console.error('⚠️  保存会话失败，降级为仅JWT模式:', error.message);
      return true; // 返回true，允许继续
    }
  },

  // 获取会话
  async getSession(token) {
    if (!isRedisAvailable) {
      // Redis不可用时，返回一个有效对象（降级为仅JWT验证）
      return { degraded: true };
    }
    
    try {
      const sessionKey = `session:${token}`;
      const sessionData = await redisClient.get(sessionKey);
      
      if (!sessionData) {
        return null;
      }
      
      return JSON.parse(sessionData);
    } catch (error) {
      console.error('⚠️  获取会话失败，降级为仅JWT模式:', error.message);
      return { degraded: true }; // 降级模式
    }
  },

  // 删除会话（登出）
  async deleteSession(token, userId = null) {
    if (!isRedisAvailable) {
      console.warn('⚠️  Redis不可用，跳过会话删除');
      return true;
    }
    
    try {
      const sessionKey = `session:${token}`;
      
      // 如果提供了userId，从用户会话列表中移除
      if (userId) {
        const userSessionsKey = `user:${userId}:sessions`;
        await redisClient.srem(userSessionsKey, token);
      }
      
      // 删除会话
      await redisClient.del(sessionKey);
      
      return true;
    } catch (error) {
      console.error('⚠️  删除会话失败:', error.message);
      return true; // 返回true，允许继续
    }
  },

  // 删除用户的所有会话
  async deleteAllUserSessions(userId) {
    if (!isRedisAvailable) {
      console.warn('⚠️  Redis不可用，跳过删除所有会话');
      return 0;
    }
    
    try {
      const userSessionsKey = `user:${userId}:sessions`;
      const tokens = await redisClient.smembers(userSessionsKey);
      
      // 删除所有会话
      for (const token of tokens) {
        await redisClient.del(`session:${token}`);
      }
      
      // 清空会话列表
      await redisClient.del(userSessionsKey);
      
      return tokens.length;
    } catch (error) {
      console.error('⚠️  删除所有会话失败:', error.message);
      return 0;
    }
  },

  // 刷新会话过期时间
  async refreshSession(token, expiresIn = 604800) {
    if (!isRedisAvailable) {
      return true; // Redis不可用时返回true
    }
    
    try {
      const sessionKey = `session:${token}`;
      const exists = await redisClient.exists(sessionKey);
      
      if (exists) {
        await redisClient.expire(sessionKey, expiresIn);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('⚠️  刷新会话失败:', error.message);
      return true; // 返回true，允许继续
    }
  },

  // 获取用户的所有活跃会话
  async getUserSessions(userId) {
    if (!isRedisAvailable) {
      console.warn('⚠️  Redis不可用，无法获取会话列表');
      return [];
    }
    
    try {
      const userSessionsKey = `user:${userId}:sessions`;
      const tokens = await redisClient.smembers(userSessionsKey);
      
      const sessions = [];
      for (const token of tokens) {
        const session = await this.getSession(token);
        if (session && !session.degraded) {
          sessions.push({
            token: token.substring(0, 20) + '...',
            createdAt: session.createdAt,
            userId: session.userId
          });
        }
      }
      
      return sessions;
    } catch (error) {
      console.error('⚠️  获取用户会话失败:', error.message);
      return [];
    }
  }
};

module.exports = {
  redisClient,
  sessionManager
};
