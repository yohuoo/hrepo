const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
require('dotenv').config();

const config = require('./config/config');
const { testConnection, initializeDatabase } = require('./models/index');

// 导入路由
const authRoutes = require('./routes/auth');
const overseasRoutes = require('./routes/overseas');
const hunterRoutes = require('./routes/hunter');
const contactRoutes = require('./routes/contacts');
const emailTemplateRoutes = require('./routes/emailTemplates');
const emailDraftsRoutes = require('./routes/emailDrafts');
const customerRoutes = require('./routes/customers');
const userEmailBindingsRoutes = require('./routes/userEmailBindings');
const emailHistoryRoutes = require('./routes/emailHistory');
const zoomMeetingsRoutes = require('./routes/zoomMeetings');
const customerAnalysisRoutes = require('./routes/customerAnalysis');
const emailsRoutes = require('./routes/emails');
const departmentsRoutes = require('./routes/departments');
const usersRoutes = require('./routes/users');
const salesRoutes = require('./routes/sales');
const contractsRoutes = require('./routes/contracts');
const caseStudiesRoutes = require('./routes/caseStudies');
const pagePermissionsRoutes = require('./routes/pagePermissions');
const notificationsRoutes = require('./routes/notifications');
const viewsRoutes = require('./routes/views');

const app = express();

// 视图引擎设置
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.set('layout', 'layouts/main');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// 静态文件
app.use(express.static(path.join(__dirname, '../public')));

// Cookie和Session
app.use(cookieParser());
app.use(session({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 } // 7天
}));

// 安全中间件（调整CSP以支持CDN和内联事件）
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://code.jquery.com", "https://cdnjs.cloudflare.com"],
      scriptSrcAttr: ["'unsafe-inline'"],  // 允许内联事件处理器（onclick等）
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"]
    }
  }
}));

// CORS配置
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials
}));

// 压缩响应
app.use(compression());

// 请求日志
if (config.server.env === 'development') {
  app.use(morgan('combined'));
}

// 限流
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  }
});
app.use('/api/', limiter);

// 解析JSON请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查端点 - 移到 /api/health
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'HRepo API - 海外客户搜索系统 (Node.js版本)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API路由（必须在视图路由之前）
app.use('/api/auth', authRoutes);  // 认证路由（不需要token）
app.use('/api/overseas', overseasRoutes);
app.use('/api/hunter', hunterRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/email-templates', emailTemplateRoutes);
app.use('/api/email-drafts', emailDraftsRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/user-email-bindings', userEmailBindingsRoutes);
app.use('/api/email-history', emailHistoryRoutes);
app.use('/api/zoom-meetings', zoomMeetingsRoutes);
app.use('/api/customer-analysis', customerAnalysisRoutes);
app.use('/api/emails', emailsRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/case-studies', caseStudiesRoutes);
app.use('/api/page-permissions', pagePermissionsRoutes);
app.use('/api/notifications', notificationsRoutes);
const statisticsRoutes = require('./routes/statistics');
const reportsRoutes = require('./routes/reports');
app.use('/api/statistics', statisticsRoutes);
app.use('/api/reports', reportsRoutes);

// 视图路由（放在API路由之后，但在404之前）
app.use('/', viewsRoutes);

// 全局404处理
app.use((req, res) => {
  // API请求返回JSON
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: '接口不存在',
      path: req.originalUrl
    });
  }
  
  // 页面请求返回HTML
  res.status(404).send(`
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8"><title>404 - 页面不存在</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head>
    <body class="d-flex align-items-center justify-content-center vh-100">
      <div class="text-center">
        <h1 class="display-1">404</h1>
        <p class="lead">页面不存在</p>
        <a href="/dashboard" class="btn btn-primary">返回首页</a>
      </div>
    </body></html>
  `);
});

// 全局错误处理
app.use((error, req, res, next) => {
  console.error('全局错误:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || '服务器内部错误',
    ...(config.server.env === 'development' && { stack: error.stack })
  });
});

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    await testConnection();
    
    // 初始化数据库 - 跳过同步以避免现有数据冲突
    try {
      await initializeDatabase();
    } catch (dbError) {
      console.warn('⚠️  数据库同步跳过，使用现有表结构:', dbError.message);
    }
    
    // 启动HTTP服务器
    const server = app.listen(config.server.port, config.server.host, () => {
      console.log(`🚀 服务器启动成功!`);
      console.log(`📍 地址: http://${config.server.host}:${config.server.port}`);
      console.log(`🌍 环境: ${config.server.env}`);
      console.log(`📊 API文档: http://${config.server.host}:${config.server.port}/api`);
    });

    // 优雅关闭
    process.on('SIGTERM', () => {
      console.log('收到SIGTERM信号，正在关闭服务器...');
      server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('收到SIGINT信号，正在关闭服务器...');
      server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
};

// 如果直接运行此文件，则启动服务器
if (require.main === module) {
  startServer();
}

module.exports = app;
