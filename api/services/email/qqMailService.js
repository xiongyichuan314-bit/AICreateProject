/**
 * QQ邮箱服务 v2
 * 使用mailparser库正确解析MIME格式邮件
 */

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
      // QQ邮箱通常使用PLAIN或LOGIN认证
      // 不要设置authMethod，让imap库自动选择
    };
    
    this.isConfigured = this.config.user && this.config.password;
    
    // 调试信息
    if (this.isConfigured) {
      console.log('QQ邮箱服务已配置，用户:', this.config.user.substring(0, 3) + '***@qq.com');
    } else {
      console.log('QQ邮箱服务未配置，将使用模拟数据');
    }
  }

  /**
   * 获取最近N封邮件
   * @param {number} limit - 邮件数量限制
   * @returns {Promise<Array>} 邮件列表
   */
  async getRecentEmails(limit = 3) {
    if (!this.isConfigured) {
      console.warn('QQ邮箱未配置，返回空数组');
      return []; // 不返回模拟数据，返回空数组
    }

    // 添加重试机制
    const maxRetries = 2;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`尝试获取最近 ${limit} 封QQ邮箱邮件 (第${attempt}次尝试)...`);
        
        // 添加超时处理
        const emails = await Promise.race([
          this.fetchEmailsWithParser(limit),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`QQ邮箱连接超时 (${attempt}/${maxRetries})`)), 5000)
          )
        ]);
        
        if (emails.length === 0) {
          console.log('收件箱为空');
          return [];
        }
        
        console.log(`成功获取 ${emails.length} 封邮件`);
        return emails;
      } catch (error) {
        lastError = error;
        console.error(`第${attempt}次尝试失败:`, error.message);
        
        if (attempt < maxRetries) {
          // 等待一段时间后重试
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
      }
    }
    
    // 所有重试都失败
    console.error('所有重试都失败，返回空数组:', lastError?.message || '未知错误');
    return []; // 连接失败时返回空数组，而不是模拟数据
  }

  /**
   * 使用mailparser解析邮件
   * @param {number} limit - 邮件数量限制
   * @returns {Promise<Array>} 邮件列表
   */
  async fetchEmailsWithParser(limit) {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: this.config.user,
        password: this.config.password,
        host: this.config.host,
        port: this.config.port,
        tls: this.config.secure,
        tlsOptions: { rejectUnauthorized: false }
      });

      const emails = [];
      let opened = false;
      let pendingParsers = 0;
      let fetchEnded = false;

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
            bodies: '',
            struct: true
          });

          f.on('message', (msg, seqno) => {
            pendingParsers++;
            const chunks = [];
            
            msg.on('body', (stream, info) => {
              stream.on('data', (chunk) => {
                chunks.push(chunk);
              });
            });

            msg.once('end', async () => {
              try {
                // 将Buffer数组合并
                const buffer = Buffer.concat(chunks);
                
                // 使用simpleParser解析邮件
                const parsed = await simpleParser(buffer);
                
                const email = {
                  id: seqno,
                  from: this.formatAddress(parsed.from),
                  to: this.formatAddress(parsed.to),
                  subject: parsed.subject || '无主题',
                  date: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
                  preview: this.extractPreview(parsed),
                  body: this.extractBody(parsed),
                  html: parsed.html || '',
                  text: parsed.text || '',
                  attachments: parsed.attachments ? parsed.attachments.length : 0
                };
                
                // 调试信息
                console.log(`邮件 ${seqno} 解析成功:`, {
                  subject: email.subject,
                  textLength: email.text?.length || 0,
                  htmlLength: email.html?.length || 0,
                  bodyLength: email.body?.length || 0
                });
                
                emails.push(email);
              } catch (parseError) {
                console.error(`解析邮件 ${seqno} 失败:`, parseError);
                // 如果解析失败，尝试直接获取原始内容
                try {
                  const rawBuffer = Buffer.concat(chunks);
                  const rawContent = rawBuffer.toString('utf8');
                  
                  // 检查是否是base64编码
                  let decodedContent = rawContent;
                  if (rawContent.includes('base64')) {
                    try {
                      // 尝试提取base64部分并解码
                      const base64Match = rawContent.match(/base64\s*\r?\n\r?\n([A-Za-z0-9+/=\s]+)/);
                      if (base64Match && base64Match[1]) {
                        const base64Text = base64Match[1].replace(/\s/g, '');
                        decodedContent = Buffer.from(base64Text, 'base64').toString('utf8');
                      }
                    } catch (e) {
                      console.error('Base64解码失败:', e);
                    }
                  }
                  
                  emails.push({
                    id: seqno,
                    from: '未知发件人',
                    to: '未知收件人',
                    subject: '解析失败 - 显示原始内容',
                    date: new Date().toISOString(),
                    preview: '邮件解析失败，显示原始内容',
                    body: decodedContent.substring(0, 500) + (decodedContent.length > 500 ? '...' : '')
                  });
                } catch (rawError) {
                  console.error('处理原始内容失败:', rawError);
                  emails.push({
                    id: seqno,
                    from: '未知发件人',
                    to: '未知收件人',
                    subject: '解析失败',
                    date: new Date().toISOString(),
                    preview: '邮件内容解析失败',
                    body: '无法解析邮件内容。'
                  });
                }
              } finally {
                pendingParsers--;
                // 如果fetch已经结束且所有解析都完成，则返回结果
                if (fetchEnded && pendingParsers === 0) {
                  // 按日期排序（最新的在前）
                  emails.sort((a, b) => new Date(b.date) - new Date(a.date));
                  resolve(emails);
                }
              }
            });
          });

          f.once('error', (err) => {
            imap.end();
            reject(err);
          });

          f.once('end', () => {
            imap.end();
            fetchEnded = true;
            // 如果没有待处理的解析器，立即返回结果
            if (pendingParsers === 0) {
              // 按日期排序（最新的在前）
              emails.sort((a, b) => new Date(b.date) - new Date(a.date));
              resolve(emails);
            }
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
   * 格式化地址信息
   * @param {Object|Array} address - 地址对象
   * @returns {string} 格式化后的地址
   */
  formatAddress(address) {
    if (!address) return '';
    
    if (Array.isArray(address) && address.length > 0) {
      const firstAddr = address[0];
      if (firstAddr.name && firstAddr.address) {
        return `${firstAddr.name} <${firstAddr.address}>`;
      } else if (firstAddr.address) {
        return firstAddr.address;
      }
    } else if (address.value && address.value.length > 0) {
      const firstAddr = address.value[0];
      if (firstAddr.name && firstAddr.address) {
        return `${firstAddr.name} <${firstAddr.address}>`;
      } else if (firstAddr.address) {
        return firstAddr.address;
      }
    } else if (address.text) {
      return address.text;
    }
    
    return '';
  }

  /**
   * 提取邮件预览
   * @param {Object} parsed - 解析后的邮件对象
   * @returns {string} 邮件预览
   */
  extractPreview(parsed) {
    // 优先使用纯文本预览
    if (parsed.text) {
      const text = parsed.text.replace(/\r\n/g, ' ').replace(/\n/g, ' ');
      return text.substring(0, 100) + (text.length > 100 ? '...' : '');
    }
    
    // 如果没有纯文本，尝试从HTML中提取
    if (parsed.html) {
      const text = parsed.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
      return text.substring(0, 100) + (text.length > 100 ? '...' : '');
    }
    
    return '无内容预览';
  }

  /**
   * 提取邮件正文
   * @param {Object} parsed - 解析后的邮件对象
   * @returns {string} 邮件正文
   */
  extractBody(parsed) {
    // 优先返回纯文本
    if (parsed.text && parsed.text.trim().length > 0) {
      const cleanText = parsed.text.replace(/\r\n/g, '\n').trim();
      return cleanText.substring(0, 2000) + (cleanText.length > 2000 ? '...' : '');
    }
    
    // 如果没有纯文本，从HTML中提取文本
    if (parsed.html && parsed.html.trim().length > 0) {
      try {
        // 移除HTML标签，保留换行
        let text = parsed.html
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<p>/gi, '\n')
          .replace(/<\/p>/gi, '\n')
          .replace(/<div>/gi, '\n')
          .replace(/<\/div>/gi, '\n')
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/</g, '<')
          .replace(/>/g, '>')
          .replace(/&/g, '&')
          .replace(/"/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, ' ')
          .trim();
        
        // 移除多余的空行
        text = text.replace(/\n\s*\n/g, '\n');
        
        return text.substring(0, 2000) + (text.length > 2000 ? '...' : '');
      } catch (error) {
        console.error('从HTML提取文本失败:', error);
        return '无法解析邮件内容';
      }
    }
    
    // 如果邮件有原始内容，尝试显示原始内容
    if (parsed.textAsHtml) {
      return parsed.textAsHtml.substring(0, 1000) + '...';
    }
    
    return '无邮件内容';
  }

  /**
   * 解码base64文本
   * @param {string} base64 - base64编码的文本
   * @returns {string} 解码后的文本
   */
  decodeBase64(base64) {
    try {
      return Buffer.from(base64, 'base64').toString('utf8');
    } catch (error) {
      console.error('Base64解码失败:', error);
      return base64;
    }
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
        body: '尊敬的QQ邮箱用户：\n\n感谢您选择QQ邮箱，我们将为您提供安全、稳定、快速的邮件服务。\n\nQQ邮箱团队',
        html: '',
        text: '尊敬的QQ邮箱用户：\n\n感谢您选择QQ邮箱，我们将为您提供安全、稳定、快速的邮件服务。\n\nQQ邮箱团队',
        attachments: 0
      },
      {
        id: 2,
        from: 'newsletter@example.com',
        to: '你的QQ邮箱',
        subject: '技术周刊 - 第202期',
        date: new Date(Date.now() - 86400000).toISOString(),
        preview: '本期技术周刊包含最新的前端框架更新、后端开发技巧和DevOps实践...',
        body: '亲爱的读者：\n\n欢迎阅读第202期技术周刊。本期内容包含：\n1. React 19新特性预览\n2. Node.js性能优化技巧\n3. 容器化部署最佳实践\n\n祝阅读愉快！\n技术周刊编辑部',
        html: '',
        text: '亲爱的读者：\n\n欢迎阅读第202期技术周刊。本期内容包含：\n1. React 19新特性预览\n2. Node.js性能优化技巧\n3. 容器化部署最佳实践\n\n祝阅读愉快！\n技术周刊编辑部',
        attachments: 0
      },
      {
        id: 3,
        from: 'notification@github.com',
        to: '你的QQ邮箱',
        subject: 'GitHub: 你有新的Pull Request',
        date: new Date(Date.now() - 172800000).toISOString(),
        preview: '你的项目 "dynamic-website" 有一个新的Pull Request等待审核...',
        body: '项目: dynamic-website\n分支: feature/email-integration\n提交者: waxiong\n\n请审核这个Pull Request。\n\nGitHub通知',
        html: '',
        text: '项目: dynamic-website\n分支: feature/email-integration\n提交者: waxiong\n\n请审核这个Pull Request。\n\nGitHub通知',
        attachments: 0
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