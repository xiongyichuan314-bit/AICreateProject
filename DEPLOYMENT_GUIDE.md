# AICreateProject 部署指南 v2.0

## 📋 概述

本指南介绍如何使用统一的部署脚本进行代码修改、容器打包和部署。新的脚本架构采用模块化设计，一个入口管理所有部署任务。

## 🚀 快速开始

### 首次部署
```bash
# 1. 确保Docker已安装并运行
docker --version

# 2. 执行完整部署（推荐使用简化版）
./deploy.sh deploy full simple

# 3. 验证部署
./deploy.sh monitor health
```

### 日常开发流程
```bash
# 1. 修改代码后，本地测试
./deploy.sh dev test

# 2. 本地运行验证
./deploy.sh dev start
# 访问 http://localhost:8081/health

# 3. 构建并部署到容器
./deploy.sh deploy full simple

# 4. 查看部署状态
./deploy.sh monitor status
```

## 📦 脚本架构

### 统一入口：`deploy.sh`
```
./deploy.sh [模块] [命令] [选项]
```

### 四大模块

#### 1. 本地开发 (`dev`)
```bash
./deploy.sh dev start      # 启动本地开发服务器
./deploy.sh dev stop       # 停止本地开发服务器
./deploy.sh dev test       # 运行测试
```

#### 2. Docker容器管理 (`docker`)
```bash
# 构建镜像
./deploy.sh docker build          # 使用完整Dockerfile
./deploy.sh docker build simple   # 使用简化版Dockerfile

# 运行服务
./deploy.sh docker run            # 启动完整服务
./deploy.sh docker run simple     # 启动简化版服务

# 管理
./deploy.sh docker logs           # 查看日志
./deploy.sh docker stop           # 停止服务
./deploy.sh docker clean          # 清理资源
```

#### 3. 部署流程 (`deploy`)
```bash
./deploy.sh deploy full          # 完整部署（构建+启动）
./deploy.sh deploy full simple   # 简化版完整部署
./deploy.sh deploy quick         # 快速部署（仅启动）
./deploy.sh deploy verify        # 验证部署状态
```

#### 4. 监控管理 (`monitor`)
```bash
./deploy.sh monitor status       # 查看服务状态
./deploy.sh monitor health       # 健康检查
./deploy.sh monitor metrics      # 查看监控地址
```

## 🔧 详细工作流

### 场景1：修改代码后的部署
```bash
# 1. 修改代码
# 2. 本地测试
./deploy.sh dev test

# 3. 构建新镜像
./deploy.sh docker build simple

# 4. 重新部署
./deploy.sh docker stop
./deploy.sh docker run simple

# 5. 验证
./deploy.sh deploy verify
```

### 场景2：快速迭代开发
```bash
# 使用本地开发模式
./deploy.sh dev start

# 修改代码后，应用会自动重启（如果使用nodemon）
# 或者手动重启
./deploy.sh dev stop
./deploy.sh dev start

# 完成后部署到容器
./deploy.sh deploy full simple
```

### 场景3：生产环境部署
```bash
# 1. 使用完整配置构建
./deploy.sh docker build

# 2. 启动完整服务（包含监控）
./deploy.sh docker run

# 3. 验证所有服务
./deploy.sh monitor health

# 4. 查看监控
# Grafana: http://localhost:3001 (admin/admin)
# Prometheus: http://localhost:9090
```

## 📁 项目文件说明

### 核心配置文件
- `Dockerfile` - 完整版Docker构建配置
- `Dockerfile.simple` - 简化版Docker构建配置
- `docker-compose.yml` - 完整服务编排（包含监控）
- `docker-compose-simple.yml` - 简化服务编排
- `.env.example` - 环境变量模板
- `.env` - 实际环境配置（首次部署会自动创建）

### 服务端口
| 服务 | 端口 | 说明 |
|------|------|------|
| 应用API | 8081 | 主应用接口 |
| 前端 | 3000 | 前端界面 |
| Prometheus | 9090 | 监控指标 |
| Grafana | 3001 | 监控面板 |

## 🐛 故障排除

### 常见问题

#### 1. 端口被占用
```bash
# 检查端口占用
lsof -i :8081

# 停止占用进程
pkill -f "node api/server.js"
```

#### 2. Docker构建失败
```bash
# 清理缓存重新构建
./deploy.sh docker clean
./deploy.sh docker build simple
```

#### 3. 服务无法访问
```bash
# 检查服务状态
./deploy.sh monitor status

# 查看日志
./deploy.sh docker logs

# 健康检查
./deploy.sh monitor health
```

#### 4. 环境变量问题
```bash
# 确保.env文件存在
cp .env.example .env
# 编辑.env文件配置正确值
```

### 日志查看
```bash
# 查看所有服务日志
./deploy.sh docker logs

# 查看特定服务日志（直接使用docker）
docker logs aicreateproject-app-simple
docker logs aicreateproject-prometheus-simple
```

## 🔄 更新流程

### 小版本更新（代码修改）
```bash
# 1. 拉取最新代码
git pull

# 2. 重新部署
./deploy.sh deploy full simple

# 3. 验证
./deploy.sh deploy verify
```

### 大版本更新（配置变更）
```bash
# 1. 备份数据
cp data.db data.db.backup

# 2. 清理旧部署
./deploy.sh docker clean

# 3. 重新部署
./deploy.sh deploy full

# 4. 恢复数据（如果需要）
# cp data.db.backup data.db
```

## 📊 监控和维护

### 日常监控
```bash
# 查看服务状态
./deploy.sh monitor status

# 健康检查
./deploy.sh monitor health

# 访问监控面板
# http://localhost:3001 - Grafana
# http://localhost:9090 - Prometheus
```

### 资源清理
```bash
# 定期清理未使用的Docker资源
./deploy.sh docker clean

# 查看磁盘使用
docker system df
```

## 🎯 最佳实践

1. **开发阶段**：使用 `./deploy.sh dev start` 快速迭代
2. **测试阶段**：使用 `./deploy.sh docker run simple` 容器化测试
3. **生产部署**：使用 `./deploy.sh docker run` 完整配置
4. **版本控制**：每次部署前提交代码到Git
5. **监控配置**：定期检查Grafana仪表板

## 📞 获取帮助

```bash
# 查看完整帮助
./deploy.sh help

# 或
./deploy.sh

# 查看特定模块帮助
./deploy.sh dev
./deploy.sh docker
./deploy.sh deploy
./deploy.sh monitor
```

## 📝 版本历史

- **v2.0** (当前): 统一脚本架构，模块化设计
- **v1.0**: 原始分散脚本

---

**提示**: 所有部署操作都可以通过 `./deploy.sh` 一个命令完成，无需记忆复杂的docker命令。