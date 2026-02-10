# AICreateProject Docker部署指南

## 概述

本文档提供AICreateProject项目的Docker部署指南。项目包含四个主要服务：
1. **应用API服务** - Node.js Express应用，端口8081
2. **前端服务** - Nginx静态文件服务，端口3000
3. **监控服务** - Prometheus指标收集，端口9090
4. **可视化服务** - Grafana数据展示，端口3001

## 目录结构

```
AICreateProject/
├── docker/                    # Docker配置目录
│   ├── Dockerfile            # 应用镜像构建文件
│   ├── docker-compose.yml    # 完整服务编排
│   ├── docker-compose-simple.yml # 简化服务编排
│   ├── nginx/                # Nginx配置
│   │   └── default.conf      # 前端站点配置
│   ├── grafana/              # Grafana配置
│   │   └── provisioning/     # 自动配置
│   ├── prometheus/           # Prometheus配置
│   │   └── prometheus.yml    # 监控配置
│   ├── scripts/              # 管理脚本
│   │   ├── start.sh         # 启动脚本
│   │   ├── stop.sh          # 停止脚本
│   │   ├── build.sh         # 构建脚本
│   │   └── logs.sh          # 日志脚本
│   └── docs/                 # 文档
│       ├── DEPLOYMENT.md    # 本文件
│       └── TROUBLESHOOTING.md # 故障排查
├── data/                     # 持久化数据
│   ├── db/                  # 应用数据库
│   ├── prometheus/          # Prometheus数据
│   └── grafana/             # Grafana数据
└── src/                     # 源代码
    └── client/              # 前端代码
```

## 快速开始

### 前提条件

1. 安装Docker和Docker Compose
2. 确保端口8081、3000、9090、3001可用

### 一键部署

```bash
# 进入项目目录
cd AICreateProject

# 使用简化部署（推荐）
./docker/scripts/start.sh

# 或使用完整部署
docker-compose -f docker/docker-compose.yml up -d
```

### 分步部署

1. **构建应用镜像**
   ```bash
   ./docker/scripts/build.sh
   ```

2. **启动所有服务**
   ```bash
   ./docker/scripts/start.sh
   ```

3. **验证部署**
   - 应用API: http://localhost:8081/health
   - 前端: http://localhost:3000
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3001 (admin/admin)

## 部署模式

### 1. 完整部署模式 (`docker-compose.yml`)

**特点**：
- 使用自定义构建的Docker镜像
- 完整的健康检查
- 数据持久化到`data/`目录
- 服务间网络隔离

**启动命令**：
```bash
docker-compose -f docker/docker-compose.yml up -d
```

### 2. 简化部署模式 (`docker-compose-simple.yml`)

**特点**：
- 使用现有镜像（如果可用）
- 简化配置
- 快速启动
- 适合开发和测试

**启动命令**：
```bash
docker-compose -f docker/docker-compose-simple.yml up -d
```

## 服务配置

### 应用API服务
- **镜像**: 自定义构建或`aicreateproject:pure-local`
- **端口**: 8081
- **数据卷**: `data/db:/app/data`
- **环境变量**: 从`.env`文件加载

### 前端服务
- **镜像**: `nginx:alpine`
- **端口**: 3000
- **数据卷**: `src/client:/usr/share/nginx/html`
- **配置**: `docker/nginx/default.conf`

### Prometheus服务
- **镜像**: `prom/prometheus:latest`
- **端口**: 9090
- **配置**: `docker/prometheus/prometheus.yml`
- **数据卷**: `data/prometheus:/prometheus`

### Grafana服务
- **镜像**: `grafana/grafana:latest`
- **端口**: 3001
- **配置**: `docker/grafana/provisioning/`
- **数据卷**: `data/grafana:/var/lib/grafana`
- **默认账号**: admin/admin

## 管理脚本

### 启动脚本 (`scripts/start.sh`)
```bash
./docker/scripts/start.sh
```
交互式选择部署模式，启动所有服务。

### 停止脚本 (`scripts/stop.sh`)
```bash
./docker/scripts/stop.sh
```
停止服务，可选择保留或清理数据。

### 构建脚本 (`scripts/build.sh`)
```bash
./docker/scripts/build.sh
```
构建应用Docker镜像，支持多种构建模式。

### 日志脚本 (`scripts/logs.sh`)
```bash
./docker/scripts/logs.sh
```
查看服务日志，支持多种查看模式。

## 数据管理

### 数据持久化
所有数据都存储在`data/`目录下：
- `data/db/` - 应用数据库文件
- `data/prometheus/` - Prometheus时间序列数据
- `data/grafana/` - Grafana配置和数据

### 数据备份
```bash
# 备份所有数据
tar -czf backup-$(date +%Y%m%d).tar.gz data/

# 恢复数据
tar -xzf backup-YYYYMMDD.tar.gz
```

### 数据清理
```bash
# 清理所有数据（谨慎操作）
sudo rm -rf data/*
```

## 环境配置

### 环境变量文件 (`.env`)
创建或编辑`.env`文件：
```bash
# 数据库配置
DB_PATH=/app/data/data.db

# 应用配置
APP_PORT=8081
NODE_ENV=production

# 安全配置
JWT_SECRET=your_jwt_secret_here
```

### 网络配置
- 服务使用自定义网络`aicreateproject-network`
- 服务间可通过服务名通信（如`app`、`prometheus`等）
- 外部通过映射端口访问

## 监控和日志

### 服务监控
- **应用指标**: http://localhost:8081/metrics
- **Prometheus**: http://localhost:9090
- **Grafana仪表板**: http://localhost:3001

### 日志查看
```bash
# 查看所有服务日志
./docker/scripts/logs.sh

# 实时跟踪日志
docker-compose -f docker/docker-compose.yml logs -f

# 查看特定服务日志
docker-compose -f docker/docker-compose.yml logs app
```

## 故障排查

常见问题请参考`docs/TROUBLESHOOTING.md`。

## 更新部署

### 更新应用代码
```bash
# 1. 停止服务
./docker/scripts/stop.sh

# 2. 更新代码
git pull origin main

# 3. 重新构建镜像
./docker/scripts/build.sh

# 4. 启动服务
./docker/scripts/start.sh
```

### 更新配置
1. 修改相应配置文件
2. 重启受影响的服务
3. 验证配置生效

## 安全建议

1. **修改默认密码**
   - Grafana默认密码：admin/admin
   - 建议首次登录后立即修改

2. **网络隔离**
   - 生产环境建议使用更严格的网络策略
   - 考虑使用反向代理和SSL

3. **数据加密**
   - 敏感数据应加密存储
   - 使用安全的密钥管理

## 扩展部署

### 添加新服务
1. 在`docker-compose.yml`中添加服务定义
2. 创建必要的配置文件
3. 更新网络配置
4. 测试服务集成

### 集群部署
对于生产环境，建议：
1. 使用Docker Swarm或Kubernetes
2. 配置负载均衡
3. 设置高可用
4. 实现自动扩缩容

## 支持

如有问题，请：
1. 查看日志：`./docker/scripts/logs.sh`
2. 参考故障排查文档
3. 检查服务状态：`docker-compose ps`
4. 验证端口是否被占用

---
*最后更新: $(date)*
*版本: 1.0.0*
