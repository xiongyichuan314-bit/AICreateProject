/**
 * 主路由文件
 * 组合所有路由
 */

const express = require('express');
const router = express.Router();
const dataRoutes = require('./dataRoutes');

// API信息路由
router.get('/', (req, res) => {
  res.json({
    message: 'Dynamic Data API Server',
    version: '1.0.0',
    endpoints: {
      'GET /api/data': '获取所有数据（分页）',
      'GET /api/search': '搜索数据',
      'GET /api/data/:id': '根据ID获取单条数据',
      'POST /api/data': '创建新数据',
      'PUT /api/data/:id': '更新数据',
      'DELETE /api/data/:id': '删除数据',
      'GET /api/data/stats/summary': '获取数据统计信息',
      'GET /api/data/health': '健康检查',
    },
    timestamp: new Date().toISOString(),
  });
});

// 数据路由
router.use('/data', dataRoutes);

// 404处理 - 捕获所有未匹配的路由
router.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'API端点不存在',
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    },
  });
});

module.exports = router;