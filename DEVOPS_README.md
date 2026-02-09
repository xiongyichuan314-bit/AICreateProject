# AICreateProject DevOps 部署方案

## 概述

本方案为AICreateProject项目提供完整的DevOps流水线，包括：

1. **Docker容器化** - 应用打包和容器化
2. **Kubernetes部署** - 容器编排和集群管理
3. **Jenkins CI/CD** - 自动化构建和部署流水线
4. **监控看板** - 应用性能监控和告警

## 目录结构

```
AICreateProject/
├── Dockerfile                    # Docker镜像构建文件
├── docker-compose.yml           # Docker Compose配置文件
├── Jenkinsfile                  # Jenkins流水线配置
├── deploy.sh                    # 部署脚本
├── k8s/                         # Kubernetes配置文件
│   ├── namespace.yml           # 命名空间配置
│   ├── configmap.yml           # 配置映射
│   ├── secret.yml              # 密钥配置
│   ├── deployment.yml          # 部署配置
│   └── service.yml             # 服务配置
├── grafana/                     # Grafana配置
│   ├── provisioning/
│   │   ├── datasources/
│   │   │   └── prometheus.yml  # 数据源配置
│   │   └── dashboards/
│   │       └── dashboards.yml  # 仪表板配置
│   └── dashboards/
│       └── aicreateproject-dashboard.json  # 应用监控仪表板
├── prometheus.yml               # Prometheus监控配置
└── DEVOPS_README.md            # 本文档
```

## 快速开始

### 1. 环境要求

- Docker 20.10+
- Docker Compose 2.0+
- Kubernetes 1.24+ (可选)
- Jenkins 2.4+ (可选)
- Node.js 18+

### 2. 使用部署脚本

```bash
# 给部署脚本添加执行权限
chmod +x deploy.sh

# 查看帮助信息
./deploy.sh help

# 构建Docker镜像
./deploy.sh docker-build

# 使用Docker Compose运行应用
./deploy.sh docker-run

# 部署到Kubernetes
./deploy.sh k8s-deploy

# 查看Kubernetes部署状态
./deploy.sh k8s-status

# 执行完整部署流程
./deploy.sh all
```

### 3. 访问服务

部署完成后，可以访问以下服务：

- **应用前端**: http://localhost:3000
- **应用API**: http://localhost:8081
- **API文档**: http://localhost:8081/api
- **Grafana监控**: http://localhost:3001 (用户名: admin, 密码: admin)
- **Prometheus**: http://localhost:9090

## Docker容器化

### Docker镜像构建

```bash
# 构建镜像
docker build -t aicreateproject:latest .

# 运行容器
docker run -p 8081:8081 -p 3000:3000 aicreateproject:latest
```

### Docker Compose

使用Docker Compose可以一键启动所有服务：

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## Kubernetes部署

### 部署到Kubernetes集群

```bash
# 应用所有Kubernetes配置
kubectl apply -f k8s/

# 查看部署状态
kubectl get all -n aicreateproject

# 查看Pod日志
kubectl logs -f deployment/aicreateproject-deployment -n aicreateproject

# 删除部署
kubectl delete -f k8s/
```

### Kubernetes资源配置说明

1. **命名空间**: 创建独立的命名空间 `aicreateproject`
2. **ConfigMap**: 存储应用配置
3. **Secret**: 存储敏感信息（邮箱密码、数据库密码等）
4. **Deployment**: 应用部署配置，包含3个副本
5. **Service**: 服务暴露配置，支持ClusterIP和LoadBalancer

## Jenkins CI/CD流水线

### 流水线阶段

1. **代码检查**: ESLint、单元测试、代码覆盖率
2. **SonarQube分析**: 代码质量分析
3. **构建Docker镜像**: 多阶段构建
4. **安全扫描**: Trivy漏洞扫描、Hadolint检查
5. **推送Docker镜像**: 推送到Docker Registry
6. **部署到开发环境**: 自动部署到Kubernetes开发环境
7. **部署到生产环境**: 手动确认后部署到生产环境
8. **集成测试**: API测试和端到端测试

### 配置Jenkins

1. 安装必要的Jenkins插件：
   - Docker Pipeline
   - Kubernetes
   - SonarQube Scanner
   - Email Extension

2. 配置凭据：
   - Docker Registry凭据
   - Kubernetes集群凭据
   - SonarQube令牌

3. 创建Pipeline任务，选择"Pipeline script from SCM"，指向Git仓库

## 监控和告警

### 监控架构

```
应用 → Prometheus (指标收集) → Grafana (可视化)
      ↓
    Loki (日志收集) → Grafana (日志查询)
      ↓
   AlertManager (告警管理) → 邮件/钉钉/微信通知
```

### 监控指标

1. **应用性能指标**:
   - HTTP请求速率和响应时间
   - CPU和内存使用率
   - 错误率和异常情况
   - 数据库连接池状态

2. **基础设施指标**:
   - Kubernetes节点资源使用
   - Pod状态和重启次数
   - 网络流量和延迟

3. **业务指标**:
   - 用户活跃度
   - API调用统计
   - 邮箱服务状态

### 告警规则

预配置的告警规则包括：
- 应用宕机超过5分钟
- CPU使用率超过80%
- 内存使用率超过90%
- HTTP错误率超过5%
- 响应时间超过2秒

## 配置说明

### 环境变量配置

复制`.env.example`为`.env`并配置以下变量：

```env
# 服务器配置
PORT=8081
HOST=0.0.0.0
NODE_ENV=production

# 数据库配置
DB_PATH=./data.db

# QQ邮箱配置
QQ_EMAIL_USER=your_email@qq.com
QQ_EMAIL_PASSWORD=your_authorization_code

# 监控配置
PROMETHEUS_URL=http://prometheus:9090
GRAFANA_URL=http://grafana:3000
```

### Kubernetes配置调整

根据实际环境调整`k8s/`目录下的配置文件：

1. **deployment.yml**: 调整副本数、资源限制、镜像地址
2. **service.yml**: 调整服务类型和端口
3. **configmap.yml**: 调整应用配置
4. **secret.yml**: 更新敏感信息（使用Kubernetes Secret管理）

## 最佳实践

### 1. 安全建议

- 使用Kubernetes Secret管理敏感信息
- 定期更新Docker基础镜像
- 启用容器安全扫描
- 配置网络策略限制Pod通信

### 2. 性能优化

- 根据监控数据调整资源限制
- 使用HPA（Horizontal Pod Autoscaler）自动扩缩容
- 配置就绪探针和存活探针
- 启用Pod反亲和性避免单点故障

### 3. 高可用部署

- 部署至少3个副本
- 使用多个可用区
- 配置PodDisruptionBudget
- 定期备份数据库

### 4. 成本优化

- 使用Spot实例降低成本
- 根据负载自动扩缩容
- 清理未使用的镜像和卷
- 监控资源使用情况

## 故障排除

### 常见问题

1. **应用无法启动**
   - 检查环境变量配置
   - 查看Pod日志：`kubectl logs <pod-name>`
   - 检查资源限制是否足够

2. **监控数据缺失**
   - 检查Prometheus Target状态
   - 验证应用是否暴露/metrics端点
   - 检查网络策略是否允许监控流量

3. **Jenkins流水线失败**
   - 检查凭据配置
   - 查看Jenkins控制台输出
   - 验证Kubernetes集群连接

4. **邮箱服务不可用**
   - 检查QQ邮箱授权码是否正确
   - 验证网络连接是否正常
   - 查看应用日志中的错误信息

### 调试命令

```bash
# 查看Pod状态
kubectl describe pod <pod-name> -n aicreateproject

# 查看服务端点
kubectl get endpoints -n aicreateproject

# 查看事件
kubectl get events -n aicreateproject --sort-by='.lastTimestamp'

# 进入容器调试
kubectl exec -it <pod-name> -n aicreateproject -- /bin/sh

# 端口转发
kubectl port-forward svc/aicreateproject-service 8081:8081 -n aicreateproject
```

## 扩展和定制

### 添加新的监控指标

1. 在应用中暴露新的/metrics端点
2. 更新Prometheus配置添加新的抓取任务
3. 在Grafana中创建新的仪表板

### 集成新的工具

1. **日志管理**: 集成ELK Stack
2. **分布式追踪**: 集成Jaeger或Zipkin
3. **API网关**: 集成Kong或Traefik
4. **服务网格**: 集成Istio或Linkerd

### 多环境部署

支持开发、测试、预生产、生产多环境部署：

```bash
# 开发环境
kubectl apply -f k8s/overlays/dev/

# 测试环境
kubectl apply -f k8s/overlays/test/

# 生产环境
kubectl apply -f k8s/overlays/prod/
```

## 贡献指南

1. Fork本仓库
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

本项目采用MIT许可证。详见LICENSE文件。

## 支持

如有问题或建议，请：
1. 查看本文档
2. 检查GitHub Issues
3. 提交新的Issue

---

**最后更新**: 2026年2月9日
**版本**: 1.0.0