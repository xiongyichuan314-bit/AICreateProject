/**
 * 错误处理中间件
 * 统一处理应用程序错误
 */

const logger = require('../utils/logger');

/**
 * 错误处理中间件
 * @param {Error} err - 错误对象
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
function errorHandler(err, req, res, next) {
  // 记录错误
  logger.error('应用程序错误', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // 根据错误类型设置状态码
  let statusCode = 500;
  let message = '服务器内部错误';
  
  if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.message.includes('不存在')) {
    statusCode = 404;
    message = err.message;
  } else if (err.message.includes('无效') || err.message.includes('不能为空')) {
    statusCode = 400;
    message = err.message;
  }

  // 发送错误响应
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
    },
  });
}

/**
 * 异步错误处理包装器
 * @param {Function} fn - 异步函数
 * @returns {Function} 包装后的函数
 */
function asyncHandler(fn) {
  return function(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 创建自定义错误
 * @param {string} message - 错误消息
 * @param {number} statusCode - 状态码
 * @returns {Error} 自定义错误对象
 */
function createError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/**
 * 验证错误
 * @param {string} message - 错误消息
 * @returns {Error} 验证错误
 */
function validationError(message) {
  return createError(message, 400);
}

/**
 * 未找到错误
 * @param {string} message - 错误消息
 * @returns {Error} 未找到错误
 */
function notFoundError(message = '资源未找到') {
  return createError(message, 404);
}

/**
 * 未授权错误
 * @param {string} message - 错误消息
 * @returns {Error} 未授权错误
 */
function unauthorizedError(message = '未授权访问') {
  return createError(message, 401);
}

/**
 * 禁止访问错误
 * @param {string} message - 错误消息
 * @returns {Error} 禁止访问错误
 */
function forbiddenError(message = '禁止访问') {
  return createError(message, 403);
}

module.exports = {
  errorHandler,
  asyncHandler,
  createError,
  validationError,
  notFoundError,
  unauthorizedError,
  forbiddenError,
};