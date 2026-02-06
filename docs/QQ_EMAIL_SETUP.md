# QQ邮箱配置指南

## 1. 获取QQ邮箱授权码

QQ邮箱需要使用授权码而非密码进行第三方登录。请按以下步骤获取授权码：

### 步骤：
1. **登录QQ邮箱**：访问 [mail.qq.com](https://mail.qq.com) 并登录
2. **进入设置**：点击右上角"设置" -> "账户"
3. **开启服务**：找到"POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务"部分
4. **开启IMAP/SMTP服务**：
   - 点击"开启"按钮
   - 按照提示发送短信验证
   - 获取16位授权码（请妥善保存）

### 注意事项：
- 授权码只显示一次，请立即复制保存
- 如果忘记授权码，可以重新生成
- 授权码用于替代密码进行第三方登录

## 2. 配置环境变量

### 编辑 `.env` 文件：
```bash
cd /home/waxiong/dynamic-website
nano .env
```

### 找到QQ邮箱配置部分：
```env
# QQ邮箱配置（邮件功能）
# 注意：QQ邮箱需要使用授权码而非密码
# 获取授权码：登录QQ邮箱 -> 设置 -> 账户 -> POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务 -> 生成授权码
QQ_EMAIL_USER=请在此处填写你的QQ邮箱
QQ_EMAIL_PASSWORD=请在此处填写你的QQ邮箱授权码
# 可选：邮件获取限制
EMAIL_FETCH_LIMIT=3
EMAIL_FETCH_TIMEOUT=30000
```

### 修改为你的真实信息：
```env
QQ_EMAIL_USER=123456789@qq.com        # 你的QQ邮箱地址
QQ_EMAIL_PASSWORD=abcdefghijklmnop    # 你的16位授权码
```

## 3. 重启服务

### 方法一：使用PM2重启
```bash
cd /home/waxiong/dynamic-website
pm2 restart dynamic-api
```

### 方法二：使用启动脚本
```bash
cd /home/waxiong/dynamic-website
./scripts/pm2_start.sh
```

## 4. 验证配置

### 检查配置状态：
```bash
curl http://localhost:8081/api/email/config
```

### 预期响应（配置成功）：
```json
{
  "success": true,
  "config": {
    "configured": true,
    "user": "123***@qq.com",
    "host": "imap.qq.com",
    "port": 993
  },
  "instructions": "邮箱已配置，可以正常获取邮件",
  "timestamp": "2026-02-06T08:44:41.557Z"
}
```

### 获取真实邮件：
```bash
curl http://localhost:8081/api/email/recent?limit=3
```

## 5. 常见问题

### Q1: 授权码无效
- 检查是否使用了正确的16位授权码
- 确认IMAP/SMTP服务已开启
- 尝试重新生成授权码

### Q2: 连接超时
- 检查网络连接
- 确认防火墙未阻止IMAP端口(993)
- 尝试增加超时时间：`EMAIL_FETCH_TIMEOUT=60000`

### Q3: 认证失败
- 确认邮箱地址格式正确：`123456789@qq.com`
- 检查授权码是否包含空格或特殊字符
- 确认邮箱账户状态正常

### Q4: 获取邮件为空
- 检查收件箱是否有邮件
- 确认IMAP服务已正确开启
- 尝试重启QQ邮箱服务

## 6. 安全建议

### 环境变量安全：
- 不要将 `.env` 文件提交到Git
- `.env` 文件已在 `.gitignore` 中排除
- 生产环境使用安全的密钥管理服务

### 授权码安全：
- 授权码等同于密码，请妥善保管
- 定期更换授权码
- 不要分享授权码给他人

### 访问限制：
- 生产环境应添加API访问限制
- 考虑添加IP白名单
- 启用HTTPS加密传输

## 7. 故障排除

### 查看日志：
```bash
# 查看后端日志
pm2 logs dynamic-api

# 查看邮件服务特定日志
grep "QQ邮箱" logs/api-error.log
```

### 测试连接：
```bash
# 测试IMAP连接
telnet imap.qq.com 993

# 检查环境变量
echo $QQ_EMAIL_USER
```

### 重新安装依赖：
```bash
# 如果遇到模块问题
cd /home/waxiong/dynamic-website
npm install imap mailparser nodemailer
```

## 8. 备用方案

如果无法配置真实QQ邮箱，系统会自动使用模拟数据：

### 模拟数据特点：
- 显示3封示例邮件
- 无需网络连接
- 适合开发和测试
- 界面功能完整

### 切换回模拟数据：
```env
# 注释掉QQ邮箱配置
# QQ_EMAIL_USER=123456789@qq.com
# QQ_EMAIL_PASSWORD=abcdefghijklmnop
```

## 联系支持

如果遇到问题，请检查：
1. QQ邮箱官方文档
2. 项目GitHub Issues
3. 系统日志文件

---

**最后更新**: 2026-02-06  
**版本**: 1.0.0