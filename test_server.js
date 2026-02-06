// 测试服务器是否可访问
const http = require('http');

const servers = [
  { name: '后端API', url: 'http://localhost:8081/health' },
  { name: '前端应用', url: 'http://localhost:3000/health' }
];

async function testServer(server) {
  return new Promise((resolve) => {
    const req = http.get(server.url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ 
            name: server.name, 
            url: server.url, 
            status: '可访问', 
            statusCode: res.statusCode,
            response: json 
          });
        } catch (e) {
          resolve({ 
            name: server.name, 
            url: server.url, 
            status: '可访问但响应不是JSON', 
            statusCode: res.statusCode,
            response: data 
          });
        }
      });
    });
    
    req.on('error', (err) => {
      resolve({ 
        name: server.name, 
        url: server.url, 
        status: '不可访问', 
        error: err.message 
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ 
        name: server.name, 
        url: server.url, 
        status: '超时' 
      });
    });
  });
}

async function runTests() {
  console.log('正在测试服务器可访问性...\n');
  
  for (const server of servers) {
    const result = await testServer(server);
    console.log(`${result.name}:`);
    console.log(`  URL: ${result.url}`);
    console.log(`  状态: ${result.status}`);
    if (result.statusCode) {
      console.log(`  状态码: ${result.statusCode}`);
    }
    if (result.response) {
      console.log(`  响应: ${JSON.stringify(result.response)}`);
    }
    if (result.error) {
      console.log(`  错误: ${result.error}`);
    }
    console.log();
  }
}

runTests().catch(console.error);