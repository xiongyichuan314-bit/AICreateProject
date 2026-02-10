#!/bin/bash
# AICreateProject Docker日志查看脚本
# 查看Docker服务日志

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
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

# 选择部署文件
select_compose_file() {
    echo ""
    echo "请选择要查看日志的部署："
    echo "1) 完整部署 (docker-compose.yml)"
    echo "2) 简化部署 (docker-compose-simple.yml)"
    echo "3) 自定义文件"
    echo ""
    read -p "请输入选项 (1/2/3): " file_choice
    
    case $file_choice in
        1)
            COMPOSE_FILE="docker-compose.yml"
            log_info "查看完整部署日志"
            ;;
        2)
            COMPOSE_FILE="docker-compose-simple.yml"
            log_info "查看简化部署日志"
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

# 选择日志模式
select_log_mode() {
    echo ""
    echo "请选择日志模式："
    echo "1) 查看所有服务日志"
    echo "2) 查看特定服务日志"
    echo "3) 查看最近日志（最后100行）"
    echo "4) 实时跟踪日志"
    echo "5) 查看错误日志"
    echo ""
    read -p "请输入选项 (1/2/3/4/5): " log_choice
    
    case $log_choice in
        1)
            LOG_MODE="all"
            log_info "查看所有服务日志"
            ;;
        2)
            LOG_MODE="specific"
            select_specific_service
            ;;
        3)
            LOG_MODE="recent"
            log_info "查看最近日志"
            ;;
        4)
            LOG_MODE="follow"
            log_info "实时跟踪日志"
            ;;
        5)
            LOG_MODE="errors"
            log_info "查看错误日志"
            ;;
        *)
            log_error "无效选项，使用默认所有服务日志"
            LOG_MODE="all"
            ;;
    esac
}

# 选择特定服务
select_specific_service() {
    echo ""
    echo "可用的服务："
    
    # 获取服务列表
    services=$($DOCKER_COMPOSE_CMD -f $COMPOSE_FILE config --services)
    
    i=1
    declare -A service_map
    for service in $services; do
        echo "$i) $service"
        service_map[$i]=$service
        ((i++))
    done
    
    echo ""
    read -p "请输入要查看的服务编号: " service_choice
    
    if [[ -z "${service_map[$service_choice]}" ]]; then
        log_error "无效选项"
        exit 1
    fi
    
    SERVICE_NAME="${service_map[$service_choice]}"
    log_info "查看服务日志: $SERVICE_NAME"
}

# 查看所有日志
view_all_logs() {
    log_info "显示所有服务日志..."
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE logs --tail=50
}

# 查看特定服务日志
view_specific_logs() {
    log_info "显示服务 $SERVICE_NAME 日志..."
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE logs --tail=50 $SERVICE_NAME
}

# 查看最近日志
view_recent_logs() {
    log_info "显示最近100行日志..."
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE logs --tail=100
}

# 实时跟踪日志
view_follow_logs() {
    log_info "开始实时跟踪日志 (按Ctrl+C退出)..."
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE logs -f
}

# 查看错误日志
view_error_logs() {
    log_info "显示错误日志..."
    
    # 获取所有服务日志并过滤错误
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE logs --tail=200 | grep -i -E "error|fail|exception|warning|critical" | head -100
    
    if [ $? -ne 0 ]; then
        log_info "未找到错误日志"
    fi
}

# 显示日志统计
show_log_stats() {
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "  日志统计"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    
    log_info "容器状态："
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE ps
    
    echo ""
    log_info "日志文件位置："
    for service in $($DOCKER_COMPOSE_CMD -f $COMPOSE_FILE config --services); do
        container_id=$($DOCKER_COMPOSE_CMD -f $COMPOSE_FILE ps -q $service)
        if [ ! -z "$container_id" ]; then
            echo "  • $service: $(docker inspect --format='{{.LogPath}}' $container_id 2>/dev/null || echo '无日志文件')"
        fi
    done
    
    echo ""
    echo "🔧 日志管理命令："
    echo "  • 清理日志: docker system prune -f"
    echo "  • 查看磁盘使用: docker system df"
    echo "  • 查看容器日志文件: docker inspect --format='{{.LogPath}}' <容器ID>"
    echo ""
    echo "════════════════════════════════════════════════════════════════"
}

# 主函数
main() {
    echo "=========================================="
    echo "  AICreateProject Docker日志查看工具"
    echo "=========================================="
    echo ""
    
    check_docker_compose
    select_compose_file
    select_log_mode
    
    case $LOG_MODE in
        "all")
            view_all_logs
            ;;
        "specific")
            view_specific_logs
            ;;
        "recent")
            view_recent_logs
            ;;
        "follow")
            view_follow_logs
            ;;
        "errors")
            view_error_logs
            ;;
    esac
    
    show_log_stats
}

# 执行主函数
main "$@"
