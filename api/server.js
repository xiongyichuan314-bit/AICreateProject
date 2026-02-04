const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8081;

// 日志设置
const logFilePath = path.join(__dirname, '../logs/api.log');
const errorLogFilePath = path.join(__dirname, '../logs/error.log');

// 确保logs目录存在
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 写入日志的函数
function writeLog(level, message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${level}: ${message}\n`;
  
  // 写入日志文件
  fs.appendFileSync(logFilePath, logEntry);
  
  // 同时输出到控制台
  console.log(logEntry.trim());
}

// 写入错误日志的函数
function writeErrorLog(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ERROR: ${message}\n`;
  
  // 写入错误日志文件
  fs.appendFileSync(errorLogFilePath, logEntry);
  
  // 同时输出到控制台
  console.error(logEntry.trim());
}

// 记录所有请求的中间件
app.use((req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;
  
  res.send = function(data) {
    const duration = Date.now() - startTime;
    writeLog('INFO', `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    return originalSend.call(this, data);
  };
  
  writeLog('INFO', `Incoming request: ${req.method} ${req.path}`);
  next();
});

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 数据库连接
const dbPath = path.resolve(__dirname, '../data.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    writeErrorLog(`Error opening database: ${err.message}`);
  } else {
    writeLog('INFO', 'Connected to SQLite database');
  }
});

// 创建表（如果不存在）
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS data (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    content TEXT, 
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      writeErrorLog(`Error creating table: ${err.message}`);
    } else {
      writeLog('INFO', 'Data table ready');
    }
  });
});

// API 路由

// 获取所有数据
app.get('/api/data', (req, res) => {
  writeLog('INFO', `GET /api/data - Query params: page=${req.query.page || 1}, limit=${req.query.limit || 10}`);
  const { page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // 获取总数
  db.get('SELECT COUNT(*) as total FROM data', [], (err, count) => {
    if (err) {
      writeErrorLog(`Error getting data count: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }

    // 获取分页数据
    db.all(
      'SELECT * FROM data ORDER BY timestamp DESC LIMIT ? OFFSET ?', 
      [parseInt(limit), offset], 
      (err, rows) => {
        if (err) {
          writeErrorLog(`Error getting paginated data: ${err.message}`);
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
  writeLog('INFO', `POST /api/data - Creating new data entry`);
  const { content } = req.body;
  
  if (!content) {
    writeLog('WARN', `POST /api/data - Missing content in request body`);
    return res.status(400).json({ error: 'Content is required' });
  }
  
  const stmt = db.prepare('INSERT INTO data (content) VALUES (?)');
  stmt.run(content, function(err) {
    if (err) {
      writeErrorLog(`Error inserting data: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
    writeLog('INFO', `POST /api/data - Data saved successfully with ID: ${this.lastID}`);
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
  writeLog('INFO', `GET /api/data/${req.params.id} - Fetching data by ID`);
  const { id } = req.params;
  
  db.get('SELECT * FROM data WHERE id = ?', [id], (err, row) => {
    if (err) {
      writeErrorLog(`Error fetching data by ID ${id}: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      writeLog('WARN', `GET /api/data/${id} - Data not found`);
      return res.status(404).json({ error: 'Data not found' });
    }
    res.json(row);
  });
});

// 搜索数据
app.get('/api/search', (req, res) => {
  writeLog('INFO', `GET /api/search - Search query: "${req.query.q || ''}", page: ${req.query.page || 1}, limit: ${req.query.limit || 10}`);
  const { q = '', page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const searchQuery = `%${q}%`;

  // 获取总数
  db.get(
    'SELECT COUNT(*) as total FROM data WHERE content LIKE ?', 
    [searchQuery], 
    (err, count) => {
      if (err) {
        writeErrorLog(`Error counting search results: ${err.message}`);
        return res.status(500).json({ error: err.message });
      }

      // 获取分页数据
      db.all(
        'SELECT * FROM data WHERE content LIKE ? ORDER BY timestamp DESC LIMIT ? OFFSET ?', 
        [searchQuery, parseInt(limit), offset], 
        (err, rows) => {
          if (err) {
            writeErrorLog(`Error getting search results: ${err.message}`);
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
  writeLog('INFO', `PUT /api/data/${req.params.id} - Updating data entry`);
  const { id } = req.params;
  const { content } = req.body;
  
  if (!content) {
    writeLog('WARN', `PUT /api/data/${id} - Missing content in request body`);
    return res.status(400).json({ error: 'Content is required' });
  }
  
  const stmt = db.prepare('UPDATE data SET content = ? WHERE id = ?');
  stmt.run(content, id, function(err) {
    if (err) {
      writeErrorLog(`Error updating data with ID ${id}: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      writeLog('WARN', `PUT /api/data/${id} - Data not found for update`);
      return res.status(404).json({ error: 'Data not found' });
    }
    writeLog('INFO', `PUT /api/data/${id} - Data updated successfully`);
    res.json({ message: 'Data updated successfully' });
  });
  stmt.finalize();
});

// 删除数据
app.delete('/api/data/:id', (req, res) => {
  writeLog('INFO', `DELETE /api/data/${req.params.id} - Deleting data entry`);
  const { id } = req.params;
  
  const stmt = db.prepare('DELETE FROM data WHERE id = ?');
  stmt.run(id, function(err) {
    if (err) {
      writeErrorLog(`Error deleting data with ID ${id}: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      writeLog('WARN', `DELETE /api/data/${id} - Data not found for deletion`);
      return res.status(404).json({ error: 'Data not found' });
    }
    writeLog('INFO', `DELETE /api/data/${id} - Data deleted successfully`);
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
  writeLog('INFO', `API server running at http://localhost:${PORT}/`);
  writeLog('INFO', `API endpoints available at http://localhost:${PORT}/api`);
});