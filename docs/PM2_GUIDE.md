# PM2 托管指南

## 安装PM2

如果尚未安装PM2，请先安装：

```bash
npm install -g pm2
```

## 启动应用

### 方法1：使用启动脚本（推荐）

```bash
# 给脚本执行权限
chmod +x pm2_start.sh

# 运行启动脚本
./pm2_start.sh
```

### 方法2：使用PM2配置文件

```bash
# 启动所有应用
pm2 start ecosystem.config.js

# 启动特定环境（生产环境）
pm2 start ecosystem.config.js --env production

# 只启动后端API
pm2 start ecosystem.config.js --only dynamic-api

# 只启动前端
pm2 start ecosystem.config.js --only dynamic-client
```

### 方法3：直接使用PM2命令

```bash
# 停止已存在的进程
pm2 delete dynamic-api dynamic-client 2>/dev/null || true

# 启动后端API
pm2 start /home/waxiong/.nvm/versions/node/v22.22.0/bin/node --name "dynamic-api" -- /home/waxiong/dynamic-website/api/server.js

# 启动前端
pm2 start /home/waxiong/.nvm/versions/node/v22.22.0/bin/node --name "dynamic-client" -- /home/waxiong/dynamic-website/client/server.js
```

## 常用PM2命令

### 查看状态
```bash
# 查看所有进程状态
pm2 status

# 查看特定进程
pm2 info dynamic-api
pm2 info dynamic-client

# 列出所有进程
pm2 list
```

### 日志管理
```bash
# 查看所有日志
pm2 logs

# 查看特定应用日志
pm2 logs dynamic-api
pm2 logs dynamic-client

# 查看最后100行日志
pm2 logs --lines 100

# 实时查看日志
pm2 logs --tail

# 清空日志
pm2 flush
```

### 进程管理
```bash
# 重启进程
pm2 restart dynamic-api
pm2 restart dynamic-client
pm2 restart all

# 停止进程
pm2 stop dynamic-api
pm2 stop dynamic-client
pm2 stop all

# 删除进程
pm2 delete dynamic-api
pm2 delete dynamic-client
pm2 delete all

# 重新加载（零停机重启）
pm2 reload dynamic-api
pm2 reload all
```

### 监控
```bash
# 打开监控面板
pm2 monit

# 查看进程资源使用情况
pm2 show dynamic-api

# 生成进程状态报告
pm2 report
```

## 开机自启

```bash
# 保存当前PM2进程列表
pm2 save

# 设置开机自启（根据提示运行生成的命令）
pm2 startup

# 禁用开机自启
pm2 unstartup
```

## 访问地址

- **前端应用**: http://localhost:3000 或 http://127.0.0.1:3000
- **后端API**: http://localhost:8081/api
- **健康检查**:
  - 前端: http://localhost:3000/health
  - 后端: http://localhost:8081/health

## 故障排除

### 1. 端口已被占用
```bash
# 检查端口占用
lsof -i :8081
lsof -i :3000

# 杀死占用进程
kill -9 <PID>
```

### 2. 应用启动失败
```bash
# 查看详细错误日志
pm2 logs dynamic-api --err
pm2 logs dynamic-client --err

# 检查应用是否可执行
node /home/waxiong/dynamic-website/api/server.js
node /home/waxiong/dynamic-website/client/server.js
```

### 3. PM2命令找不到
```bash
# 检查PM2安装
which pm2

# 重新安装PM2
npm install -g pm2
```

### 4. 内存不足
```bash
# 查看内存使用
pm2 show dynamic-api

# 增加内存限制（在ecosystem.config.js中修改max_memory_restart）
```

## 配置文件说明

`ecosystem.config.js` 是PM2的配置文件，包含以下重要配置：

- `name`: 进程名称
- `script`: 要执行的脚本路径
- `interpreter`: Node.js解释器路径
- `instances`: 实例数量（1表示单实例）
- `autorestart`: 是否自动重启
- `watch`: 是否监听文件变化自动重启
- `max_memory_restart`: 内存达到限制时自动重启
- `env`: 环境变量
- `error_file`: 错误日志文件
- `out_file`: 标准输出日志文件
- `log_file`: 合并日志文件

## 注意事项

1. **日志文件**: 日志保存在 `/home/waxiong/dynamic-website/logs/` 目录下
2. **环境变量**: 可以通过修改 `ecosystem.config.js` 中的 `env` 配置来设置环境变量
3. **生产环境**: 使用 `--env production` 参数启动生产环境配置
4. **监控**: 建议使用 `pm2 monit` 监控应用状态
5. **备份**: 定期备份PM2配置 `pm2 save`

## 快速参考

```bash
# 一键启动
./pm2_start.sh

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 重启所有应用
pm2 restart all

# 设置开机自启
pm2 save
pm2 startup