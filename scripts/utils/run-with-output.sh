#!/bin/bash

# 命令执行包装器
# 确保命令输出可见并记录日志

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

# 创建日志目录
LOG_DIR="/tmp/aicreateproject-logs"
mkdir -p "$LOG_DIR"

# 生成日志文件名
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/command_${TIMESTAMP}.log"

# 显示横幅
show_banner() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    命令执行包装器                            ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
}

# 执行命令并捕获输出
execute_command() {
    local cmd="$1"
    local description="$2"
    local timeout="${3:-60}"  # 默认超时60秒
    
    log_info "执行命令: $description"
    log_info "命令: $cmd"
    log_info "日志文件: $LOG_FILE"
    log_info "超时: ${timeout}秒"
    
    echo "════════════════════════════════════════════════════════════════" >> "$LOG_FILE"
    echo "时间: $(date)" >> "$LOG_FILE"
    echo "命令: $cmd" >> "$LOG_FILE"
    echo "描述: $description" >> "$LOG_FILE"
    echo "════════════════════════════════════════════════════════════════" >> "$LOG_FILE"
    
    # 执行命令，同时输出到终端和日志文件
    if timeout $timeout bash -c "$cmd" 2>&1 | tee -a "$LOG_FILE"; then
        log_success "命令执行成功: $description"
        echo "结果: 成功" >> "$LOG_FILE"
        return 0
    else
        local exit_code=$?
        if [ $exit_code -eq 124 ]; then
            log_error "命令执行超时: $description (超过${timeout}秒)"
            echo "结果: 超时" >> "$LOG_FILE"
        else
            log_error "命令执行失败: $description (退出码: $exit_code)"
            echo "结果: 失败 (退出码: $exit_code)" >> "$LOG_FILE"
        fi
        return $exit_code
    fi
}

# 执行命令并在后台运行
execute_background() {
    local cmd="$1"
    local description="$2"
    local log_file="$LOG_DIR/background_${TIMESTAMP}.log"
    
    log_info "在后台执行命令: $description"
    log_info "命令: $cmd"
    log_info "后台日志: $log_file"
    
    # 在后台执行命令，输出到日志文件
    nohup bash -c "$cmd" > "$log_file" 2>&1 &
    local pid=$!
    
    log_success "后台命令已启动 (PID: $pid): $description"
    echo "PID: $pid" >> "$LOG_FILE"
    echo "后台日志: $log_file" >> "$LOG_FILE"
    
    # 等待2秒检查进程是否还在运行
    sleep 2
    if ps -p $pid > /dev/null; then
        log_success "后台进程运行正常 (PID: $pid)"
        return 0
    else
        log_error "后台进程可能已退出 (PID: $pid)"
        log_info "查看日志: tail -20 $log_file"
        return 1
    fi
}

# 检查服务状态
check_service() {
    local url="$1"
    local description="$2"
    local max_attempts="${3:-10}"
    local wait_seconds="${4:-2}"
    
    log_info "检查服务状态: $description"
    log_info "URL: $url"
    log_info "最大尝试次数: $max_attempts"
    
    for i in $(seq 1 $max_attempts); do
        log_info "尝试 $i/$max_attempts..."
        
        if curl -s -f "$url" > /dev/null 2>&1; then
            log_success "服务可用: $description"
            return 0
        fi
        
        if [ $i -lt $max_attempts ]; then
            sleep $wait_seconds
        fi
    done
    
    log_error "服务不可用: $description (尝试 $max_attempts 次后失败)"
    return 1
}

# 显示帮助
show_help() {
    show_banner
    
    echo "命令执行包装器"
    echo ""
    echo "用法: ./run-with-output.sh [选项]"
    echo ""
    echo "选项:"
    echo "  run <命令> <描述> [超时]  执行命令并显示输出"
    echo "  bg <命令> <描述>         在后台执行命令"
    echo "  check <URL> <描述>       检查服务状态"
    echo "  logs                     显示最近的日志"
    echo "  clean                    清理旧的日志文件"
    echo "  help                     显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  ./run-with-output.sh run \"npm start\" \"启动API服务器\" 30"
    echo "  ./run-with-output.sh bg \"node server.js\" \"启动后台服务\""
    echo "  ./run-with-output.sh check \"http://localhost:8081/health\" \"健康检查\""
    echo ""
    echo "日志目录: $LOG_DIR"
}

# 显示最近的日志
show_logs() {
    show_banner
    
    log_info "最近的日志文件:"
    ls -lt "$LOG_DIR"/*.log 2>/dev/null | head -10
    
    echo ""
    echo "查看具体日志:"
    echo "  tail -f $LOG_DIR/最新的日志文件"
    echo "  cat $LOG_DIR/具体的日志文件"
}

# 清理旧的日志文件
clean_logs() {
    show_banner
    
    log_info "清理7天前的日志文件..."
    find "$LOG_DIR" -name "*.log" -mtime +7 -delete
    
    local count=$(find "$LOG_DIR" -name "*.log" | wc -l)
    log_success "日志清理完成，剩余 $count 个日志文件"
}

# 主函数
main() {
    show_banner
    
    case "$1" in
        "run")
            if [ $# -lt 3 ]; then
                log_error "参数不足"
                show_help
                exit 1
            fi
            execute_command "$2" "$3" "$4"
            ;;
        "bg")
            if [ $# -lt 3 ]; then
                log_error "参数不足"
                show_help
                exit 1
            fi
            execute_background "$2" "$3"
            ;;
        "check")
            if [ $# -lt 3 ]; then
                log_error "参数不足"
                show_help
                exit 1
            fi
            check_service "$2" "$3" "$4" "$5"
            ;;
        "logs")
            show_logs
            ;;
        "clean")
            clean_logs
            ;;
        "help"|"-h"|"--help")
            show_help
            exit 0
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
    
    echo ""
    log_info "执行完成"
    log_info "详细日志: $LOG_FILE"
}

# 执行主函数
main "$@"