/**
 * 配置文件
 * 从环境变量加载配置
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const config = {
  // 服务器配置
  server: {
    port: parseInt(process.env.PORT) || 8081,
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // 数据库配置
  database: {
    path: process.env.DB_PATH || './data.db',
    migrationsPath: process.env.DB_MIGRATIONS_PATH || './migrations',
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs',
    apiLogFile: process.env.API_LOG_FILE || 'api.log',
    errorLogFile: process.env.ERROR_LOG_FILE || 'error.log',
    clientLogFile: process.env.CLIENT_LOG_FILE || 'client.log',
  },

  // 前端配置
  client: {
    port: parseInt(process.env.CLIENT_PORT) || 3000,
    host: process.env.CLIENT_HOST || '0.0.0.0',
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8081',
  },

  // 安全配置
  security: {
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // 分页配置
  pagination: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE) || 10,
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE) || 100,
  },

  // 应用配置
  app: {
    name: process.env.APP_NAME || 'Dynamic Data API',
    version: process.env.APP_VERSION || '1.0.0',
  },
};

// 验证必需配置
const requiredConfigs = [
  { key: 'server.port', value: config.server.port },
  { key: 'database.path', value: config.database.path },
];

for (const { key, value } of requiredConfigs) {
  if (value === undefined || value === null || value === '') {
    console.error(`❌ 缺少必需配置: ${key}`);
    process.exit(1);
  }
}

// 开发环境特殊配置
if (config.server.nodeEnv === 'development') {
  console.log('🚀 运行在开发环境');
}

module.exports = config;