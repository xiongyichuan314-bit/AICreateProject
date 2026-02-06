/**
 * API服务模块
 * 封装所有与后端API的通信
 */

const API_BASE_URL = 'http://localhost:8081';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * 获取所有数据（分页）
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @returns {Promise<Object>} 数据响应
   */
  async getAllData(page = 1, limit = 10) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/data?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('获取数据失败:', error);
      throw error;
    }
  }

  /**
   * 搜索数据
   * @param {string} query - 搜索关键词
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @returns {Promise<Object>} 搜索结果
   */
  async searchData(query, page = 1, limit = 10) {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(
        `${this.baseUrl}/api/search?q=${encodedQuery}&page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('搜索数据失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取数据
   * @param {number} id - 数据ID
   * @returns {Promise<Object>} 数据
   */
  async getDataById(id) {
    try {
      const response = await fetch(`${this.baseUrl}/api/data/${id}`, {
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
      console.error('获取数据失败:', error);
      throw error;
    }
  }

  /**
   * 创建数据
   * @param {string} content - 内容
   * @returns {Promise<Object>} 创建的数据
   */
  async createData(content) {
    try {
      const response = await fetch(`${this.baseUrl}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP错误: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('创建数据失败:', error);
      throw error;
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
      const response = await fetch(`${this.baseUrl}/api/data/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP错误: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('更新数据失败:', error);
      throw error;
    }
  }

  /**
   * 删除数据
   * @param {number} id - 数据ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteData(id) {
    try {
      const response = await fetch(`${this.baseUrl}/api/data/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP错误: ${response.status}`);
      }

      return await response.json();
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
      const response = await fetch(`${this.baseUrl}/api/data/stats/summary`, {
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
      console.error('获取统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 健康检查
   * @returns {Promise<Object>} 健康状态
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
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
      console.error('健康检查失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
const apiService = new ApiService();

export default apiService;