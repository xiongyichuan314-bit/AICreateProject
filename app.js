const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8081;

// 创建数据库
const db = new sqlite3.Database('./data.db');

// 创建表（如果不存在）
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS data (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");
});

// 设置中间件
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// 创建公共目录和HTML文件
if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Dynamic Data Entry Website</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .form-group { margin-bottom: 15px; }
        input[type="text"] { width: 300px; padding: 8px; }
        button { padding: 10px 15px; background: #007bff; color: white; border: none; cursor: pointer; }
        button:hover { background: #0056b3; }
        .results { margin-top: 20px; }
        .item { padding: 10px; border-bottom: 1px solid #eee; }
    </style>
</head>
<body>
    <h1>Data Entry Website</h1>
    
    <div class="form-group">
        <form id="dataForm">
            <input type="text" id="content" name="content" placeholder="Enter your information here" required>
            <button type="submit">Save Information</button>
        </form>
    </div>
    
    <div class="form-group">
        <button onclick="loadAllData()">View All Saved Information</button>
        <button onclick="searchData()">Search Information</button>
    </div>
    
    <div id="results" class="results"></div>

    <script>
        document.getElementById('dataForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const content = document.getElementById('content').value;
            
            try {
                const response = await fetch('/api/data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ content: content })
                });
                
                if (response.ok) {
                    document.getElementById('content').value = '';
                    alert('Information saved successfully!');
                } else {
                    alert('Error saving information');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error saving information');
            }
        });
        
        async function loadAllData() {
            try {
                const response = await fetch('/api/data');
                const data = await response.json();
                displayResults(data);
            } catch (error) {
                console.error('Error:', error);
            }
        }
        
        async function searchData() {
            const query = prompt("Enter search term:");
            if (query) {
                try {
                    const response = await fetch('/api/search?q=' + encodeURIComponent(query));
                    const data = await response.json();
                    displayResults(data);
                } catch (error) {
                    console.error('Error:', error);
                }
            }
        }
        
        function displayResults(data) {
            const resultsDiv = document.getElementById('results');
            if (data.length === 0) {
                resultsDiv.innerHTML = '<p>No data found.</p>';
                return;
            }
            
            let html = '<h3>Results:</h3>';
            data.forEach(item => {
                html += '<div class="item"><strong>ID:</strong> ' + item.id + 
                       '<br><strong>Content:</strong> ' + item.content + 
                       '<br><strong>Date:</strong> ' + item.timestamp + '</div>';
            });
            
            resultsDiv.innerHTML = html;
        }
    </script>
</body>
</html>
`;

fs.writeFileSync('public/index.html', htmlContent);

// API 路由
app.post('/api/data', (req, res) => {
  const { content } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }
  
  const stmt = db.prepare("INSERT INTO data (content) VALUES (?)");
  stmt.run(content, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Data saved successfully' });
  });
  stmt.finalize();
});

app.get('/api/data', (req, res) => {
  db.all("SELECT * FROM data ORDER BY timestamp DESC", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/search', (req, res) => {
  const query = req.query.q;
  
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }
  
  const searchQuery = '%' + query + '%';
  db.all("SELECT * FROM data WHERE content LIKE ? ORDER BY timestamp DESC", [searchQuery], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 主页路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running at http://localhost:' + PORT + '/');
});