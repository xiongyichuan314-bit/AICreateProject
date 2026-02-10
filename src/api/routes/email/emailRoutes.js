/**
 * 邮件路由
 * 处理邮件相关的API端点
 */

const express = require('express');
const router = express.Router();
const qqMailService = require('../../services/email/qqMailService');
const { asyncHandler } = require('../../middleware/errorHandler');

/**
 * @route GET /api/email/recent
 * @desc 获取最近N封邮件
 * @access Public
 */
router.get(
  '/recent',
  asyncHandler(async (req, res) => {
    const { limit = 3 } = req.query;
    const emails = await qqMailService.getRecentEmails(parseInt(limit));
    
    res.json({
      success: true,
      data: emails,
      count: emails.length,
      config: qqMailService.getConfigStatus(),
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route GET /api/email/config
 * @desc 获取邮箱配置状态
 * @access Public
 */
router.get(
  '/config',
  asyncHandler(async (req, res) => {
    const config = qqMailService.getConfigStatus();
    
    res.json({
      success: true,
      config,
      instructions: config.configured 
        ? '邮箱已配置，可以正常获取邮件'
        : '邮箱未配置，当前显示模拟数据。请设置QQ_EMAIL_USER和QQ_EMAIL_PASSWORD环境变量',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * @route GET /api/email/health
 * @desc 邮件服务健康检查
 * @access Public
 */
router.get('/health', (req, res) => {
  const config = qqMailService.getConfigStatus();
  
  res.json({
    success: true,
    status: config.configured ? 'configured' : 'mock',
    configured: config.configured,
    message: config.configured 
      ? 'QQ邮箱服务已配置'
      : 'QQ邮箱服务未配置，使用模拟数据',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route POST /api/email/test
 * @desc 测试邮件连接
 * @access Public
 */
router.post(
  '/test',
  asyncHandler(async (req, res) => {
    const { user, password } = req.body;
    
    if (!user || !password) {
      return res.status(400).json({
        success: false,
        error: '请提供邮箱用户名和密码',
      });
    }
    
    try {
      // 这里可以添加测试连接逻辑
      // 注意：实际生产环境中不应该这样处理密码
      
      res.json({
        success: true,
        message: '测试请求已接收，请设置环境变量后重启服务',
        note: '建议通过环境变量配置邮箱信息，而不是通过API传递',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  })
);

module.exports = router;