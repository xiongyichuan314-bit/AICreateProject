#!/bin/bash

# PM2启动脚本
# 使用PM2托管动态网站的前端和后端服务器

echo "正在使用PM2启动动态网站服务器..."

# 检查PM2是否安装
if ! command -v pm2 &> /dev/null; then
    echo "错误: PM2未安装，请先安装PM2: npm install -g pm2"
    exit 1
fi

# 停止已存在的PM2进程（如果存在）
echo "停止已存在的进程..."
pm2 delete dynamic-api dynamic-client 2>/dev/null || true

# 使用PM2配置文件启动
echo "使用PM2配置文件启动..."
pm2 start config/ecosystem.config.js

# 等待服务器启动
sleep 3

# 保存PM2配置以便开机自启
pm2 save

echo ""
echo "=========================================="
echo "PM2启动完成！"
echo "=========================================="
echo ""
echo "常用PM2命令:"
echo "  pm2 status                     # 查看进程状态"
echo "  pm2 logs [name]               # 查看日志"
echo "  pm2 restart [name]            # 重启进程"
echo "  pm2 stop [name]               # 停止进程"
echo "  pm2 delete [name]             # 删除进程"
echo "  pm2 monit                     # 监控面板"
echo "  pm2 save                      # 保存当前配置"
echo "  pm2 startup                   # 设置开机自启"
echo ""
echo "访问地址:"
echo "1. 前端应用: http://localhost:3000"
echo "   或: http://127.0.0.1:3000"
echo "2. 后端API: http://localhost:8081/api"
echo "3. 健康检查:"
echo "   - 前端: http://localhost:3000/health"
echo "   - 后端: http://localhost:8081/health"
echo ""
echo "查看日志:"
echo "  pm2 logs dynamic-api          # 查看后端日志"
echo "  pm2 logs dynamic-client       # 查看前端日志"
echo "  pm2 logs                      # 查看所有日志"