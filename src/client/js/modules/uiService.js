/**
 * UI服务模块
 * 处理用户界面相关的操作
 */

class UIService {
  constructor() {
    this.alertTimeout = null;
  }

  /**
   * 显示提示消息
   * @param {string} message - 消息内容
   * @param {string} type - 消息类型 (success, danger, warning, info)
   * @param {number} duration - 显示时长（毫秒）
   */
  showAlert(message, type = 'info', duration = 5000) {
    // 移除现有的提示
    this.removeExistingAlert();

    // 创建提示元素
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show alert-fixed`;
    alertDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 400px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      animation: slideIn 0.3s ease-out;
    `;

    alertDiv.innerHTML = `
      <div class="d-flex align-items-center">
        <div class="flex-grow-1">${message}</div>
        <button type="button" class="btn-close ms-2" data-bs-dismiss="alert"></button>
      </div>
    `;

    document.body.appendChild(alertDiv);

    // 添加动画样式
    this.addAlertStyles();

    // 自动隐藏
    if (duration > 0) {
      this.alertTimeout = setTimeout(() => {
        this.removeAlert(alertDiv);
      }, duration);
    }

    // 点击关闭按钮时清除定时器
    const closeBtn = alertDiv.querySelector('.btn-close');
    closeBtn.addEventListener('click', () => {
      if (this.alertTimeout) {
        clearTimeout(this.alertTimeout);
        this.alertTimeout = null;
      }
    });
  }

  /**
   * 移除现有的提示
   */
  removeExistingAlert() {
    const existingAlert = document.querySelector('.alert-fixed');
    if (existingAlert) {
      this.removeAlert(existingAlert);
    }
    
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
      this.alertTimeout = null;
    }
  }

  /**
   * 移除提示元素
   * @param {HTMLElement} alertElement - 提示元素
   */
  removeAlert(alertElement) {
    if (alertElement && alertElement.parentNode) {
      alertElement.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (alertElement.parentNode) {
          alertElement.parentNode.removeChild(alertElement);
        }
      }, 300);
    }
  }

  /**
   * 添加提示样式
   */
  addAlertStyles() {
    if (!document.querySelector('#alert-styles')) {
      const style = document.createElement('style');
      style.id = 'alert-styles';
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        
        .alert-fixed {
          animation: slideIn 0.3s ease-out;
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * 显示加载指示器
   * @param {boolean} show - 是否显示
   */
  showLoading(show) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const dataContainer = document.getElementById('dataContainer');
    
    if (loadingIndicator) {
      loadingIndicator.style.display = show ? 'block' : 'none';
    }
    
    if (dataContainer) {
      dataContainer.style.opacity = show ? '0.5' : '1';
      dataContainer.style.pointerEvents = show ? 'none' : 'auto';
    }
  }

  /**
   * 格式化日期
   * @param {string} dateString - 日期字符串
   * @returns {string} 格式化后的日期
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return '无效日期';
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    // 相对时间显示
    if (diffMins < 1) {
      return '刚刚';
    } else if (diffMins < 60) {
      return `${diffMins}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    }
    
    // 完整日期格式
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * 高亮搜索关键词
   * @param {string} text - 原始文本
   * @param {string} searchTerm - 搜索关键词
   * @returns {string} 高亮后的HTML
   */
  highlightSearchTerms(text, searchTerm) {
    if (!searchTerm || !text) {
      return this.escapeHtml(text || '');
    }
    
    const escapedText = this.escapeHtml(text);
    const escapedSearchTerm = this.escapeHtml(searchTerm);
    
    // 创建正则表达式，忽略大小写
    const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
    
    return escapedText.replace(regex, '<mark class="highlight bg-warning text-dark">$1</mark>');
  }

  /**
   * 转义HTML特殊字符
   * @param {string} text - 原始文本
   * @returns {string} 转义后的文本
   */
  escapeHtml(text) {
    if (!text) return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 更新分页控件
   * @param {Object} pagination - 分页信息
   * @param {Function} onPageChange - 页面改变回调函数
   */
  updatePagination(pagination, onPageChange) {
    const paginationNav = document.getElementById('paginationNav');
    const paginationList = document.getElementById('paginationList');
    
    if (!paginationNav || !paginationList) {
      return;
    }
    
    const { currentPage, totalPages } = pagination;
    
    if (totalPages <= 1) {
      paginationNav.style.display = 'none';
      return;
    }
    
    paginationNav.style.display = 'block';
    
    let paginationHtml = '';
    
    // 上一页按钮
    if (currentPage > 1) {
      paginationHtml += `
        <li class="page-item">
          <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="上一页">
            <span aria-hidden="true">&laquo;</span>
          </a>
        </li>
      `;
    }
    
    // 页码按钮
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // 调整起始页码
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // 显示第一页和省略号
    if (startPage > 1) {
      paginationHtml += `
        <li class="page-item">
          <a class="page-link" href="#" data-page="1">1</a>
        </li>
      `;
      if (startPage > 2) {
        paginationHtml += `
          <li class="page-item disabled">
            <span class="page-link">...</span>
          </li>
        `;
      }
    }
    
    // 显示页码范围
    for (let i = startPage; i <= endPage; i++) {
      paginationHtml += `
        <li class="page-item ${i === currentPage ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>
      `;
    }
    
    // 显示最后一页和省略号
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationHtml += `
          <li class="page-item disabled">
            <span class="page-link">...</span>
          </li>
        `;
      }
      paginationHtml += `
        <li class="page-item">
          <a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>
        </li>
      `;
    }
    
    // 下一页按钮
    if (currentPage < totalPages) {
      paginationHtml += `
        <li class="page-item">
          <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="下一页">
            <span aria-hidden="true">&raquo;</span>
          </a>
        </li>
      `;
    }
    
    paginationList.innerHTML = paginationHtml;
    
    // 添加点击事件
    paginationList.querySelectorAll('.page-link').forEach(link => {
      if (!link.parentElement.classList.contains('disabled')) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const page = parseInt(link.dataset.page);
          if (page && onPageChange) {
            onPageChange(page);
          }
        });
      }
    });
  }

  /**
   * 显示确认对话框
   * @param {string} message - 确认消息
   * @param {Function} onConfirm - 确认回调
   * @param {Function} onCancel - 取消回调
   */
  showConfirm(message, onConfirm, onCancel = null) {
    if (window.confirm(message)) {
      if (onConfirm) onConfirm();
    } else {
      if (onCancel) onCancel();
    }
  }

  /**
   * 更新数据总数显示
   * @param {number} count - 数据总数
   */
  updateTotalCount(count) {
    const totalCountElement = document.getElementById('totalCount');
    if (totalCountElement) {
      totalCountElement.textContent = count;
      totalCountElement.className = `badge ${count > 0 ? 'bg-primary' : 'bg-secondary'}`;
    }
  }
}

// 创建单例实例
const uiService = new UIService();

export default uiService;