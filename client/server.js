const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

// 日志设置
const logFilePath = path.join(__dirname, '../logs/client.log');
const errorLogFilePath = path.join(__dirname, '../logs/client_error.log');

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

// Serve static files from the client directory
const clientDir = path.join(__dirname);
app.use(express.static(clientDir));

// Route to serve the index.html file for any route that doesn't match static files
app.get(/^(?!\/api\/?.*)\/.*$/, (req, res) => {
    writeLog('INFO', `Serving index.html for route: ${req.path}`);
    res.sendFile(path.join(clientDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    writeLog('INFO', `Client server running at http://localhost:${PORT}/`);
    writeLog('INFO', `Access the frontend at http://localhost:${PORT}/`);
});