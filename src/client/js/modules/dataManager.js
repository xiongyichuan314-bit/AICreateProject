/**
 * 数据管理模块
 * 管理应用程序状态和数据操作
 */

import apiService from './apiService.js';
import uiService from './uiService.js';

class DataManager {
  constructor() {
    this.currentPage = 1;
    this.currentSearch = '';
    this.totalItems = 0;
    this.data = [];
    
    // 绑定方法
    this.loadData = this.loadData.bind(this);
    this.searchData = this.searchData.bind(this);
    this.createData = this.createData.bind(this);
    this.updateData = this.updateData.bind(this);
    this.deleteData = this.deleteData.bind(this);
  }

  /**
   * 加载数据
   * @param {number} page - 页码
   * @param {string} searchQuery - 搜索关键词
   * @returns {Promise<Object>} 加载的数据
   */
  async loadData(page = 1, searchQuery = '') {
    try {
      uiService.showLoading(true);
      
      let result;
      if (searchQuery && searchQuery.trim() !== '') {
        result = await apiService.searchData(searchQuery, page);
        this.currentSearch = searchQuery;
      } else {
        result = await apiService.getAllData(page);
        this.currentSearch = '';
      }
      
      if (result.success) {
        this.currentPage = page;
        this.data = result.data || [];
        this.totalItems = result.pagination?.totalItems || this.data.length;
        
        return {
          success: true,
          data: this.data,
          pagination: result.pagination,
          searchQuery: this.currentSearch,
        };
      } else {
        throw new Error(result.error?.message || '加载数据失败');
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      uiService.showAlert(`加载数据失败: ${error.message}`, 'danger');
      throw error;
    } finally {
      uiService.showLoading(false);
    }
  }

  /**
   * 搜索数据
   * @param {string} query - 搜索关键词
   * @returns {Promise<Object>} 搜索结果
   */
  async searchData(query) {
    return this.loadData(1, query);
  }

  /**
   * 创建数据
   * @param {string} content - 内容
   * @returns {Promise<Object>} 创建的数据
   */
  async createData(content) {
    try {
      uiService.showLoading(true);
      
      const result = await apiService.createData(content);
      
      if (result.success) {
        uiService.showAlert('数据创建成功', 'success');
        
        // 重新加载当前页数据
        await this.loadData(this.currentPage, this.currentSearch);
        
        return {
          success: true,
          data: result.data,
        };
      } else {
        throw new Error(result.error?.message || '创建数据失败');
      }
    } catch (error) {
      console.error('创建数据失败:', error);
      uiService.showAlert(`创建数据失败: ${error.message}`, 'danger');
      throw error;
    } finally {
      uiService.showLoading(false);
    }
  }

  /**
   * 更新数据
   * @param {number} id - 数据ID
   * @param {string} content - 新内容
   * @returns {Promise<Object>} 更新结果
   */
  async updateData(id, content) {
    try {
      uiService.showLoading(true);
      
      const result = await apiService.updateData(id, content);
      
      if (result.success) {
        uiService.showAlert('数据更新成功', 'success');
        
        // 重新加载当前页数据
        await this.loadData(this.currentPage, this.currentSearch);
        
        return {
          success: true,
          data: result.data,
        };
      } else {
        throw new Error(result.error?.message || '更新数据失败');
      }
    } catch (error) {
      console.error('更新数据失败:', error);
      uiService.showAlert(`更新数据失败: ${error.message}`, 'danger');
      throw error;
    } finally {
      uiService.showLoading(false);
    }
  }

  /**
   * 删除数据
   * @param {number} id - 数据ID
   * @returns {Promise<boolean>} 删除结果
   */
  async deleteData(id) {
    try {
      uiService.showConfirm(
        '确定要删除这条数据吗？此操作不可撤销。',
        async () => {
          try {
            uiService.showLoading(true);
            
            const result = await apiService.deleteData(id);
            
            if (result.success) {
              uiService.showAlert('数据删除成功', 'success');
              
              // 重新加载当前页数据
              await this.loadData(this.currentPage, this.currentSearch);
              
              return true;
            } else {
              throw new Error(result.error?.message || '删除数据失败');
            }
          } catch (error) {
            console.error('删除数据失败:', error);
            uiService.showAlert(`删除数据失败: ${error.message}`, 'danger');
            throw error;
          } finally {
            uiService.showLoading(false);
          }
        },
        () => {
          console.log('删除操作已取消');
        }
      );
      
      return true;
    } catch (error) {
      console.error('删除数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取数据统计
   * @returns {Promise<Object>} 统计信息
   */
  async getStatistics() {
    try {
      const result = await apiService.getStatistics();
      
      if (result.success) {
        return {
          success: true,
          stats: result.stats,
        };
      } else {
        throw new Error(result.error?.message || '获取统计信息失败');
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 检查API健康状态
   * @returns {Promise<boolean>} 是否健康
   */
  async checkHealth() {
    try {
      const result = await apiService.healthCheck();
      return result.status === 'healthy';
    } catch (error) {
      console.error('健康检查失败:', error);
      return false;
    }
  }

  /**
   * 获取当前状态
   * @returns {Object} 当前状态
   */
  getState() {
    return {
      currentPage: this.currentPage,
      currentSearch: this.currentSearch,
      totalItems: this.totalItems,
      data: [...this.data],
    };
  }

  /**
   * 重置状态
   */
  resetState() {
    this.currentPage = 1;
    this.currentSearch = '';
    this.totalItems = 0;
    this.data = [];
  }

  /**
   * 获取数据项
   * @param {number} id - 数据ID
   * @returns {Object|null} 数据项
   */
  getDataItem(id) {
    return this.data.find(item => item.id === id) || null;
  }

  /**
   * 过滤数据
   * @param {Function} filterFn - 过滤函数
   * @returns {Array} 过滤后的数据
   */
  filterData(filterFn) {
    return this.data.filter(filterFn);
  }

  /**
   * 排序数据
   * @param {Function} compareFn - 比较函数
   * @returns {Array} 排序后的数据
   */
  sortData(compareFn) {
    return [...this.data].sort(compareFn);
  }
}

// 创建单例实例
const dataManager = new DataManager();

export default dataManager;