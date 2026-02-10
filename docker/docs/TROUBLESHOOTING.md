# AICreateProject Docker故障排查指南

## 概述

本文档提供AICreateProject项目Docker部署的常见问题解决方案和故障排查步骤。

## 快速诊断

### 1. 检查服务状态
```bash
# 查看所有容器状态
docker-compose -f docker/docker-compose.yml ps

# 或使用简化版
docker-compose -f docker/docker-compose-simple.yml ps
```

### 2. 查看服务日志
```bash
# 查看所有服务日志
./docker/scripts/logs.sh

# 查看特定服务日志
docker-compose -f docker/docker-compose.yml logs [服务名]
```

### 3. 检查端口占用
```bash
# 检查关键端口是否被占用
netstat -tulpn | grep -E ':8081|:3000|:9090|:3001'
```

## 常见问题

### 问题1: 端口已被占用

**症状**：
- 容器启动失败
- 错误信息包含"port is already allocated"

**解决方案**：
```bash
# 方法1: 停止占用端口的进程
sudo lsof -i :8081  # 查找占用8081端口的进程
sudo kill -9 <PID>  # 终止进程

# 方法2: 修改映射端口
# 编辑docker-compose.yml，修改ports配置
# 例如将"8081:8081"改为"8082:8081"
```

### 问题2: 容器启动失败

**症状**：
- 容器状态为"Exited"
- 日志显示启动错误

**解决方案**：
```bash
# 1. 查看详细日志
docker-compose -f docker/docker-compose.yml logs --tail=50

# 2. 检查依赖服务
# 确保所有依赖服务都已启动

# 3. 检查配置文件
# 验证配置文件语法是否正确
```

### 问题3: 数据库连接问题

**症状**：
- 应用无法访问数据库
- 日志显示数据库连接错误

**解决方案**：
```bash
# 1. 检查数据库文件权限
sudo ls -la data/db/
sudo chmod 666 data/db/data.db  # 如果权限不足

# 2. 检查数据库挂载
docker exec aicreateproject-app ls -la /app/data/

# 3. 检查环境变量
docker exec aicreateproject-app env | grep DB
```

### 问题4: Prometheus无法启动

**症状**：
- Prometheus容器启动失败
- 配置文件错误

**解决方案**：
```bash
# 1. 检查配置文件语法
docker run --rm -v $(pwd)/docker/prometheus:/config prom/prometheus:latest \
  --config.file=/config/prometheus.yml --check-config

# 2. 修复配置文件
# 参考正确的prometheus.yml格式

# 3. 检查数据目录权限
sudo chmod -R 777 data/prometheus/
```

### 问题5: Grafana无法访问

**症状**：
- Grafana页面无法打开
- 登录失败

**解决方案**：
```bash
# 1. 检查Grafana日志
docker-compose -f docker/docker-compose.yml logs grafana

# 2. 重置管理员密码
docker exec aicreateproject-grafana grafana-cli admin reset-admin-password newpassword

# 3. 检查数据目录权限
sudo chmod -R 777 data/grafana/
```

### 问题6: 前端无法加载

**症状**：
- 前端页面空白或404
- 静态资源加载失败

**解决方案**：
```bash
# 1. 检查Nginx配置
docker exec aicreateproject-frontend nginx -t

# 2. 检查前端文件
docker exec aicreateproject-frontend ls -la /usr/share/nginx/html/

# 3. 重启Nginx
docker-compose -f docker/docker-compose.yml restart frontend
```

### 问题7: 服务间网络通信问题

**症状**：
- 服务间无法通信
- 连接超时

**解决方案**：
```bash
# 1. 检查网络配置
docker network ls
docker network inspect aicreateproject-network

# 2. 测试服务间连通性
docker exec aicreateproject-app curl -I http://prometheus:9090
docker exec aicreateproject-app curl -I http://grafana:3000

# 3. 重建网络
docker-compose -f docker/docker-compose.yml down
docker network prune -f
docker-compose -f docker/docker-compose.yml up -d
```

### 问题8: 磁盘空间不足

**症状**：
- 容器启动失败
- 日志显示磁盘空间错误

**解决方案**：
```bash
# 1. 检查磁盘使用
df -h
docker system df

# 2. 清理Docker资源
docker system prune -a -f
docker volume prune -f

# 3. 清理日志文件
sudo find /var/lib/docker/containers -name "*.log" -type f -delete
```

### 问题9: 镜像构建失败

**症状**：
- `./docker/scripts/build.sh`失败
- Docker构建错误

**解决方案**：
```bash
# 1. 检查Dockerfile语法
docker build --no-cache -f docker/Dockerfile .

# 2. 检查依赖包
# 确保package.json文件存在且正确

# 3. 清理构建缓存
docker builder prune -f
```

### 问题10: 权限问题

**症状**：
- 文件访问被拒绝
- 容器无法写入数据

**解决方案**：
```bash
# 1. 检查文件权限
sudo ls -la data/
sudo ls -la docker/

# 2. 修复权限
sudo chown -R $USER:$USER data/
sudo chown -R $USER:$USER docker/

# 3. 设置正确权限
sudo chmod -R 755 docker/scripts/
sudo chmod 666 data/db/data.db
```

## 高级排查

### 1. 进入容器调试
```bash
# 进入应用容器
docker exec -it aicreateproject-app bash

# 进入Nginx容器
docker exec -it aicreateproject-frontend sh

# 进入Prometheus容器
docker exec -it aicreateproject-prometheus sh

# 进入Grafana容器
docker exec -it aicreateproject-grafana bash
```

### 2. 检查容器内部状态
```bash
# 查看容器进程
docker exec aicreateproject-app ps aux

# 查看容器网络
docker exec aicreateproject-app netstat -tulpn

# 查看容器环境变量
docker exec aicreateproject-app env
```

### 3. 性能监控
```bash
# 查看容器资源使用
docker stats

# 查看容器详细信息
docker inspect aicreateproject-app

# 性能分析
docker exec aicreateproject-app top
```

## 日志分析技巧

### 1. 过滤关键日志
```bash
# 查找错误
docker-compose logs | grep -i error

# 查找警告
docker-compose logs | grep -i warning

# 查找特定时间
docker-compose logs --since "10m"
```

### 2. 日志级别调整
```bash
# 增加日志详细程度
# 在docker-compose.yml中添加：
# logging:
#   driver: "json-file"
#   options:
#     max-size: "10m"
#     max-file: "3"
```

## 恢复步骤

### 1. 完全重置
```bash
# 停止所有服务
./docker/scripts/stop.sh

# 清理所有数据（谨慎操作）
sudo rm -rf data/*

# 重新创建数据目录
mkdir -p data/db data/prometheus data/grafana

# 重新启动
./docker/scripts/start.sh
```

### 2. 部分恢复
```bash
# 仅重启问题服务
docker-compose -f docker/docker-compose.yml restart [服务名]

# 重建单个服务
docker-compose -f docker/docker-compose.yml up -d --force-recreate [服务名]
```

## 预防措施

### 1. 定期维护
```bash
# 每周执行
docker system prune -f
docker image prune -f
docker volume prune -f
```

### 2. 监控设置
- 设置Prometheus告警规则
- 配置Grafana仪表板监控
- 定期检查日志

### 3. 备份策略
```bash
# 每日备份数据
tar -czf /backup/aicreateproject-$(date +%Y%m%d).tar.gz data/

# 备份配置
tar -czf /backup/config-$(date +%Y%m%d).tar.gz docker/
```

## 获取帮助

如果以上步骤无法解决问题：

1. **收集诊断信息**
   ```bash
   # 收集所有相关信息
   ./docker/scripts/logs.sh > logs.txt
   docker-compose ps > status.txt
   docker version > docker_version.txt
   ```

2. **检查文档**
   - 参考`DEPLOYMENT.md`
   - 查看项目README

3. **寻求社区支持**
   - 提供详细的错误信息
   - 提供相关日志文件
   - 描述已尝试的解决步骤

---
*最后更新: $(date)*
*版本: 1.0.0*
