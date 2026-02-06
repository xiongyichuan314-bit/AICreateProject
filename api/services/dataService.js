/**
 * 数据服务层
 * 处理业务逻辑和数据操作
 */

const databaseService = require('./database');
const config = require('../config/config');
const logger = require('../utils/logger');

class DataService {
  constructor() {
    this.database = databaseService;
  }

  /**
   * 获取所有数据（分页）
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @returns {Promise<Object>} 分页数据
   */
  async getAllData(page = 1, limit = null) {
    try {
      const pageSize = limit || config.pagination.defaultPageSize;
      const validatedPage = Math.max(1, parseInt(page));
      const validatedLimit = Math.min(
        Math.max(1, parseInt(pageSize)),
        config.pagination.maxPageSize
      );

      // 获取数据总数
      const totalCount = await this.database.getTotalCount();
      
      // 获取分页数据
      const data = await this.database.getPaginatedData(
        validatedPage,
        validatedLimit
      );

      return {
        data,
        pagination: {
          currentPage: validatedPage,
          totalPages: Math.ceil(totalCount / validatedLimit),
          totalItems: totalCount,
          itemsPerPage: validatedLimit,
        },
      };
    } catch (error) {
      logger.error('获取所有数据失败', { page, limit, error: error.message });
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
  async searchData(query, page = 1, limit = null) {
    try {
      if (!query || query.trim() === '') {
        return this.getAllData(page, limit);
      }

      const searchQuery = query.trim();
      const pageSize = limit || config.pagination.defaultPageSize;
      const validatedPage = Math.max(1, parseInt(page));
      const validatedLimit = Math.min(
        Math.max(1, parseInt(pageSize)),
        config.pagination.maxPageSize
      );

      // 获取搜索结果总数
      const totalCount = await this.database.getTotalCount(searchQuery);
      
      // 获取分页搜索结果
      const data = await this.database.getPaginatedData(
        validatedPage,
        validatedLimit,
        searchQuery
      );

      return {
        data,
        pagination: {
          currentPage: validatedPage,
          totalPages: Math.ceil(totalCount / validatedLimit),
          totalItems: totalCount,
          itemsPerPage: validatedLimit,
        },
        searchQuery,
      };
    } catch (error) {
      logger.error('搜索数据失败', { query, page, limit, error: error.message });
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
      const validatedId = parseInt(id);
      if (isNaN(validatedId) || validatedId <= 0) {
        throw new Error('无效的数据ID');
      }

      const data = await this.database.getDataById(validatedId);
      if (!data) {
        throw new Error('数据不存在');
      }

      return data;
    } catch (error) {
      logger.error('根据ID获取数据失败', { id, error: error.message });
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
      // 验证输入
      if (!content || content.trim() === '') {
        throw new Error('内容不能为空');
      }

      const trimmedContent = content.trim();
      
      // 创建数据
      const data = await this.database.createData(trimmedContent);
      
      logger.info('数据创建成功', { id: data.id });
      return data;
    } catch (error) {
      logger.error('创建数据失败', { content, error: error.message });
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
      // 验证输入
      const validatedId = parseInt(id);
      if (isNaN(validatedId) || validatedId <= 0) {
        throw new Error('无效的数据ID');
      }

      if (!content || content.trim() === '') {
        throw new Error('内容不能为空');
      }

      const trimmedContent = content.trim();
      
      // 检查数据是否存在
      const existingData = await this.database.getDataById(validatedId);
      if (!existingData) {
        throw new Error('数据不存在');
      }

      // 更新数据
      const updated = await this.database.updateData(validatedId, trimmedContent);
      if (!updated) {
        throw new Error('更新数据失败');
      }

      // 获取更新后的数据
      const updatedData = await this.database.getDataById(validatedId);
      
      logger.info('数据更新成功', { id: validatedId });
      return updatedData;
    } catch (error) {
      logger.error('更新数据失败', { id, content, error: error.message });
      throw error;
    }
  }

  /**
   * 删除数据
   * @param {number} id - 数据ID
   * @returns {Promise<boolean>} 删除结果
   */
  async deleteData(id) {
    try {
      const validatedId = parseInt(id);
      if (isNaN(validatedId) || validatedId <= 0) {
        throw new Error('无效的数据ID');
      }

      // 检查数据是否存在
      const existingData = await this.database.getDataById(validatedId);
      if (!existingData) {
        throw new Error('数据不存在');
      }

      // 删除数据
      const deleted = await this.database.deleteData(validatedId);
      if (!deleted) {
        throw new Error('删除数据失败');
      }

      logger.info('数据删除成功', { id: validatedId });
      return true;
    } catch (error) {
      logger.error('删除数据失败', { id, error: error.message });
      throw error;
    }
  }

  /**
   * 批量创建数据（用于测试）
   * @param {Array<string>} contents - 内容数组
   * @returns {Promise<Array<Object>>} 创建的数据列表
   */
  async batchCreateData(contents) {
    try {
      if (!Array.isArray(contents)) {
        throw new Error('内容必须是数组');
      }

      const results = [];
      
      // 使用事务确保原子性
      await this.database.beginTransaction();
      
      try {
        for (const content of contents) {
          if (content && content.trim() !== '') {
            const data = await this.database.createData(content.trim());
            results.push(data);
          }
        }
        
        await this.database.commitTransaction();
        logger.info('批量创建数据成功', { count: results.length });
        return results;
      } catch (error) {
        await this.database.rollbackTransaction();
        throw error;
      }
    } catch (error) {
      logger.error('批量创建数据失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取数据统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getStatistics() {
    try {
      const totalCount = await this.database.getTotalCount();
      
      // 获取最近24小时的数据
      const recentData = await this.database.query(`
        SELECT COUNT(*) as recentCount 
        FROM data 
        WHERE timestamp >= datetime('now', '-1 day')
      `);
      
      // 获取内容长度统计
      const lengthStats = await this.database.queryOne(`
        SELECT 
          AVG(LENGTH(content)) as avgLength,
          MAX(LENGTH(content)) as maxLength,
          MIN(LENGTH(content)) as minLength
        FROM data
      `);

      return {
        totalCount,
        recent24hCount: recentData[0]?.recentCount || 0,
        contentStats: lengthStats || {},
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('获取数据统计失败', { error: error.message });
      throw error;
    }
  }
}

// 创建单例实例
const dataService = new DataService();

module.exports = dataService;