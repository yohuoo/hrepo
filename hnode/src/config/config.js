require('dotenv').config();

const config = {
  // 服务器配置
  server: {
    port: process.env.PORT || 8000,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development'
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // OpenAI配置
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 8000,
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    timeout: parseInt(process.env.OPENAI_TIMEOUT) || 120000
  },

  // Hunter.io配置
  hunter: {
    apiKey: process.env.HUNTER_API_KEY,
    baseUrl: process.env.HUNTER_BASE_URL || 'https://api.hunter.io/v2',
    timeout: parseInt(process.env.HUNTER_TIMEOUT) || 30000
  },

  // 邮件配置
  email: {
    timeout: parseInt(process.env.EMAIL_TIMEOUT) || 30000,
    maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES) || 3,
    retryDelay: parseInt(process.env.EMAIL_RETRY_DELAY) || 1000
  },

  // 263邮箱配置
  email263: {
    smtpServer: process.env.EMAIL_263_SMTP_SERVER || 'smtp.263.net',
    smtpPort: parseInt(process.env.EMAIL_263_SMTP_PORT) || 465,
    imapServer: process.env.EMAIL_263_IMAP_SERVER || 'imap.263.net',
    imapPort: parseInt(process.env.EMAIL_263_IMAP_PORT) || 993,
    ssl: process.env.EMAIL_263_SSL === 'true'
  },

  // 限流配置
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  // CORS配置
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true'
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log'
  },

  // 分页配置
  pagination: {
    defaultPage: 1,
    defaultPageSize: 20,
    maxPageSize: 100
  }
};

// 验证必需的配置
const validateConfig = () => {
  const required = [
    'openai.apiKey',
    'hunter.apiKey'
  ];

  const missing = required.filter(key => {
    const keys = key.split('.');
    let value = config;
    for (const k of keys) {
      value = value[k];
      if (value === undefined) return true;
    }
    return false;
  });

  if (missing.length > 0) {
    console.warn('⚠️  缺少以下配置:', missing.join(', '));
  }
};

// 开发环境下验证配置
if (config.server.env === 'development') {
  validateConfig();
}

module.exports = config;
