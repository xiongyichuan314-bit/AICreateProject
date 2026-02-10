/**
 * 验证中间件
 * 处理请求数据验证
 */

const { validationError } = require('./errorHandler');

/**
 * 验证创建数据的请求体
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
function validateCreateData(req, res, next) {
  const { content } = req.body;
  
  // 检查内容是否存在
  if (!content) {
    return next(validationError('内容不能为空'));
  }
  
  // 检查内容类型
  if (typeof content !== 'string') {
    return next(validationError('内容必须是字符串'));
  }
  
  // 检查内容长度
  const trimmedContent = content.trim();
  if (trimmedContent.length === 0) {
    return next(validationError('内容不能为空或只包含空格'));
  }
  
  if (trimmedContent.length > 10000) {
    return next(validationError('内容长度不能超过10000个字符'));
  }
  
  // 清理内容（移除多余空格）
  req.body.content = trimmedContent;
  next();
}

/**
 * 验证更新数据的请求体
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
function validateUpdateData(req, res, next) {
  const { content } = req.body;
  
  // 检查内容是否存在
  if (!content) {
    return next(validationError('内容不能为空'));
  }
  
  // 检查内容类型
  if (typeof content !== 'string') {
    return next(validationError('内容必须是字符串'));
  }
  
  // 检查内容长度
  const trimmedContent = content.trim();
  if (trimmedContent.length === 0) {
    return next(validationError('内容不能为空或只包含空格'));
  }
  
  if (trimmedContent.length > 10000) {
    return next(validationError('内容长度不能超过10000个字符'));
  }
  
  // 清理内容
  req.body.content = trimmedContent;
  next();
}

/**
 * 验证ID参数
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
function validateIdParam(req, res, next) {
  const { id } = req.params;
  
  // 检查ID是否存在
  if (!id) {
    return next(validationError('ID参数不能为空'));
  }
  
  // 检查ID是否为有效数字
  const idNum = parseInt(id, 10);
  if (isNaN(idNum) || idNum <= 0) {
    return next(validationError('ID必须是正整数'));
  }
  
  // 验证ID范围
  if (idNum > 2147483647) { // SQLite INTEGER的最大值
    return next(validationError('ID超出有效范围'));
  }
  
  req.params.id = idNum;
  next();
}

/**
 * 验证分页查询参数
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
function validatePagination(req, res, next) {
  const { page = '1', limit = '10' } = req.query;
  
  // 验证页码
  const pageNum = parseInt(page, 10);
  if (isNaN(pageNum) || pageNum < 1) {
    return next(validationError('页码必须是正整数'));
  }
  
  // 验证每页数量
  const limitNum = parseInt(limit, 10);
  if (isNaN(limitNum) || limitNum < 1) {
    return next(validationError('每页数量必须是正整数'));
  }
  
  // 限制每页数量最大值
  const maxLimit = 100;
  if (limitNum > maxLimit) {
    return next(validationError(`每页数量不能超过${maxLimit}`));
  }
  
  req.query.page = pageNum;
  req.query.limit = limitNum;
  next();
}

/**
 * 验证搜索查询参数
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
function validateSearchQuery(req, res, next) {
  const { q = '' } = req.query;
  
  // 检查搜索关键词类型
  if (typeof q !== 'string') {
    return next(validationError('搜索关键词必须是字符串'));
  }
  
  // 清理搜索关键词
  const trimmedQuery = q.trim();
  
  // 检查搜索关键词长度
  if (trimmedQuery.length > 200) {
    return next(validationError('搜索关键词长度不能超过200个字符'));
  }
  
  // 防止SQL注入（基本检查）
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC)\b)/i,
    /(\-\-)/,
    /(\/\*)/,
    /(\*\/)/,
    /(;)/,
  ];
  
  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(trimmedQuery)) {
      return next(validationError('搜索关键词包含非法字符'));
    }
  }
  
  req.query.q = trimmedQuery;
  next();
}

/**
 * 验证请求内容类型
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
function validateContentType(req, res, next) {
  // 对于POST和PUT请求，检查Content-Type
  if (['POST', 'PUT'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    
    if (!contentType || !contentType.includes('application/json')) {
      return next(validationError('Content-Type必须是application/json'));
    }
  }
  
  next();
}

/**
 * 验证请求体大小
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
function validateBodySize(req, res, next) {
  const maxBodySize = 1024 * 1024; // 1MB
  
  if (req.headers['content-length']) {
    const contentLength = parseInt(req.headers['content-length'], 10);
    
    if (contentLength > maxBodySize) {
      return next(validationError('请求体大小不能超过1MB'));
    }
  }
  
  next();
}

/**
 * 组合验证中间件
 */
const validateData = {
  create: [validateContentType, validateBodySize, validateCreateData],
  update: [validateContentType, validateBodySize, validateUpdateData],
  id: validateIdParam,
  pagination: validatePagination,
  search: validateSearchQuery,
};

module.exports = {
  validateCreateData,
  validateUpdateData,
  validateIdParam,
  validatePagination,
  validateSearchQuery,
  validateContentType,
  validateBodySize,
  validateData,
};