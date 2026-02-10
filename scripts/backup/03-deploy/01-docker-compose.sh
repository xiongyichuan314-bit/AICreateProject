#!/bin/bash

# 步骤3.1: Docker Compose部署
# 使用Docker Compose启动应用

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
        log_error "命令 $1 未安装，请先运行 01-setup/01-install-dependencies.sh"
        exit 1
    fi
}

# 检查Docker服务状态
check_docker_service() {
    log_info "检查Docker服务状态..."
    
    if ! systemctl is-active --quiet docker; then
        log_warning "Docker服务未运行，尝试启动..."
        sudo systemctl start docker
        sleep 3
    fi
    
    if systemctl is-active --quiet docker; then
        log_success "Docker服务正在运行"
    else
        log_error "Docker服务启动失败"
        exit 1
    fi
}

# 检查端口占用
check_ports() {
    log_info "检查端口占用情况..."
    
    local ports=("3000" "8081" "3001" "9090")
    local conflicts=()
    
    for port in "${ports[@]}"; do
        if ss -tuln | grep -q ":${port} "; then
            conflicts+=("${port}")
            log_warning "端口 ${port} 已被占用"
        else
            log_success "端口 ${port} 可用"
        fi
    done
    
    if [ ${#conflicts[@]} -gt 0 ]; then
        log_warning "以下端口已被占用: ${conflicts[*]}"
        log_info "可以修改docker-compose.yml中的端口映射"
        return 1
    fi
    
    return 0
}

# 检查环境配置
check_environment() {
    log_info "检查环境配置..."
    
    # 检查.env文件
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            log_warning ".env文件不存在，从.example复制"
            cp .env.example .env
            log_warning "请编辑.env文件配置您的环境变量"
        else
            log_error ".env文件不存在且没有.example文件"
            exit 1
        fi
    fi
    
    # 检查必要的环境变量
    local required_vars=("QQ_EMAIL_USER" "QQ_EMAIL_PASSWORD")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env 2>/dev/null; then
            missing_vars+=("${var}")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_warning "以下环境变量未配置: ${missing_vars[*]}"
        log_info "请编辑.env文件添加这些变量"
    fi
    
    log_success "环境配置检查完成"
}

# 启动Docker Compose服务
start_services() {
    log_info "启动Docker Compose服务..."
    
    check_command docker
    check_command docker-compose
    check_docker_service
    check_ports
    check_environment
    
    # 检查docker-compose.yml文件
    if [ ! -f docker-compose.yml ]; then
        log_error "docker-compose.yml文件不存在"
        exit 1
    fi
    
    log_info "使用docker-compose启动服务..."
    
    # 启动服务
    docker-compose up -d
    
    # 等待服务启动
    sleep 5
    
    # 检查服务状态
    log_info "检查服务状态..."
    docker-compose ps
    
    log_success "Docker Compose服务启动完成"
}

# 停止Docker Compose服务
stop_services() {
    log_info "停止Docker Compose服务..."
    
    if [ -f docker-compose.yml ]; then
        docker-compose down
        log_success "服务已停止"
    else
        log_warning "docker-compose.yml文件不存在"
    fi
}

# 重启服务
restart_services() {
    log_info "重启Docker Compose服务..."
    
    stop_services
    sleep 2
    start_services
}

# 查看服务日志
view_logs() {
    log_info "查看服务日志..."
    
    if [ -f docker-compose.yml ]; then
        local service="$1"
        if [ -n "$service" ]; then
            docker-compose logs -f "$service"
        else
            docker-compose logs -f
        fi
    else
        log_error "docker-compose.yml文件不存在"
    fi
}

# 检查服务健康状态
check_health() {
    log_info "检查服务健康状态..."
    
    local services=("app" "api" "monitoring")
    local healthy=true
    
    for service in "${services[@]}"; do
        if docker-compose ps | grep -q "${service}.*Up"; then
            log_success "服务 ${service} 正在运行"
        else
            log_error "服务 ${service} 未运行"
            healthy=false
        fi
    done
    
    if $healthy; then
        log_success "所有服务健康状态正常"
    else
        log_error "部分服务运行异常"
        return 1
    fi
}

# 显示服务信息
show_service_info() {
    log_info "服务访问信息:"
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "  应用服务"
    echo "════════════════════════════════════════════════════════════════"
    echo "  • 前端应用: http://localhost:3000"
    echo "  • API接口:  http://localhost:8081"
    echo "  • API文档:  http://localhost:8081/api"
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "  监控服务"
    echo "════════════════════════════════════════════════════════════════"
    echo "  • Grafana:   http://localhost:3001 (用户名: admin, 密码: admin)"
    echo "  • Prometheus: http://localhost:9090"
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "  管理命令"
    echo "════════════════════════════════════════════════════════════════"
    echo "  • 查看日志:   ./01-docker-compose.sh logs"
    echo "  • 停止服务:   ./01-docker-compose.sh stop"
    echo "  • 重启服务:   ./01-docker-compose.sh restart"
    echo "  • 健康检查:   ./01-docker-compose.sh health"
    echo ""
    echo "════════════════════════════════════════════════════════════════"
}

# 显示帮助
show_help() {
    echo "Docker Compose部署脚本"
    echo ""
    echo "用法: ./01-docker-compose.sh [选项]"
    echo ""
    echo "选项:"
    echo "  start     启动服务（默认）"
    echo "  stop      停止服务"
    echo "  restart   重启服务"
    echo "  logs      查看日志 [服务名]"
    echo "  health    检查健康状态"
    echo "  info      显示服务信息"
    echo "  status    查看服务状态"
    echo "  help      显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  ./01-docker-compose.sh start    # 启动所有服务"
    echo "  ./01-docker-compose.sh logs app # 查看app服务日志"
    echo "  ./01-docker-compose.sh health   # 检查服务健康状态"
}

# 主函数
main() {
    case "$1" in
        "stop")
            stop_services
            ;;
        "restart")
            restart_services
            ;;
        "logs")
            view_logs "$2"
            exit 0
            ;;
        "health")
            check_health
            ;;
        "info")
            show_service_info
            ;;
        "status")
            if [ -f docker-compose.yml ]; then
                docker-compose ps
            else
                log_error "docker-compose.yml文件不存在"
            fi
            ;;
        "help"|"-h"|"--help")
            show_help
            exit 0
            ;;
        "start"|"")
            start_services
            check_health
            show_service_info
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
    
    log_success "Docker Compose部署流程完成"
    echo ""
    echo "下一步:"
    echo "  1. 访问 http://localhost:3000 使用应用"
    echo "  2. 运行 03-deploy/02-kubernetes-deploy.sh 部署到Kubernetes"
    echo "  3. 运行 05-cleanup/01-cleanup.sh 清理资源"
}

# 执行主函数
main "$1"