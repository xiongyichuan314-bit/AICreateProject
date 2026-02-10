#!/bin/bash
# AICreateProject Docker服务停止脚本
# 停止所有Docker服务

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

# 检查Docker Compose
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        if ! docker compose version &> /dev/null; then
            log_error "Docker Compose未安装"
            exit 1
        fi
        DOCKER_COMPOSE_CMD="docker compose"
    else
        DOCKER_COMPOSE_CMD="docker-compose"
    fi
}

# 选择停止模式
select_stop_mode() {
    echo ""
    echo "请选择停止模式："
    echo "1) 停止服务但保留数据"
    echo "2) 停止服务并清理数据"
    echo "3) 停止特定服务"
    echo ""
    read -p "请输入选项 (1/2/3): " stop_choice
    
    case $stop_choice in
        1)
            STOP_CMD="down"
            log_info "停止服务但保留数据"
            ;;
        2)
            STOP_CMD="down -v"
            log_warning "停止服务并清理数据（数据将被删除！）"
            read -p "确认要删除数据吗？(y/N): " confirm
            if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
                log_info "取消操作"
                exit 0
            fi
            ;;
        3)
            select_specific_service
            ;;
        *)
            log_error "无效选项，使用默认模式（停止服务但保留数据）"
            STOP_CMD="down"
            ;;
    esac
}

# 选择特定服务
select_specific_service() {
    echo ""
    echo "可用的服务："
    echo "1) app / app-simple (应用API)"
    echo "2) frontend / client-simple (前端)"
    echo "3) prometheus / prometheus-simple (监控)"
    echo "4) grafana / grafana-simple (可视化)"
    echo ""
    read -p "请输入要停止的服务编号: " service_choice
    
    case $service_choice in
        1)
            SERVICE_NAME="app"
            ;;
        2)
            SERVICE_NAME="frontend"
            ;;
        3)
            SERVICE_NAME="prometheus"
            ;;
        4)
            SERVICE_NAME="grafana"
            ;;
        *)
            log_error "无效选项"
            exit 1
            ;;
    esac
    
    read -p "请输入部署模式 (full/simple): " deploy_mode
    
    if [[ "$deploy_mode" == "simple" ]]; then
        SERVICE_NAME="${SERVICE_NAME}-simple"
        COMPOSE_FILE="docker-compose-simple.yml"
    else
        COMPOSE_FILE="docker-compose.yml"
    fi
    
    log_info "停止服务: $SERVICE_NAME"
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE stop $SERVICE_NAME
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE rm -f $SERVICE_NAME
    log_success "服务 $SERVICE_NAME 已停止"
    exit 0
}

# 选择部署文件
select_compose_file() {
    echo ""
    echo "请选择要停止的部署："
    echo "1) 完整部署 (docker-compose.yml)"
    echo "2) 简化部署 (docker-compose-simple.yml)"
    echo "3) 自定义文件"
    echo ""
    read -p "请输入选项 (1/2/3): " file_choice
    
    case $file_choice in
        1)
            COMPOSE_FILE="docker-compose.yml"
            log_info "停止完整部署"
            ;;
        2)
            COMPOSE_FILE="docker-compose-simple.yml"
            log_info "停止简化部署"
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

# 主函数
main() {
    echo "=========================================="
    echo "  AICreateProject Docker服务停止工具"
    echo "=========================================="
    echo ""
    
    check_docker_compose
    select_compose_file
    select_stop_mode
    
    log_info "正在停止服务..."
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE $STOP_CMD
    
    if [ $? -eq 0 ]; then
        log_success "服务已成功停止"
    else
        log_error "服务停止失败"
        exit 1
    fi
}

# 执行主函数
main "$@"
