// 测试QQ邮箱连接
const Imap = require('imap');
require('dotenv').config();

const config = {
  user: process.env.QQ_EMAIL_USER || '646325435@qq.com',
  password: process.env.QQ_EMAIL_PASSWORD || 'rmqhtstquzrwbccd',
  host: 'imap.qq.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

console.log('测试QQ邮箱连接...');
console.log('邮箱:', config.user);
console.log('授权码长度:', config.password ? config.password.length : 0);

const imap = new Imap(config);

imap.once('ready', () => {
  console.log('✅ 连接成功！');
  imap.end();
});

imap.once('error', (err) => {
  console.error('❌ 连接失败:', err.message);
  console.error('错误详情:', err);
});

imap.once('end', () => {
  console.log('连接结束');
});

console.log('正在连接...');
imap.connect();