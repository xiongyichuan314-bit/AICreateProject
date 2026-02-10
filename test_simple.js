const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api', (req, res) => {
  res.json({ message: 'API is working', version: '1.0.0' });
});

const PORT = 8081;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ 简单服务器启动成功，监听端口 ${PORT}`);
  console.log(`🏥 健康检查: http://localhost:${PORT}/health`);
});
