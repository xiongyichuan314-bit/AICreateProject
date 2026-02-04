const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 8081;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 数据库连接
const dbPath = path.resolve(__dirname, '../data.db');
const db = new sqlite3.Database(dbPath);

// 创建表（如果不存在）
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS data (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    content TEXT, 
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// API 路由

// 获取所有数据
app.get('/api/data', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // 获取总数
  db.get('SELECT COUNT(*) as total FROM data', [], (err, count) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // 获取分页数据
    db.all(
      'SELECT * FROM data ORDER BY timestamp DESC LIMIT ? OFFSET ?', 
      [parseInt(limit), offset], 
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.json({
          data: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count.total / parseInt(limit)),
            totalItems: count.total,
            itemsPerPage: parseInt(limit)
          }
        });
      }
    );
  });
});

// 创建新数据
app.post('/api/data', (req, res) => {
  const { content } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }
  
  const stmt = db.prepare('INSERT INTO data (content) VALUES (?)');
  stmt.run(content, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ 
      id: this.lastID, 
      message: 'Data saved successfully',
      timestamp: new Date().toISOString()
    });
  });
  stmt.finalize();
});

// 根据ID获取单条数据
app.get('/api/data/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM data WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Data not found' });
    }
    res.json(row);
  });
});

// 搜索数据
app.get('/api/search', (req, res) => {
  const { q = '', page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const searchQuery = `%${q}%`;

  // 获取总数
  db.get(
    'SELECT COUNT(*) as total FROM data WHERE content LIKE ?', 
    [searchQuery], 
    (err, count) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // 获取分页数据
      db.all(
        'SELECT * FROM data WHERE content LIKE ? ORDER BY timestamp DESC LIMIT ? OFFSET ?', 
        [searchQuery, parseInt(limit), offset], 
        (err, rows) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          res.json({
            data: rows,
            pagination: {
              currentPage: parseInt(page),
              totalPages: Math.ceil(count.total / parseInt(limit)),
              totalItems: count.total,
              itemsPerPage: parseInt(limit)
            }
          });
        }
      );
    }
  );
});

// 更新数据
app.put('/api/data/:id', (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }
  
  const stmt = db.prepare('UPDATE data SET content = ? WHERE id = ?');
  stmt.run(content, id, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Data not found' });
    }
    res.json({ message: 'Data updated successfully' });
  });
  stmt.finalize();
});

// 删除数据
app.delete('/api/data/:id', (req, res) => {
  const { id } = req.params;
  
  const stmt = db.prepare('DELETE FROM data WHERE id = ?');
  stmt.run(id, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Data not found' });
    }
    res.json({ message: 'Data deleted successfully' });
  });
  stmt.finalize();
});

// 根路由 - 返回 API 信息
app.get('/', (req, res) => {
  res.json({
    message: 'Dynamic Data API Server',
    endpoints: {
      'GET /api/data': 'Get all data with pagination',
      'POST /api/data': 'Create new data entry',
      'GET /api/data/:id': 'Get specific data entry',
      'PUT /api/data/:id': 'Update specific data entry',
      'DELETE /api/data/:id': 'Delete specific data entry',
      'GET /api/search?q=:query': 'Search data'
    },
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running at http://localhost:${PORT}/`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});