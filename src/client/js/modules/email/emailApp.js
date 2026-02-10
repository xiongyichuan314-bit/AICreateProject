/**
 * 邮件应用主文件
 */

import emailService from './emailService.js';

class EmailApp {
  constructor() {
    // DOM元素
    this.loadingIndicator = document.getElementById('loadingIndicator');
    this.emailList = document.getElementById('emailList');
    this.emptyState = document.getElementById('emptyState');
    this.errorState = document.getElementById('errorState');
    this.errorMessage = document.getElementById('errorMessage');
    this.configStatusText = document.getElementById('configStatusText');
    this.configBadge = document.getElementById('configBadge');
    this.emailCount = document.getElementById('emailCount');
    
    // 按钮
    this.refreshBtn = document.getElementById('refreshBtn');
    this.retryBtn = document.getElementById('retryBtn');
    
    // 模态框
    this.emailModal = new bootstrap.Modal(document.getElementById('emailModal'));
    
    // 状态
    this.currentLimit = 3;
    
    // 绑定方法
    this.init = this.init.bind(this);
    this.loadEmails = this.loadEmails.bind(this);
    this.loadConfig = this.loadConfig.bind(this);
    this.displayEmails = this.displayEmails.bind(this);
    this.showEmailDetail = this.showEmailDetail.bind(this);
    this.showLoading = this.showLoading.bind(this);
    this.showEmpty = this.showEmpty.bind(this);
    this.showError = this.showError.bind(this);
    this.showEmailList = this.showEmailList.bind(this);
    this.handleRefresh = this.handleRefresh.bind(this);
    this.handleLimitChange = this.handleLimitChange.bind(this);
    this.createEmailCard = this.createEmailCard.bind(this);
    this.getAvatarText = this.getAvatarText.bind(this);
  }

  /**
   * 初始化应用
   */
  async init() {
    try {
      // 绑定事件监听器
      this.bindEvents();
      
      // 加载配置状态
      await this.loadConfig();
      
      // 加载邮件
      await this.loadEmails();
      
      console.log('邮件应用初始化完成');
    } catch (error) {
      console.error('邮件应用初始化失败:', error);
      this.showError('应用初始化失败: ' + error.message);
    }
  }

  /**
   * 绑定事件监听器
   */
  bindEvents() {
    // 刷新按钮
    if (this.refreshBtn) {
      this.refreshBtn.addEventListener('click', this.handleRefresh);
    }
    
    // 重试按钮
    if (this.retryBtn) {
      this.retryBtn.addEventListener('click', this.handleRefresh);
    }
    
    // 显示数量下拉菜单
    const limitItems = document.querySelectorAll('.dropdown-item[data-limit]');
    limitItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const limit = parseInt(e.target.getAttribute('data-limit'));
        this.handleLimitChange(limit);
      });
    });
  }

  /**
   * 加载邮箱配置
   */
  async loadConfig() {
    try {
      const result = await emailService.getEmailConfig();
      
      if (result.success) {
        const { config, instructions } = result;
        
        // 更新配置状态文本
        this.configStatusText.textContent = instructions;
        
        // 更新配置徽章
        if (config.configured) {
          this.configBadge.className = 'badge bg-success';
          this.configBadge.textContent = '已配置';
        } else {
          this.configBadge.className = 'badge bg-warning text-dark';
          this.configBadge.textContent = '模拟数据';
        }
      }
    } catch (error) {
      console.error('加载配置失败:', error);
      this.configStatusText.textContent = '配置检查失败';
      this.configBadge.className = 'badge bg-danger';
      this.configBadge.textContent = '错误';
    }
  }

  /**
   * 加载邮件（带重试机制）
   */
  async loadEmails() {
    const maxRetries = 2;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // 显示加载状态，如果是重试则显示重试信息
        if (attempt > 1) {
          this.showLoading(`正在重试 (${attempt}/${maxRetries})...`);
        } else {
          this.showLoading();
        }
        
        const result = await emailService.getRecentEmails(this.currentLimit);
        
        if (result.success) {
          this.displayEmails(result.data);
          this.updateEmailCount(result.count);
          return; // 成功，退出函数
        } else {
          throw new Error('API返回失败');
        }
      } catch (error) {
        lastError = error;
        console.error(`第${attempt}次加载邮件失败:`, error);
        
        if (attempt < maxRetries) {
          // 等待1秒后重试
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
      }
    }
    
    // 所有重试都失败
    console.error('所有重试都失败:', lastError);
    this.showError('加载邮件失败: ' + (lastError?.message || '未知错误'));
  }

  /**
   * 显示邮件列表
   * @param {Array} emails - 邮件数组
   */
  displayEmails(emails) {
    if (!emails || emails.length === 0) {
      this.showEmpty();
      return;
    }
    
    // 清空现有内容
    this.emailList.innerHTML = '';
    
    // 创建邮件卡片
    emails.forEach(email => {
      const emailCard = this.createEmailCard(email);
      this.emailList.appendChild(emailCard);
    });
    
    this.showEmailList();
  }

  /**
   * 创建邮件卡片
   * @param {Object} email - 邮件对象
   * @returns {HTMLElement} 邮件卡片元素
   */
  createEmailCard(email) {
    const senderName = emailService.extractSenderName(email.from);
    const senderEmail = emailService.extractSenderEmail(email.from);
    const formattedDate = emailService.formatDate(email.date);
    const avatarText = this.getAvatarText(senderName);
    const previewText = emailService.truncateText(email.preview || email.body, 120);
    
    const col = document.createElement('div');
    col.className = 'col-12 mb-3';
    
    col.innerHTML = `
      <div class="card email-card" data-email-id="${email.id}">
        <div class="card-body">
          <div class="d-flex">
            <!-- 发件人头像 -->
            <div class="flex-shrink-0 me-3">
              <div class="sender-avatar" title="${senderEmail}">
                ${avatarText}
              </div>
            </div>
            
            <!-- 邮件内容 -->
            <div class="flex-grow-1">
              <div class="d-flex justify-content-between align-items-start mb-1">
                <div>
                  <h6 class="card-title mb-0">${senderName}</h6>
                  <small class="text-muted">${senderEmail}</small>
                </div>
                <div class="email-date">
                  <i class="far fa-clock me-1"></i>${formattedDate}
                </div>
              </div>
              
              <h6 class="card-subtitle mb-2 text-primary">${email.subject || '无主题'}</h6>
              
              <p class="card-text email-preview mb-2">
                ${previewText}
              </p>
              
              <div class="d-flex justify-content-between align-items-center">
                <small class="text-muted">
                  <i class="far fa-envelope me-1"></i>邮件ID: ${email.id}
                </small>
                <button class="btn btn-sm btn-outline-primary view-detail-btn">
                  <i class="fas fa-eye me-1"></i>查看详情
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // 添加查看详情按钮事件
    const viewDetailBtn = col.querySelector('.view-detail-btn');
    viewDetailBtn.addEventListener('click', () => {
      this.showEmailDetail(email);
    });
    
    // 添加卡片点击事件（除了按钮区域）
    const card = col.querySelector('.email-card');
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.view-detail-btn') && !e.target.closest('.dropdown')) {
        this.showEmailDetail(email);
      }
    });
    
    return col;
  }

  /**
   * 获取头像文本（取发件人名称的首字母）
   * @param {string} name - 发件人名称
   * @returns {string} 头像文本
   */
  getAvatarText(name) {
    if (!name) return '?';
    
    // 取第一个字符的大写
    const firstChar = name.charAt(0).toUpperCase();
    
    // 如果是中文字符，直接返回
    if (/[\u4e00-\u9fa5]/.test(firstChar)) {
      return firstChar;
    }
    
    // 如果是字母，返回大写
    if (/[A-Za-z]/.test(firstChar)) {
      return firstChar.toUpperCase();
    }
    
    return '?';
  }

  /**
   * 显示邮件详情
   * @param {Object} email - 邮件对象
   */
  showEmailDetail(email) {
    const senderName = emailService.extractSenderName(email.from);
    const senderEmail = emailService.extractSenderEmail(email.from);
    const formattedDate = emailService.formatDate(email.date);
    const avatarText = this.getAvatarText(senderName);
    
    // 更新模态框内容
    document.getElementById('modalSubject').textContent = email.subject || '无主题';
    document.getElementById('modalAvatar').textContent = avatarText;
    document.getElementById('modalAvatar').title = senderEmail;
    document.getElementById('modalSender').textContent = senderName;
    document.getElementById('modalEmail').textContent = senderEmail;
    document.getElementById('modalDate').textContent = formattedDate;
    document.getElementById('modalBody').textContent = email.body || '无内容';
    
    // 显示模态框
    this.emailModal.show();
  }

  /**
   * 更新邮件数量显示
   * @param {number} count - 邮件数量
   */
  updateEmailCount(count) {
    if (this.emailCount) {
      this.emailCount.textContent = count;
    }
  }

  /**
   * 处理刷新
   */
  async handleRefresh() {
    await this.loadEmails();
  }

  /**
   * 处理显示数量变化
   * @param {number} limit - 新的数量限制
   */
  async handleLimitChange(limit) {
    this.currentLimit = limit;
    await this.loadEmails();
  }

  /**
   * 显示加载状态
   * @param {string} message - 可选的自定义消息
   */
  showLoading(message = '正在加载邮件...') {
    this.loadingIndicator.style.display = 'block';
    this.emailList.style.display = 'none';
    this.emptyState.style.display = 'none';
    this.errorState.style.display = 'none';
    
    // 更新加载消息
    const loadingText = this.loadingIndicator.querySelector('.loading-text');
    if (loadingText) {
      loadingText.textContent = message;
    }
  }

  /**
   * 显示空状态
   */
  showEmpty() {
    this.loadingIndicator.style.display = 'none';
    this.emailList.style.display = 'none';
    this.emptyState.style.display = 'block';
    this.errorState.style.display = 'none';
  }

  /**
   * 显示错误状态
   * @param {string} message - 错误信息
   */
  showError(message) {
    this.loadingIndicator.style.display = 'none';
    this.emailList.style.display = 'none';
    this.emptyState.style.display = 'none';
    this.errorState.style.display = 'block';
    
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
    }
  }

  /**
   * 显示邮件列表
   */
  showEmailList() {
    this.loadingIndicator.style.display = 'none';
    this.emailList.style.display = 'flex';
    this.emptyState.style.display = 'none';
    this.errorState.style.display = 'none';
  }
}

// 创建应用实例并初始化
const emailApp = new EmailApp();

// 当DOM加载完成时初始化应用
document.addEventListener('DOMContentLoaded', () => {
  emailApp.init();
});

// 导出应用实例
export default emailApp;