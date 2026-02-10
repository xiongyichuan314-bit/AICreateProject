/**
 * 主服务器文件
 * 重构后的Express服务器
 */

// 首先加载环境变量 - 确保在所有模块引入之前
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// 配置和工具
const config = require('./config/config');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const databaseService = require('./services/database');

// 路由
const apiRoutes = require('./routes/index');

// 创建Express应用
const app = express();

// 安全中间件
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://cdn.jsdelivr.net',
          'https://kit.fontawesome.com',
        ],
        fontSrc: ["'self'", 'https://cdn.jsdelivr.net', 'https://kit.fontawesome.com'],
      },
    },
  })
);

// 压缩中间件
app.use(compression());

// CORS配置
app.use(
  cors({
    origin: config.security.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// 请求体解析
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 请求日志中间件
app.use(logger.requestLogger());

// 速率限制
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  message: {
    success: false,
    error: {
      message: '请求过于频繁，请稍后再试',
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 应用速率限制到API路由
app.use('/api', limiter);

// API路由
app.use('/api', apiRoutes);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// 根路由重定向到API文档
app.get('/', (req, res) => {
  res.redirect('/api');
});

// 404处理 - 捕获所有未匹配的路由
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: '端点不存在',
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    },
  });
});

// 错误处理中间件（必须放在最后）
app.use(errorHandler);

// 优雅关闭处理
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
  logger.info('收到关闭信号，正在优雅关闭...');

  try {
    // 关闭数据库连接
    await databaseService.close();
    logger.info('数据库连接已关闭');

    // 关闭服务器
    if (server) {
      server.close(() => {
        logger.info('HTTP服务器已关闭');
        process.exit(0);
      });

      // 强制关闭超时
      setTimeout(() => {
        logger.error('强制关闭超时');
        process.exit(1);
      }, 10000);
    } else {
      process.exit(0);
    }
  } catch (error) {
    logger.error('优雅关闭失败', { error: error.message });
    process.exit(1);
  }
}

// 启动服务器
let server;

async function startServer() {
  try {
    // 初始化数据库
    logger.info('正在初始化数据库...');
    await databaseService.initialize();
    logger.info('✅ 数据库初始化完成');

    // 启动服务器
    logger.info(`正在启动服务器，监听 ${config.server.host}:${config.server.port}...`);
    server = app.listen(config.server.port, config.server.host, () => {
      logger.info(`🚀 服务器运行在 ${config.server.host}:${config.server.port}`);
      logger.info(`📚 API文档: http://${config.server.host}:${config.server.port}/api`);
      logger.info(`🏥 健康检查: http://${config.server.host}:${config.server.port}/health`);
      logger.info(`🌍 环境: ${config.server.nodeEnv}`);
    });

    // 处理服务器错误
    server.on('error', error => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`端口 ${config.server.port} 已被占用`);
        process.exit(1);
      } else {
        logger.error('服务器错误', { error: error.message });
        throw error;
      }
    });
  } catch (error) {
    logger.error('启动服务器失败', { error: error.message });
    process.exit(1);
  }
}

// 启动服务器
startServer();

module.exports = app;
