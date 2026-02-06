/**
 * 数据库服务层
 * 封装所有数据库操作
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('../config/config');
const logger = require('../utils/logger');

class DatabaseService {
  constructor() {
    this.dbPath = path.resolve(__dirname, '../../', config.database.path);
    this.db = null;
    this.initialized = false;
  }

  /**
   * 初始化数据库连接
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    return new Promise((resolve, reject) => {
      logger.info('正在连接数据库...', { dbPath: this.dbPath });
      
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          logger.error('数据库连接失败', { error: err.message });
          reject(err);
          return;
        }
        
        logger.info('数据库连接成功');
        this.initialized = true;
        
        // 初始化表结构
        this.initializeTables()
          .then(() => {
            logger.info('数据库表初始化完成');
            resolve();
          })
          .catch(reject);
      });
    });
  }

  /**
   * 初始化数据库表
   * @returns {Promise<void>}
   */
  async initializeTables() {
    return new Promise((resolve, reject) => {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS data (
          id INTEGER PRIMARY KEY AUTOINCREMENT, 
          content TEXT NOT NULL, 
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      this.db.run(createTableSQL, (err) => {
        if (err) {
          logger.error('创建表失败', { error: err.message });
          reject(err);
          return;
        }
        
        resolve();
      });
    });
  }

  /**
   * 执行查询（返回多行）
   * @param {string} sql - SQL语句
   * @param {Array} params - 参数数组
   * @returns {Promise<Array>} 查询结果
   */
  async query(sql, params = []) {
    await this.ensureConnection();
    
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          logger.error('数据库查询失败', { sql, params, error: err.message });
          reject(err);
          return;
        }
        
        resolve(rows);
      });
    });
  }

  /**
   * 执行查询（返回单行）
   * @param {string} sql - SQL语句
   * @param {Array} params - 参数数组
   * @returns {Promise<Object|null>} 查询结果
   */
  async queryOne(sql, params = []) {
    await this.ensureConnection();
    
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          logger.error('数据库查询失败', { sql, params, error: err.message });
          reject(err);
          return;
        }
        
        resolve(row || null);
      });
    });
  }

  /**
   * 执行更新操作（INSERT, UPDATE, DELETE）
   * @param {string} sql - SQL语句
   * @param {Array} params - 参数数组
   * @returns {Promise<{lastID: number, changes: number}>} 操作结果
   */
  async run(sql, params = []) {
    await this.ensureConnection();
    
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          logger.error('数据库操作失败', { sql, params, error: err.message });
          reject(err);
          return;
        }
        
        resolve({
          lastID: this.lastID,
          changes: this.changes,
        });
      });
    });
  }

  /**
   * 开始事务
   * @returns {Promise<void>}
   */
  async beginTransaction() {
    await this.ensureConnection();
    
    return new Promise((resolve, reject) => {
      this.db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          logger.error('开始事务失败', { error: err.message });
          reject(err);
          return;
        }
        
        resolve();
      });
    });
  }

  /**
   * 提交事务
   * @returns {Promise<void>}
   */
  async commitTransaction() {
    await this.ensureConnection();
    
    return new Promise((resolve, reject) => {
      this.db.run('COMMIT', (err) => {
        if (err) {
          logger.error('提交事务失败', { error: err.message });
          reject(err);
          return;
        }
        
        resolve();
      });
    });
  }

  /**
   * 回滚事务
   * @returns {Promise<void>}
   */
  async rollbackTransaction() {
    await this.ensureConnection();
    
    return new Promise((resolve, reject) => {
      this.db.run('ROLLBACK', (err) => {
        if (err) {
          logger.error('回滚事务失败', { error: err.message });
          reject(err);
          return;
        }
        
        resolve();
      });
    });
  }

  /**
   * 关闭数据库连接
   * @returns {Promise<void>}
   */
  async close() {
    if (!this.db) {
      return;
    }
    
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          logger.error('关闭数据库连接失败', { error: err.message });
          reject(err);
          return;
        }
        
        logger.info('数据库连接已关闭');
        this.initialized = false;
        this.db = null;
        resolve();
      });
    });
  }

  /**
   * 确保数据库连接已建立
   * @returns {Promise<void>}
   */
  async ensureConnection() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * 获取数据总数
   * @param {string} searchQuery - 搜索关键词（可选）
   * @returns {Promise<number>} 数据总数
   */
  async getTotalCount(searchQuery = null) {
    let sql = 'SELECT COUNT(*) as total FROM data';
    let params = [];
    
    if (searchQuery) {
      sql += ' WHERE content LIKE ?';
      params.push(`%${searchQuery}%`);
    }
    
    const result = await this.queryOne(sql, params);
    return result ? result.total : 0;
  }

  /**
   * 获取分页数据
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @param {string} searchQuery - 搜索关键词（可选）
   * @returns {Promise<Array>} 数据列表
   */
  async getPaginatedData(page = 1, limit = 10, searchQuery = null) {
    const offset = (page - 1) * limit;
    
    let sql = 'SELECT * FROM data';
    let params = [];
    
    if (searchQuery) {
      sql += ' WHERE content LIKE ?';
      params.push(`%${searchQuery}%`);
    }
    
    sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    return this.query(sql, params);
  }

  /**
   * 创建数据
   * @param {string} content - 内容
   * @returns {Promise<Object>} 创建的数据
   */
  async createData(content) {
    const sql = 'INSERT INTO data (content) VALUES (?)';
    const result = await this.run(sql, [content]);
    
    // 获取刚创建的数据
    const data = await this.getDataById(result.lastID);
    return data;
  }

  /**
   * 根据ID获取数据
   * @param {number} id - 数据ID
   * @returns {Promise<Object|null>} 数据
   */
  async getDataById(id) {
    const sql = 'SELECT * FROM data WHERE id = ?';
    return this.queryOne(sql, [id]);
  }

  /**
   * 更新数据
   * @param {number} id - 数据ID
   * @param {string} content - 新内容
   * @returns {Promise<boolean>} 是否更新成功
   */
  async updateData(id, content) {
    const sql = 'UPDATE data SET content = ? WHERE id = ?';
    const result = await this.run(sql, [content, id]);
    return result.changes > 0;
  }

  /**
   * 删除数据
   * @param {number} id - 数据ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteData(id) {
    const sql = 'DELETE FROM data WHERE id = ?';
    const result = await this.run(sql, [id]);
    return result.changes > 0;
  }
}

// 创建单例实例
const databaseService = new DatabaseService();

module.exports = databaseService;