/**
 * QQ邮箱服务
 * 注意：实际使用时需要QQ邮箱的认证信息
 * 建议使用环境变量存储敏感信息
 */

const nodemailer = require('nodemailer');
const Imap = require('imap');
const { simpleParser } = require('mailparser');

class QQMailService {
  constructor() {
    // 配置信息 - 实际使用时应该从环境变量读取
    this.config = {
      host: 'imap.qq.com',
      port: 993,
      secure: true,
      user: process.env.QQ_EMAIL_USER || '',
      password: process.env.QQ_EMAIL_PASSWORD || '',
      authMethod: 'XOAUTH2' // QQ邮箱可能需要特殊认证方式
    };
    
    this.isConfigured = this.config.user && this.config.password;
  }

  /**
   * 获取最近N封邮件
   * @param {number} limit - 邮件数量限制
   * @returns {Promise<Array>} 邮件列表
   */
  async getRecentEmails(limit = 3) {
    if (!this.isConfigured) {
      console.warn('QQ邮箱未配置，返回模拟数据');
      return this.getMockEmails(limit);
    }

    try {
      return await this.fetchEmailsFromIMAP(limit);
    } catch (error) {
      console.error('获取QQ邮箱邮件失败:', error);
      // 失败时返回模拟数据
      return this.getMockEmails(limit);
    }
  }

  /**
   * 从IMAP服务器获取邮件
   * @param {number} limit - 邮件数量限制
   * @returns {Promise<Array>} 邮件列表
   */
  async fetchEmailsFromIMAP(limit) {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: this.config.user,
        password: this.config.password,
        host: this.config.host,
        port: this.config.port,
        tls: this.config.secure,
        authMethod: this.config.authMethod,
        tlsOptions: { rejectUnauthorized: false }
      });

      const emails = [];
      let opened = false;

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            imap.end();
            return reject(err);
          }

          // 获取最新的N封邮件
          const totalMessages = box.messages.total;
          const start = Math.max(1, totalMessages - limit + 1);
          const end = totalMessages;

          if (start > end) {
            imap.end();
            return resolve([]);
          }

          const f = imap.seq.fetch(`${start}:${end}`, {
            bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
            struct: true
          });

          f.on('message', (msg, seqno) => {
            const email = {
              id: seqno,
              from: '',
              to: '',
              subject: '',
              date: '',
              preview: '',
              body: ''
            };

            msg.on('body', (stream, info) => {
              let buffer = '';
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
              stream.on('end', () => {
                if (info.which === 'TEXT') {
                  email.body = buffer.substring(0, 500) + '...';
                  email.preview = buffer.substring(0, 100) + '...';
                } else {
                  // 解析邮件头
                  const headers = this.parseHeaders(buffer);
                  email.from = headers.from || '';
                  email.to = headers.to || '';
                  email.subject = headers.subject || '';
                  email.date = headers.date || '';
                }
              });
            });

            msg.once('end', () => {
              emails.push(email);
            });
          });

          f.once('error', (err) => {
            imap.end();
            reject(err);
          });

          f.once('end', () => {
            imap.end();
            // 按日期排序（最新的在前）
            emails.sort((a, b) => new Date(b.date) - new Date(a.date));
            resolve(emails);
          });
        });
      });

      imap.once('error', (err) => {
        if (!opened) {
          reject(err);
        }
      });

      imap.once('end', () => {
        if (!opened) {
          resolve(emails);
        }
      });

      imap.connect();
    });
  }

  /**
   * 解析邮件头
   * @param {string} headerText - 邮件头文本
   * @returns {Object} 解析后的头信息
   */
  parseHeaders(headerText) {
    const headers = {};
    const lines = headerText.split('\r\n');
    
    lines.forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim().toLowerCase();
        const value = line.substring(colonIndex + 1).trim();
        headers[key] = value;
      }
    });

    return headers;
  }

  /**
   * 获取模拟邮件数据（用于开发和测试）
   * @param {number} limit - 邮件数量限制
   * @returns {Array} 模拟邮件列表
   */
  getMockEmails(limit = 3) {
    const mockEmails = [
      {
        id: 1,
        from: 'service@qq.com',
        to: '你的QQ邮箱',
        subject: '欢迎使用QQ邮箱',
        date: new Date().toISOString(),
        preview: '感谢您选择QQ邮箱，我们将为您提供安全、稳定、快速的邮件服务...',
        body: '尊敬的QQ邮箱用户：\n\n感谢您选择QQ邮箱，我们将为您提供安全、稳定、快速的邮件服务。\n\nQQ邮箱团队'
      },
      {
        id: 2,
        from: 'newsletter@example.com',
        to: '你的QQ邮箱',
        subject: '技术周刊 - 第202期',
        date: new Date(Date.now() - 86400000).toISOString(), // 昨天
        preview: '本期技术周刊包含最新的前端框架更新、后端开发技巧和DevOps实践...',
        body: '亲爱的读者：\n\n欢迎阅读第202期技术周刊。本期内容包含：\n1. React 19新特性预览\n2. Node.js性能优化技巧\n3. 容器化部署最佳实践\n\n祝阅读愉快！\n技术周刊编辑部'
      },
      {
        id: 3,
        from: 'notification@github.com',
        to: '你的QQ邮箱',
        subject: 'GitHub: 你有新的Pull Request',
        date: new Date(Date.now() - 172800000).toISOString(), // 前天
        preview: '你的项目 "dynamic-website" 有一个新的Pull Request等待审核...',
        body: '项目: dynamic-website\n分支: feature/email-integration\n提交者: waxiong\n\n请审核这个Pull Request。\n\nGitHub通知'
      }
    ];

    return mockEmails.slice(0, limit);
  }

  /**
   * 检查邮箱配置状态
   * @returns {Object} 配置状态
   */
  getConfigStatus() {
    return {
      configured: this.isConfigured,
      user: this.config.user ? `${this.config.user.substring(0, 3)}***@qq.com` : '未配置',
      host: this.config.host,
      port: this.config.port
    };
  }
}

// 创建单例实例
const qqMailService = new QQMailService();

module.exports = qqMailService;