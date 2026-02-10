#!/bin/bash

# 智能命令执行器
# 确保命令不会卡死，输出被正确捕获

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

# 显示进度条
show_progress() {
    local duration=$1
    local interval=0.5
    local steps=$((duration * 2))
    local current=0
    
    echo -n "进度: ["
    while [ $current -lt $steps ]; do
        sleep $interval
        echo -n "#"
        current=$((current + 1))
    done
    echo "] 完成"
}

# 智能执行命令
smart_execute() {
    local cmd="$1"
    local description="$2"
    local timeout="${3:-30}"  # 默认30秒超时
    local log_file="/tmp/smart_run_$(date +%s).log"
    
    log "开始执行: $description"
    info "命令: $cmd"
    info "超时: ${timeout}秒"
    info "日志文件: $log_file"
    
    # 创建日志文件头
    echo "=== 命令执行日志 ===" > "$log_file"
    echo "时间: $(date)" >> "$log_file"
    echo "描述: $description" >> "$log_file"
    echo "命令: $cmd" >> "$log_file"
    echo "超时: ${timeout}秒" >> "$log_file"
    echo "==================" >> "$log_file"
    
    # 执行命令，使用timeout防止卡死
    (
        echo "开始执行命令..."
        timeout $timeout bash -c "$cmd"
        exit_code=$?
        
        if [ $exit_code -eq 124 ]; then
            echo "命令执行超时（超过${timeout}秒）"
            return 124
        elif [ $exit_code -eq 0 ]; then
            echo "命令执行成功"
            return 0
        else
            echo "命令执行失败，退出码: $exit_code"
            return $exit_code
        fi
    ) 2>&1 | tee "$log_file"
    
    local final_exit_code=${PIPESTATUS[0]}
    
    # 检查结果
    if [ $final_exit_code -eq 0 ]; then
        success "命令执行成功: $description"
    elif [ $final_exit_code -eq 124 ]; then
        warning "命令执行超时: $description（超过${timeout}秒）"
    else
        error "命令执行失败: $description（退出码: $final_exit_code）"
    fi
    
    info "详细日志: $log_file"
    return $final_exit_code
}

# 分步执行复杂命令
stepwise_execute() {
    local steps=("$@")
    local total_steps=${#steps[@]}
    local current_step=1
    
    log "开始分步执行（共${total_steps}步）"
    
    for step in "${steps[@]}"; do
        info "步骤 ${current_step}/${total_steps}: $step"
        
        # 解析步骤（格式：超时:描述:命令）
        local step_timeout=$(echo "$step" | cut -d':' -f1)
        local step_desc=$(echo "$step" | cut -d':' -f2)
        local step_cmd=$(echo "$step" | cut -d':' -f3-)
        
        if ! smart_execute "$step_cmd" "$step_desc" "$step_timeout"; then
            error "步骤 ${current_step} 失败，停止执行"
            return 1
        fi
        
        current_step=$((current_step + 1))
        echo
    done
    
    success "所有步骤执行完成"
    return 0
}

# Docker相关命令
docker_pull_images() {
    local images=("$@")
    
    log "开始拉取Docker镜像"
    
    for image in "${images[@]}"; do
        info "拉取镜像: $image"
        if ! smart_execute "sudo docker pull $image" "拉取镜像 $image" 120; then
            warning "镜像拉取失败: $image"
            # 继续尝试下一个镜像
        fi
    done
}

# 检查服务状态
check_service_status() {
    local service="$1"
    local max_attempts="${2:-10}"
    local wait_seconds="${3:-2}"
    
    log "检查服务状态: $service"
    
    for i in $(seq 1 $max_attempts); do
        info "尝试 $i/$max_attempts..."
        
        case $service in
            docker)
                if sudo docker ps > /dev/null 2>&1; then
                    success "Docker服务运行正常"
                    return 0
                fi
                ;;
            compose)
                if sudo docker-compose --version > /dev/null 2>&1; then
                    success "Docker Compose可用"
                    return 0
                fi
                ;;
            app)
                if curl --noproxy localhost -s http://localhost:8081/health > /dev/null 2>&1; then
                    success "应用服务运行正常"
                    return 0
                fi
                ;;
            *)
                error "未知服务类型: $service"
                return 1
                ;;
        esac
        
        if [ $i -lt $max_attempts ]; then
            sleep $wait_seconds
        fi
    done
    
    error "服务不可用: $service"
    return 1
}

# 主函数
main() {
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    智能命令执行器                            ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo
    
    case "${1:-help}" in
        "run")
            if [ $# -lt 3 ]; then
                error "用法: $0 run <命令> <描述> [超时]"
                exit 1
            fi
            smart_execute "$2" "$3" "$4"
            ;;
        "steps")
            shift
            stepwise_execute "$@"
            ;;
        "docker-pull")
            shift
            docker_pull_images "$@"
            ;;
        "check")
            if [ $# -lt 2 ]; then
                error "用法: $0 check <服务> [最大尝试次数] [等待秒数]"
                exit 1
            fi
            check_service_status "$2" "$3" "$4"
            ;;
        "test")
            # 测试命令
            log "运行测试命令..."
            smart_execute "echo '测试命令执行中...' && sleep 2 && echo '测试完成'" "测试命令" 5
            ;;
        "help"|"-h"|"--help")
            echo "智能命令执行器"
            echo ""
            echo "用法: $0 [选项]"
            echo ""
            echo "选项:"
            echo "  run <命令> <描述> [超时]     执行单个命令"
            echo "  steps <步骤1> <步骤2> ...    分步执行多个命令"
            echo "                               步骤格式：超时:描述:命令"
            echo "  docker-pull <镜像1> <镜像2>  拉取Docker镜像"
            echo "  check <服务> [尝试] [等待]   检查服务状态"
            echo "                               服务：docker, compose, app"
            echo "  test                        运行测试命令"
            echo "  help                        显示此帮助"
            echo ""
            echo "示例:"
            echo "  $0 run \"ls -la\" \"列出文件\" 10"
            echo "  $0 steps \"30:拉取镜像:docker pull node:alpine\" \"60:启动服务:docker-compose up -d\""
            echo "  $0 docker-pull node:alpine prom/prometheus:latest"
            echo "  $0 check app 15 3"
            ;;
        *)
            error "未知选项: $1"
            echo "使用 '$0 help' 查看帮助"
            exit 1
            ;;
    esac
    
    echo
    log "执行完成"
}

# 执行主函数
main "$@"