#!/bin/bash
# AICreateProject Docker服务启动脚本
# 统一启动所有Docker服务

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
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# 检查Docker和Docker Compose
check_dependencies() {
    log_info "检查依赖..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_warning "Docker Compose未安装，尝试使用docker compose插件..."
        if ! docker compose version &> /dev/null; then
            log_error "Docker Compose未安装，请先安装Docker Compose"
            exit 1
        fi
        DOCKER_COMPOSE_CMD="docker compose"
    else
        DOCKER_COMPOSE_CMD="docker-compose"
    fi
    
    log_success "依赖检查通过"
}

# 选择部署模式
select_mode() {
    echo ""
    echo "请选择部署模式："
    echo "1) 完整部署 (使用docker-compose.yml)"
    echo "2) 简化部署 (使用docker-compose-simple.yml)"
    echo "3) 自定义文件"
    echo ""
    read -p "请输入选项 (1/2/3): " mode_choice
    
    case $mode_choice in
        1)
            COMPOSE_FILE="docker-compose.yml"
            log_info "选择完整部署模式"
            ;;
        2)
            COMPOSE_FILE="docker-compose-simple.yml"
            log_info "选择简化部署模式"
            ;;
        3)
            read -p "请输入自定义docker-compose文件路径: " custom_file
            if [ ! -f "$custom_file" ]; then
                log_error "文件不存在: $custom_file"
                exit 1
            fi
            COMPOSE_FILE="$custom_file"
            log_info "使用自定义文件: $COMPOSE_FILE"
            ;;
        *)
            log_error "无效选项，使用默认完整部署"
            COMPOSE_FILE="docker-compose.yml"
            ;;
    esac
}

# 启动服务
start_services() {
    log_info "启动Docker服务..."
    
    # 停止现有服务
    log_info "停止现有服务..."
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE down 2>/dev/null || true
    
    # 启动新服务
    log_info "启动新服务..."
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE up -d
    
    if [ $? -eq 0 ]; then
        log_success "服务启动成功"
    else
        log_error "服务启动失败"
        exit 1
    fi
}

# 检查服务状态
check_status() {
    log_info "检查服务状态..."
    sleep 5
    
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "  服务状态"
    echo "════════════════════════════════════════════════════════════════"
    
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE ps
    
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "  访问地址"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    
    if [[ "$COMPOSE_FILE" == *"simple"* ]]; then
        echo "📊 简化部署:"
        echo "  • 应用API:     http://localhost:8081"
        echo "  • 前端:        http://localhost:3000"
        echo "  • Prometheus:  http://localhost:9090"
        echo "  • Grafana:     http://localhost:3001 (admin/admin)"
    else
        echo "📊 完整部署:"
        echo "  • 应用API:     http://localhost:8081"
        echo "  • 前端:        http://localhost:3000"
        echo "  • Prometheus:  http://localhost:9090"
        echo "  • Grafana:     http://localhost:3001 (admin/admin)"
    fi
    
    echo ""
    echo "🔧 管理命令:"
    echo "  • 查看日志:    ./scripts/logs.sh"
    echo "  • 停止服务:    ./scripts/stop.sh"
    echo "  • 服务状态:    ./scripts/status.sh"
    echo ""
    echo "════════════════════════════════════════════════════════════════"
}

# 主函数
main() {
    echo "=========================================="
    echo "  AICreateProject Docker服务启动工具"
    echo "=========================================="
    echo ""
    
    check_dependencies
    select_mode
    start_services
    check_status
    
    log_success "所有服务已成功启动！"
}

# 执行主函数
main "$@"
