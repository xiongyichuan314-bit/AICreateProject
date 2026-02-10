#!/bin/bash

# 步骤1: 安装依赖
# 安装Docker、Docker Compose和其他必要的工具

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        return 1
    fi
    return 0
}

# 安装Docker
install_docker() {
    log_info "检查Docker是否已安装..."
    
    if check_command docker; then
        log_success "Docker已安装: $(docker --version)"
        return 0
    fi
    
    log_info "开始安装Docker..."
    
    # 更新包索引
    sudo apt-get update
    
    # 安装Docker
    sudo apt-get install -y docker.io docker-compose
    
    # 启动Docker服务
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # 将当前用户添加到docker组（避免每次使用sudo）
    sudo usermod -aG docker $USER
    
    log_success "Docker安装完成"
    log_warning "需要重新登录或重启系统使docker组权限生效"
}

# 安装Node.js（如果未安装）
install_nodejs() {
    log_info "检查Node.js是否已安装..."
    
    if check_command node; then
        log_success "Node.js已安装: $(node --version)"
        return 0
    fi
    
    log_info "开始安装Node.js 18..."
    
    # 使用NodeSource安装Node.js 18
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    log_success "Node.js安装完成: $(node --version)"
}

# 安装其他工具
install_tools() {
    log_info "安装其他必要工具..."
    
    # 安装curl、git等
    sudo apt-get install -y curl git jq
    
    # 安装PM2（进程管理）
    if ! check_command pm2; then
        sudo npm install -g pm2
        log_success "PM2安装完成"
    fi
    
    log_success "工具安装完成"
}

# 验证安装
verify_installation() {
    log_info "验证安装..."
    
    local all_ok=true
    
    # 检查Docker
    if check_command docker; then
        log_success "✓ Docker: $(docker --version)"
    else
        log_error "✗ Docker未安装"
        all_ok=false
    fi
    
    # 检查Docker Compose
    if check_command docker-compose; then
        log_success "✓ Docker Compose: $(docker-compose --version)"
    else
        log_error "✗ Docker Compose未安装"
        all_ok=false
    fi
    
    # 检查Node.js
    if check_command node; then
        log_success "✓ Node.js: $(node --version)"
    else
        log_error "✗ Node.js未安装"
        all_ok=false
    fi
    
    # 检查npm
    if check_command npm; then
        log_success "✓ npm: $(npm --version)"
    else
        log_error "✗ npm未安装"
        all_ok=false
    fi
    
    if $all_ok; then
        log_success "所有依赖安装验证通过"
    else
        log_error "部分依赖安装失败，请检查"
        return 1
    fi
}

# 配置环境
setup_environment() {
    log_info "配置环境..."
    
    # 创建必要的目录
    mkdir -p logs data
    
    # 检查.env文件
    if [ ! -f .env ]; then
        log_warning ".env文件不存在，创建示例配置"
        if [ -f .env.example ]; then
            cp .env.example .env
            log_warning "请编辑.env文件配置您的环境变量"
        else
            log_error ".env.example文件不存在"
        fi
    fi
    
    log_success "环境配置完成"
}

# 显示帮助
show_help() {
    echo "环境设置脚本"
    echo ""
    echo "用法: ./01-install-dependencies.sh [选项]"
    echo ""
    echo "选项:"
    echo "  all       安装所有依赖（默认）"
    echo "  docker    只安装Docker"
    echo "  node      只安装Node.js"
    echo "  tools     只安装其他工具"
    echo "  verify    验证安装"
    echo "  help      显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  ./01-install-dependencies.sh all    # 安装所有依赖"
    echo "  ./01-install-dependencies.sh verify # 验证安装"
}

# 主函数
main() {
    case "$1" in
        "docker")
            install_docker
            ;;
        "node")
            install_nodejs
            ;;
        "tools")
            install_tools
            ;;
        "verify")
            verify_installation
            ;;
        "help"|"-h"|"--help")
            show_help
            exit 0
            ;;
        "all"|"")
            log_info "开始安装所有依赖..."
            install_docker
            install_nodejs
            install_tools
            setup_environment
            verify_installation
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
    
    log_success "环境设置完成"
    echo ""
    echo "下一步:"
    echo "  1. 编辑.env文件配置环境变量"
    echo "  2. 运行 02-build/01-build-docker.sh 构建Docker镜像"
    echo "  3. 运行 03-deploy/01-docker-compose.sh 启动应用"
}

# 执行主函数
main "$1"