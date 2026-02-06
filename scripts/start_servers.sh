#!/bin/bash

# 启动动态网站的前端和后端服务器

echo "正在启动动态网站服务器..."

# 检查Node.js是否可用
NODE_PATH="/home/waxiong/.nvm/versions/node/v22.22.0/bin/node"
if [ ! -f "$NODE_PATH" ]; then
    echo "错误: 找不到Node.js"
    exit 1
fi

# 启动后端API服务器
echo "启动后端API服务器 (端口: 8081)..."
cd /home/waxiong/dynamic-website
$NODE_PATH api/server.js > /tmp/api_server.log 2>&1 &
API_PID=$!
echo "后端API服务器已启动 (PID: $API_PID)"

# 等待后端启动
sleep 2

# 启动前端服务器
echo "启动前端服务器 (端口: 3000)..."
cd /home/waxiong/dynamic-website
$NODE_PATH client/server.js > /tmp/client_server.log 2>&1 &
CLIENT_PID=$!
echo "前端服务器已启动 (PID: $CLIENT_PID)"

# 等待前端启动
sleep 2

echo ""
echo "=========================================="
echo "服务器启动完成！"
echo "=========================================="
echo ""
echo "访问地址:"
echo "1. 前端应用: http://localhost:3000"
echo "   或: http://127.0.0.1:3000"
echo ""
