/**
 * 前端服务器文件
 * 重构后的静态文件服务器
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ES模块的__dirname替代方案
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.CLIENT_PORT || 3000;
const HOST = process.env.CLIENT_HOST || '0.0.0.0';

// 日志设置
const logDir = path.join(__dirname, '../logs');
const logFilePath = path.join(logDir, 'client.log');
const errorLogFilePath = path.join(logDir, 'client_error.log');

// 确保日志目录存在
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * 写入日志
 * @param {string} level - 日志级别
 * @param {string} message - 日志消息
 */
function writeLog(level, message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${level}: ${message}\n`;
  
  try {
    fs.appendFileSync(logFilePath, logEntry);
    console.log(logEntry.trim());
  } catch (error) {
    console.error('写入日志失败:', error.message);
  }
}

/**
 * 写入错误日志
 * @param {string} message - 错误消息
 */
function writeErrorLog(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ERROR: ${message}\n`;
  
  try {
    fs.appendFileSync(errorLogFilePath, logEntry);
    console.error(logEntry.trim());
  } catch (error) {
    console.error('写入错误日志失败:', error.message);
  }
}

/**
 * 请求日志中间件
 */
function requestLogger() {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // 记录请求开始
    writeLog('INFO', `Incoming request: ${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    // 拦截send方法以记录响应
    const originalSend = res.send;
    res.send = function(data) {
      const duration = Date.now() - startTime;
      const level = res.statusCode >= 400 ? 'WARN' : 'INFO';
      
      writeLog(level, `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`, {
        statusCode: res.statusCode,
        duration,
        contentLength: res.get('Content-Length'),
      });
      
      return originalSend.call(this, data);
    };
    
    next();
  };
}

// 应用中间件
app.use(requestLogger());

// 静态文件服务
const clientDir = __dirname;
app.use(express.static(clientDir, {
  maxAge: '1h', // 缓存1小时
  etag: true,
  lastModified: true,
}));

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 单页应用路由 - 所有未匹配的请求都返回index.html
// 使用中间件函数而不是通配符路由
app.use((req, res, next) => {
  // 排除静态文件请求和API请求
  if (req.path.includes('.') && !req.path.endsWith('/')) {
    return next();
  }
  
  // 排除已经处理的路径
  if (req.path === '/health' || req.path.startsWith('/api')) {
    return next();
  }
  
  writeLog('INFO', `Serving SPA for route: ${req.path}`);
  res.sendFile(path.join(clientDir, 'index.html'));
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: '资源未找到',
      path: req.path,
      timestamp: new Date().toISOString(),
    },
  });
});

// 错误处理
app.use((err, req, res, next) => {
  writeErrorLog(`服务器错误: ${err.message}`);
  console.error('服务器错误:', err);
  
  res.status(500).json({
    error: {
      message: '服务器内部错误',
      timestamp: new Date().toISOString(),
    },
  });
});

// 启动服务器
const server = app.listen(PORT, HOST, () => {
  writeLog('INFO', `前端服务器运行在 http://${HOST}:${PORT}/`);
  writeLog('INFO', `访问前端: http://${HOST}:${PORT}/`);
  writeLog('INFO', `健康检查: http://${HOST}:${PORT}/health`);
});

// 优雅关闭处理
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  writeLog('INFO', '收到关闭信号，正在优雅关闭前端服务器...');
  
  server.close(() => {
    writeLog('INFO', '前端服务器已关闭');
    process.exit(0);
  });
  
  // 强制关闭超时
  setTimeout(() => {
    writeLog('ERROR', '强制关闭超时');
    process.exit(1);
  }, 10000);
}

export default app;
