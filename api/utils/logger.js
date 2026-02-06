/**
 * 日志工具模块
 * 提供统一的日志记录功能
 */

const fs = require('fs');
const path = require('path');
const config = require('../config/config');

// 确保日志目录存在
const logsDir = path.join(__dirname, '../../', config.logging.dir);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 日志文件路径
const apiLogPath = path.join(logsDir, config.logging.apiLogFile);
const errorLogPath = path.join(logsDir, config.logging.errorLogFile);
const clientLogPath = path.join(logsDir, config.logging.clientLogFile);

// 日志级别
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

// 日志级别权重
const LOG_LEVEL_WEIGHTS = {
  [LOG_LEVELS.ERROR]: 4,
  [LOG_LEVELS.WARN]: 3,
  [LOG_LEVELS.INFO]: 2,
  [LOG_LEVELS.DEBUG]: 1,
};

// 当前日志级别权重
const currentLogLevelWeight = LOG_LEVEL_WEIGHTS[config.logging.level.toUpperCase()] || LOG_LEVEL_WEIGHTS.INFO;

/**
 * 写入日志到文件
 * @param {string} filePath - 日志文件路径
 * @param {string} message - 日志消息
 */
function writeToLogFile(filePath, message) {
  try {
    fs.appendFileSync(filePath, message);
  } catch (error) {
    console.error(`❌ 写入日志文件失败: ${error.message}`);
  }
}

/**
 * 格式化日志条目
 * @param {string} level - 日志级别
 * @param {string} message - 日志消息
 * @param {Object} metadata - 元数据
 * @returns {string} 格式化后的日志条目
 */
function formatLogEntry(level, message, metadata = {}) {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(metadata).length > 0 
    ? ` ${JSON.stringify(metadata)}`
    : '';
  return `[${timestamp}] ${level}: ${message}${metaStr}\n`;
}

/**
 * 检查是否应该记录该级别的日志
 * @param {string} level - 日志级别
 * @returns {boolean} 是否应该记录
 */
function shouldLog(level) {
  const levelWeight = LOG_LEVEL_WEIGHTS[level] || LOG_LEVEL_WEIGHTS.INFO;
  return levelWeight >= currentLogLevelWeight;
}

/**
 * 记录API日志
 * @param {string} level - 日志级别
 * @param {string} message - 日志消息
 * @param {Object} metadata - 元数据
 */
function logApi(level, message, metadata = {}) {
  if (!shouldLog(level)) return;
  
  const logEntry = formatLogEntry(level, message, metadata);
  
  // 写入API日志文件
  writeToLogFile(apiLogPath, logEntry);
  
  // 错误级别同时写入错误日志
  if (level === LOG_LEVELS.ERROR) {
    writeToLogFile(errorLogPath, logEntry);
  }
  
  // 输出到控制台
  const consoleMethod = level === LOG_LEVELS.ERROR ? console.error : 
                       level === LOG_LEVELS.WARN ? console.warn : console.log;
  consoleMethod(logEntry.trim());
}

/**
 * 记录客户端日志
 * @param {string} level - 日志级别
 * @param {string} message - 日志消息
 * @param {Object} metadata - 元数据
 */
function logClient(level, message, metadata = {}) {
  if (!shouldLog(level)) return;
  
  const logEntry = formatLogEntry(level, message, metadata);
  
  // 写入客户端日志文件
  writeToLogFile(clientLogPath, logEntry);
  
  // 输出到控制台
  console.log(logEntry.trim());
}

/**
 * 记录请求日志的中间件
 * @returns {Function} Express中间件
 */
function requestLogger() {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // 记录请求开始
    logApi(LOG_LEVELS.INFO, `Incoming request: ${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    // 拦截send方法以记录响应
    const originalSend = res.send;
    res.send = function(data) {
      const duration = Date.now() - startTime;
      const level = res.statusCode >= 400 ? LOG_LEVELS.WARN : LOG_LEVELS.INFO;
      
      logApi(level, `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`, {
        statusCode: res.statusCode,
        duration,
        contentLength: res.get('Content-Length'),
      });
      
      return originalSend.call(this, data);
    };
    
    next();
  };
}

/**
 * 记录错误
 * @param {Error} error - 错误对象
 * @param {string} context - 错误上下文
 * @param {Object} metadata - 元数据
 */
function logError(error, context = '', metadata = {}) {
  const message = context ? `${context}: ${error.message}` : error.message;
  
  logApi(LOG_LEVELS.ERROR, message, {
    ...metadata,
    stack: error.stack,
    name: error.name,
  });
}

// 导出日志工具
module.exports = {
  LOG_LEVELS,
  logApi,
  logClient,
  logError,
  requestLogger,
  
  // 快捷方法
  info: (message, metadata) => logApi(LOG_LEVELS.INFO, message, metadata),
  warn: (message, metadata) => logApi(LOG_LEVELS.WARN, message, metadata),
  error: (message, metadata) => logApi(LOG_LEVELS.ERROR, message, metadata),
  debug: (message, metadata) => logApi(LOG_LEVELS.DEBUG, message, metadata),
};