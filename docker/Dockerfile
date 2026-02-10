# AICreateProject Docker镜像构建文件
# 基于Ubuntu 24.04，与WSL系统版本保持一致
# 遵循commuguide技能要求：从WSL导出依赖，而不是从网络下载

FROM ubuntu:24.04

# 设置环境变量
ENV DEBIAN_FRONTEND=noninteractive \
    NODE_VERSION=18.20.8 \
    APP_PORT=8081 \
    DB_PATH=/app/data/data.db

# 设置工作目录
WORKDIR /app

# 复制本地下载的.deb包
COPY docker/deb-packages/*.deb /tmp/

# 安装Node.js依赖（python3, ca-certificates, curl）
# 这些依赖应该已经在WSL中安装，apt会从本地缓存获取
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        python3 \
        ca-certificates \
        curl \
    && rm -rf /var/lib/apt/lists/*

# 安装Node.js（使用本地下载的.deb包）
RUN dpkg -i /tmp/*.deb || apt-get install -f -y

# 安装npm（使用与Node.js 18兼容的版本）
RUN npm install -g npm@10.8.2

# 复制应用文件
COPY package*.json ./
COPY src/ ./src/

# 安装应用依赖
# 使用npm ci --only=production，依赖已经在package-lock.json中定义
RUN npm ci --only=production

# 创建数据目录
RUN mkdir -p /app/data && chmod 777 /app/data

# 暴露端口
EXPOSE ${APP_PORT}

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${APP_PORT}/health || exit 1

# 启动命令
CMD ["node", "src/api/server.js"]

# 镜像标签信息
LABEL maintainer="AICreateProject Team" \
      version="1.0.0" \
      description="AICreateProject API服务容器（使用本地依赖管理）"
