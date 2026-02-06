/**
 * 邮件服务模块
 * 封装所有与邮件API的通信
 */

const API_BASE_URL = 'http://localhost:8081';

class EmailService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * 获取最近邮件
   * @param {number} limit - 邮件数量限制
   * @returns {Promise<Object>} 邮件响应
   */
  async getRecentEmails(limit = 3) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒超时
    
    try {
      const response = await fetch(
        `${this.baseUrl}/api/email/recent?limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('获取邮件失败:', error);
      
      // 提供更友好的错误信息
      if (error.name === 'AbortError') {
        throw new Error('请求超时，请稍后重试');
      } else if (error.message.includes('Failed to fetch')) {
        throw new Error('无法连接到邮件服务器，请检查网络连接');
      } else {
        throw error;
      }
    }
  }

  /**
   * 获取邮箱配置状态
   * @returns {Promise<Object>} 配置状态
   */
  async getEmailConfig() {
    try {
      const response = await fetch(`${this.baseUrl}/api/email/config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('获取邮箱配置失败:', error);
      throw error;
    }
  }

  /**
   * 检查邮件服务健康状态
   * @returns {Promise<Object>} 健康状态
   */
  async checkEmailHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/api/email/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('检查邮件服务健康状态失败:', error);
      throw error;
    }
  }

  /**
   * 格式化日期
   * @param {string} dateString - 日期字符串
   * @returns {string} 格式化后的日期
   */
  formatDate(dateString) {
    if (!dateString) return '未知时间';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) {
        return '刚刚';
      } else if (diffMins < 60) {
        return `${diffMins}分钟前`;
      } else if (diffHours < 24) {
        return `${diffHours}小时前`;
      } else if (diffDays < 7) {
        return `${diffDays}天前`;
      } else {
        return date.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      console.error('日期格式化错误:', error);
      return dateString;
    }
  }

  /**
   * 提取发件人名称
   * @param {string} from - 发件人字符串
   * @returns {string} 发件人名称
   */
  extractSenderName(from) {
    if (!from) return '未知发件人';
    
    // 尝试从 "名称 <email@example.com>" 格式中提取名称
    const match = from.match(/^"?([^"<]+)"?\s*<[^>]+>$/);
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // 如果是纯邮箱地址，提取@前的部分
    const emailMatch = from.match(/^([^@]+)@/);
    if (emailMatch && emailMatch[1]) {
      return emailMatch[1];
    }
    
    return from;
  }

  /**
   * 提取发件人邮箱
   * @param {string} from - 发件人字符串
   * @returns {string} 发件人邮箱
   */
  extractSenderEmail(from) {
    if (!from) return '';
    
    // 尝试从 "名称 <email@example.com>" 格式中提取邮箱
    const match = from.match(/<([^>]+)>/);
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // 如果是纯邮箱地址，直接返回
    if (from.includes('@')) {
      return from;
    }
    
    return '';
  }

  /**
   * 截断文本
   * @param {string} text - 原始文本
   * @param {number} maxLength - 最大长度
   * @returns {string} 截断后的文本
   */
  truncateText(text, maxLength = 100) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}

// 创建单例实例
const emailService = new EmailService();

export default emailService;