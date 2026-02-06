/**
 * 主应用程序文件
 * 重构后的前端应用
 */

import dataManager from './js/modules/dataManager.js';
import uiService from './js/modules/uiService.js';

class App {
  constructor() {
    // DOM元素
    this.dataForm = document.getElementById('dataForm');
    this.contentInput = document.getElementById('content');
    this.searchInput = document.getElementById('searchInput');
    this.searchBtn = document.getElementById('searchBtn');
    this.refreshBtn = document.getElementById('refreshBtn');
    this.viewAllBtn = document.getElementById('viewAllBtn');
    this.dataContainer = document.getElementById('dataContainer');
    this.totalCount = document.getElementById('totalCount');
    
    // 模态框元素
    this.editModal = document.getElementById('editModal');
    this.editId = document.getElementById('editId');
    this.editContent = document.getElementById('editContent');
    this.saveEditBtn = document.getElementById('saveEditBtn');
    
    // 绑定方法
    this.init = this.init.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleRefresh = this.handleRefresh.bind(this);
    this.handleViewAll = this.handleViewAll.bind(this);
    this.handleEditSave = this.handleEditSave.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.displayData = this.displayData.bind(this);
    this.editItem = this.editItem.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
  }

  /**
   * 初始化应用
   */
  async init() {
    try {
      // 检查API健康状态
      const isHealthy = await dataManager.checkHealth();
      if (!isHealthy) {
        uiService.showAlert('API服务不可用，请检查后端服务是否运行', 'warning');
      }
      
      // 加载初始数据
      await this.loadData();
      
      // 绑定事件监听器
      this.bindEvents();
      
      // 初始化Bootstrap模态框
      this.bsEditModal = new bootstrap.Modal(this.editModal);
      
      console.log('应用程序初始化完成');
    } catch (error) {
      console.error('应用程序初始化失败:', error);
      uiService.showAlert('应用程序初始化失败', 'danger');
    }
  }

  /**
   * 绑定事件监听器
   */
  bindEvents() {
    // 表单提交
    if (this.dataForm) {
      this.dataForm.addEventListener('submit', this.handleFormSubmit);
    }
    
    // 搜索按钮
    if (this.searchBtn) {
      this.searchBtn.addEventListener('click', this.handleSearch);
    }
    
    // 搜索输入框回车键
    if (this.searchInput) {
      this.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleSearch();
        }
      });
    }
    
    // 刷新按钮
    if (this.refreshBtn) {
      this.refreshBtn.addEventListener('click', this.handleRefresh);
    }
    
    // 查看全部按钮
    if (this.viewAllBtn) {
      this.viewAllBtn.addEventListener('click', this.handleViewAll);
    }
    
    // 保存编辑按钮
    if (this.saveEditBtn) {
      this.saveEditBtn.addEventListener('click', this.handleEditSave);
    }
    
    // 模态框隐藏时重置表单
    if (this.editModal) {
      this.editModal.addEventListener('hidden.bs.modal', () => {
        this.editId.value = '';
        this.editContent.value = '';
      });
    }
  }

  /**
   * 加载数据
   * @param {number} page - 页码
   * @param {string} searchQuery - 搜索关键词
   */
  async loadData(page = 1, searchQuery = '') {
    try {
      const result = await dataManager.loadData(page, searchQuery);
      
      if (result.success) {
        this.displayData(result.data, result.pagination, result.searchQuery);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  }

  /**
   * 显示数据
   * @param {Array} data - 数据数组
   * @param {Object} pagination - 分页信息
   * @param {string} searchQuery - 搜索关键词
   */
  displayData(data, pagination, searchQuery = '') {
    if (!this.dataContainer) return;
    
    // 更新数据总数
    uiService.updateTotalCount(data.length);
    
    // 显示数据或空状态
    if (!data || data.length === 0) {
      const message = searchQuery 
        ? `没有找到包含"${searchQuery}"的数据`
        : '暂无数据，请添加第一条数据';
      
      this.dataContainer.innerHTML = `
        <div class="text-center py-5">
          <div class="mb-3">
            <i class="fas fa-inbox fa-3x text-muted"></i>
          </div>
          <h5 class="text-muted">${message}</h5>
        </div>
      `;
      return;
    }
    
    // 生成数据HTML
    const html = data.map(item => this.createDataItemHTML(item, searchQuery)).join('');
    this.dataContainer.innerHTML = html;
    
    // 更新分页控件
    if (pagination) {
      uiService.updatePagination(pagination, this.handlePageChange);
    }
  }

  /**
   * 创建数据项HTML
   * @param {Object} item - 数据项
   * @param {string} searchQuery - 搜索关键词
   * @returns {string} HTML字符串
   */
  createDataItemHTML(item, searchQuery = '') {
    const formattedDate = uiService.formatDate(item.timestamp);
    const highlightedContent = uiService.highlightSearchTerms(item.content, searchQuery);
    
    return `
      <div class="data-item card mb-3 fade-in ${searchQuery ? 'border-warning' : ''}">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <span class="badge bg-secondary me-2">#${item.id}</span>
              <small class="text-muted">
                <i class="fas fa-clock me-1"></i>${formattedDate}
              </small>
            </div>
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-primary" onclick="app.editItem(${item.id}, '${uiService.escapeHtml(item.content)}')">
                <i class="fas fa-edit me-1"></i>编辑
              </button>
              <button class="btn btn-outline-danger" onclick="app.deleteItem(${item.id})">
                <i class="fas fa-trash me-1"></i>删除
              </button>
            </div>
          </div>
          <div class="data-content mt-2">
            ${highlightedContent}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 处理表单提交
   * @param {Event} e - 事件对象
   */
  async handleFormSubmit(e) {
    e.preventDefault();
    
    const content = this.contentInput?.value.trim();
    if (!content) {
      uiService.showAlert('请输入内容', 'warning');
      return;
    }
    
    try {
      await dataManager.createData(content);
      
      // 清空输入框
      if (this.contentInput) {
        this.contentInput.value = '';
      }
    } catch (error) {
      console.error('创建数据失败:', error);
    }
  }

  /**
   * 处理搜索
   */
  async handleSearch() {
    const query = this.searchInput?.value.trim() || '';
    await this.loadData(1, query);
  }

  /**
   * 处理刷新
   */
  async handleRefresh() {
    const state = dataManager.getState();
    await this.loadData(state.currentPage, state.currentSearch);
  }

  /**
   * 处理查看全部
   */
  async handleViewAll() {
    if (this.searchInput) {
      this.searchInput.value = '';
    }
    await this.loadData(1, '');
  }

  /**
   * 处理页面改变
   * @param {number} page - 页码
   */
  async handlePageChange(page) {
    await this.loadData(page, dataManager.getState().currentSearch);
  }

  /**
   * 编辑数据项
   * @param {number} id - 数据ID
   * @param {string} content - 数据内容
   */
  editItem(id, content) {
    if (this.editId && this.editContent) {
      this.editId.value = id;
      this.editContent.value = content;
      
      if (this.bsEditModal) {
        this.bsEditModal.show();
      }
    }
  }

  /**
   * 删除数据项
   * @param {number} id - 数据ID
   */
  async deleteItem(id) {
    try {
      await dataManager.deleteData(id);
    } catch (error) {
      console.error('删除数据失败:', error);
    }
  }

  /**
   * 处理编辑保存
   */
  async handleEditSave() {
    const id = this.editId?.value;
    const content = this.editContent?.value.trim();
    
    if (!id || !content) {
      uiService.showAlert('请填写完整信息', 'warning');
      return;
    }
    
    try {
      await dataManager.updateData(parseInt(id), content);
      
      // 关闭模态框
      if (this.bsEditModal) {
        this.bsEditModal.hide();
      }
    } catch (error) {
      console.error('更新数据失败:', error);
    }
  }
}

// 创建应用实例并初始化
const app = new App();

// 将应用实例暴露给全局作用域，供内联事件处理器使用
window.app = app;

// 当DOM加载完成时初始化应用
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});

// 导出应用实例（如果需要模块化）
export default app;
