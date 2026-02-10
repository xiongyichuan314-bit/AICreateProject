/**
 * 数据路由
 * 处理数据相关的API端点
 */

const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateData } = require('../middleware/validation');

/**
 * @route GET /api/data
 * @desc 获取所有数据（分页）
 * @access Public
 */
router.get(
  '/',
  validateData.pagination,
  asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const result = await dataService.getAllData(page, limit);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route GET /api/search
 * @desc 搜索数据
 * @access Public
 */
router.get(
  '/search',
  validateData.search,
  validateData.pagination,
  asyncHandler(async (req, res) => {
    const { q, page, limit } = req.query;
    const result = await dataService.searchData(q, page, limit);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      searchQuery: result.searchQuery,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route GET /api/data/:id
 * @desc 根据ID获取单条数据
 * @access Public
 */
router.get(
  '/:id',
  validateData.id,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = await dataService.getDataById(id);
    
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route POST /api/data
 * @desc 创建新数据
 * @access Public
 */
router.post(
  '/',
  ...validateData.create,
  asyncHandler(async (req, res) => {
    const { content } = req.body;
    const data = await dataService.createData(content);
    
    res.status(201).json({
      success: true,
      data,
      message: '数据创建成功',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route PUT /api/data/:id
 * @desc 更新数据
 * @access Public
 */
router.put(
  '/:id',
  validateData.id,
  ...validateData.update,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const data = await dataService.updateData(id, content);
    
    res.json({
      success: true,
      data,
      message: '数据更新成功',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route DELETE /api/data/:id
 * @desc 删除数据
 * @access Public
 */
router.delete(
  '/:id',
  validateData.id,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await dataService.deleteData(id);
    
    res.json({
      success: true,
      message: '数据删除成功',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route GET /api/data/stats
 * @desc 获取数据统计信息
 * @access Public
 */
router.get(
  '/stats/summary',
  asyncHandler(async (req, res) => {
    const stats = await dataService.getStatistics();
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route POST /api/data/batch
 * @desc 批量创建数据（仅用于测试）
 * @access Public
 */
router.post(
  '/batch',
  asyncHandler(async (req, res) => {
    const { contents } = req.body;
    
    if (!Array.isArray(contents)) {
      return res.status(400).json({
        success: false,
        error: 'contents必须是数组',
      });
    }
    
    const results = await dataService.batchCreateData(contents);
    
    res.status(201).json({
      success: true,
      data: results,
      message: `批量创建了${results.length}条数据`,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route GET /api/data/health
 * @desc 健康检查端点
 * @access Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

module.exports = router;