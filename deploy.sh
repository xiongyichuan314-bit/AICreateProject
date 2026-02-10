#!/bin/bash

# ============================================================================
# AICreateProject 统一部署脚本
# 版本: 2.0
# 设计原则: 一个入口，模块化，清晰分层
# ============================================================================

set -e

# ----------------------------------------------------------------------------
# 颜色和样式定义
# ----------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ----------------------------------------------------------------------------
# 日志函数
# ----------------------------------------------------------------------------
log_header() {
    echo -e "${MAGENTA}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║${NC} ${BOLD}AICreateProject 部署工具 v2.0${NC} ${MAGENTA}║${NC}"
    echo -e "${MAGENTA}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

log_step() {
    echo -e "${CYAN}▶${NC} ${BOLD}$1${NC}"
    echo "────────────────────────────────────────────────────────────"
}

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

# ----------------------------------------------------------------------------
# 工具函数
# ----------------------------------------------------------------------------
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "命令 $1 未安装，请先安装"
        return 1
    fi
    return 0
}

ensure_env_file() {
    if [ ! -f .env ]; then
        log_warning ".env文件不存在，创建示例配置文件"
        if [ -f .env.example ]; then
            cp .env.example .env
            log_info "已创建 .env 文件，请编辑配置您的环境变量"
        else
            log_error ".env.example 文件也不存在"
            return 1
        fi
    fi
    return 0
}

# ----------------------------------------------------------------------------
# 模块1: 本地开发
# ----------------------------------------------------------------------------
module_dev() {
    case "$1" in
        "start")
            log_step "启动本地开发环境"
            check_command node || return 1
            check_command npm || return 1
            
            log_info "安装依赖..."
            npm install
            
            log_info "启动应用..."
            node api/server.js &
            local pid=$!
            echo $pid > /tmp/aicreateproject.pid
            log_success "应用已启动 (PID: $pid)"
            log_info "访问: http://localhost:8081"
            ;;
            
        "stop")
            log_step "停止本地开发环境"
            if [ -f /tmp/aicreateproject.pid ]; then
                local pid=$(cat /tmp/aicreateproject.pid)
                kill $pid 2>/dev/null && log_success "应用已停止" || log_warning "进程可能已结束"
                rm -f /tmp/aicreateproject.pid
            else
                log_info "没有找到运行中的进程"
            fi
            ;;
            
        "test")
            log_step "运行测试"
            check_command npm || return 1
            npm test
            ;;
            
        *)
            log_error "未知开发命令: $1"
            return 1
            ;;
    esac
}

# ----------------------------------------------------------------------------
# 模块2: Docker 容器化
# ----------------------------------------------------------------------------
module_docker() {
    case "$1" in
        "build")
            log_step "构建Docker镜像"
            check_command docker || return 1
            
            local tag="aicreateproject:$(date +%Y%m%d-%H%M%S)"
            
            # 选择Dockerfile
            local dockerfile="docker/Dockerfile"
            if [ "$2" = "simple" ]; then
                dockerfile="docker/Dockerfile.simple"
                log_info "使用简化版Dockerfile"
            fi
            
            log_info "构建镜像: $tag"
            docker build -t aicreateproject:latest -t $tag -f $dockerfile .
            
            log_success "镜像构建完成"
            log_info "标签: aicreateproject:latest, $tag"
            ;;
            
        "run")
            log_step "运行Docker容器"
            check_command docker || return 1
            
            ensure_env_file || return 1
            
            local compose_file="docker/docker-compose.yml"
            if [ "$2" = "simple" ]; then
                compose_file="docker/docker-compose-simple.yml"
                log_info "使用简化版docker-compose"
            fi
            
            log_info "停止并清理旧容器..."
            docker-compose -f $compose_file down 2>/dev/null || true
            
            log_info "启动新服务..."
            docker-compose -f $compose_file up -d
            
            log_success "服务已启动"
            show_service_info $compose_file
            
            # 等待服务启动并检查状态
            log_info "等待服务启动..."
            sleep 3
            check_container_health $compose_file
            ;;
            
        "stop")
            log_step "停止Docker容器"
            check_command docker || return 1
            
            local compose_file="docker/docker-compose.yml"
            if [ "$2" = "simple" ]; then
                compose_file="docker/docker-compose-simple.yml"
            fi
            
            docker-compose -f $compose_file down
            log_success "服务已停止"
            ;;
            
        "logs")
            log_step "查看Docker日志"
            check_command docker || return 1
            
            local compose_file="docker/docker-compose.yml"
            if [ "$2" = "simple" ]; then
                compose_file="docker/docker-compose-simple.yml"
            fi
            
            docker-compose -f $compose_file logs -f
            ;;
            
        "clean")
            log_step "清理Docker资源"
            check_command docker || return 1
            
            log_info "停止并删除容器..."
            docker-compose down -v 2>/dev/null || true
            
            log_info "清理未使用的镜像..."
            docker image prune -f
            
            log_info "清理未使用的卷..."
            docker volume prune -f
            
            log_success "Docker资源已清理"
            ;;
            
        *)
            log_error "未知Docker命令: $1"
            return 1
            ;;
    esac
}

# ----------------------------------------------------------------------------
# 模块3: 部署流程
# ----------------------------------------------------------------------------
module_deploy() {
    case "$1" in
        "full")
            log_step "完整部署流程"
            
            # 1. 构建镜像
            module_docker build ${2:-"simple"}
            
            # 2. 启动服务
            module_docker run ${2:-"simple"}
            
            # 3. 验证部署
            sleep 5
            verify_deployment
            
            log_success "完整部署完成"
            ;;
            
        "quick")
            log_step "快速部署（使用现有镜像）"
            
            # 1. 启动服务
            module_docker run ${2:-"simple"}
            
            # 2. 验证部署
            sleep 5
            verify_deployment
            
            log_success "快速部署完成"
            ;;
            
        "verify")
            log_step "验证部署状态"
            verify_deployment
            ;;
            
        *)
            log_error "未知部署命令: $1"
            return 1
            ;;
    esac
}

# ----------------------------------------------------------------------------
# 模块4: 监控和管理
# ----------------------------------------------------------------------------
module_monitor() {
    case "$1" in
        "status")
            log_step "服务状态检查"
            check_command docker || return 1
            
            local compose_file="docker/docker-compose.yml"
            if [ "$2" = "simple" ]; then
                compose_file="docker/docker-compose-simple.yml"
            fi
            
            if [ -f "$compose_file" ]; then
                docker-compose -f $compose_file ps
            else
                log_info "检查本地进程..."
                ps aux | grep -E "(node api/server.js|npm)" | grep -v grep || log_info "没有找到运行中的服务"
            fi
            ;;
            
        "health")
            log_step "健康检查"
            verify_deployment
            ;;
            
        "metrics")
            log_step "查看监控指标"
            log_info "Prometheus: http://localhost:9090"
            log_info "Grafana:    http://localhost:3001 (admin/admin)"
            log_info "应用指标:   http://localhost:8081/metrics"
            ;;
            
        *)
            log_error "未知监控命令: $1"
            return 1
            ;;
    esac
}

# ----------------------------------------------------------------------------
# 辅助函数
# ----------------------------------------------------------------------------
show_service_info() {
    local compose_file=${1:-"docker/docker-compose.yml"}
    
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "  服务访问信息"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    
    if [[ "$compose_file" == *"simple"* ]]; then
        echo "📊 简化部署:"
        echo "  • 应用API:     http://localhost:8081"
        echo "  • 前端:        http://localhost:3000"
        echo "  • Prometheus:  http://localhost:9090"
        echo "  • Grafana:     http://localhost:3001"
    else
        echo "📊 完整部署:"
        echo "  • 应用API:     http://localhost:8081"
        echo "  • API文档:     http://localhost:8081/api"
        echo "  • 前端:        http://localhost:3000"
        echo "  • Prometheus:  http://localhost:9090"
        echo "  • Grafana:     http://localhost:3001 (admin/admin)"
    fi
    
    echo ""
    echo "🔧 管理命令:"
    echo "  • 查看日志:    ./deploy.sh docker logs"
    echo "  • 停止服务:    ./deploy.sh docker stop"
    echo "  • 服务状态:    ./deploy.sh monitor status"
    echo "  • 健康检查:    ./deploy.sh monitor health"
    echo ""
    echo "════════════════════════════════════════════════════════════════"
}

verify_deployment() {
    log_info "验证服务状态..."
    
    # 检查应用健康
    if curl -s --noproxy localhost http://localhost:8081/health > /dev/null; then
        log_success "应用API: 健康 ✓"
    else
        log_warning "应用API: 不可访问 ✗"
    fi
    
    # 检查Prometheus
    if curl -s --noproxy localhost http://localhost:9090/-/healthy > /dev/null; then
        log_success "Prometheus: 健康 ✓"
    else
        log_warning "Prometheus: 不可访问 ✗"
    fi
    
    # 检查Grafana
    if curl -s --noproxy localhost http://localhost:3001/api/health > /dev/null; then
        log_success "Grafana: 健康 ✓"
    else
        log_warning "Grafana: 不可访问 ✗"
    fi
}

check_container_health() {
    local compose_file=${1:-"docker/docker-compose.yml"}
    
    log_info "检查容器状态..."
    
    # 获取所有容器状态
    local containers=$(docker-compose -f $compose_file ps -q)
    
    if [ -z "$containers" ]; then
        log_warning "没有找到运行的容器"
        return 1
    fi
    
    local all_healthy=true
    
    for container in $containers; do
        local name=$(docker inspect --format='{{.Name}}' $container | sed 's/^\///')
        local status=$(docker inspect --format='{{.State.Status}}' $container)
        local health=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' $container)
        
        if [ "$status" = "running" ]; then
            if [ "$health" = "healthy" ] || [ "$health" = "none" ]; then
                log_success "容器 $name: 运行中 ($health)"
            else
                log_warning "容器 $name: 运行中但健康状态: $health"
                all_healthy=false
            fi
        else
            log_error "容器 $name: 状态异常 ($status)"
            all_healthy=false
        fi
    done
    
    if [ "$all_healthy" = true ]; then
        log_success "所有容器运行正常"
    else
        log_warning "部分容器状态异常，请检查日志"
        return 1
    fi
}

# ----------------------------------------------------------------------------
# 帮助信息
# ----------------------------------------------------------------------------
show_help() {
    log_header
    
    echo "${BOLD}用法:${NC} ./deploy.sh [模块] [命令] [选项]"
    echo ""
    
    echo "${CYAN}📦 模块:${NC}"
    echo "  ${BOLD}dev${NC}     本地开发环境"
    echo "  ${BOLD}docker${NC}  Docker容器管理"
    echo "  ${BOLD}deploy${NC} 部署流程"
    echo "  ${BOLD}monitor${NC} 监控和管理"
    echo ""
    
    echo "${CYAN}🛠️  命令示例:${NC}"
    echo "  ${BOLD}本地开发:${NC}"
    echo "    ./deploy.sh dev start      # 启动本地开发服务器"
    echo "    ./deploy.sh dev stop       # 停止本地开发服务器"
    echo "    ./deploy.sh dev test       # 运行测试"
    echo ""
    
    echo "  ${BOLD}Docker管理:${NC}"
    echo "    ./deploy.sh docker build          # 构建Docker镜像"
    echo "    ./deploy.sh docker build simple   # 使用简化版构建"
    echo "    ./deploy.sh docker run            # 启动Docker服务"
    echo "    ./deploy.sh docker run simple     # 启动简化版服务"
    echo "    ./deploy.sh docker logs           # 查看日志"
    echo "    ./deploy.sh docker stop           # 停止服务"
    echo "    ./deploy.sh docker clean          # 清理资源"
    echo ""
    
    echo "  ${BOLD}部署流程:${NC}"
    echo "    ./deploy.sh deploy full          # 完整部署（构建+启动）"
    echo "    ./deploy.sh deploy full simple   # 简化版完整部署"
    echo "    ./deploy.sh deploy quick         # 快速部署（仅启动）"
    echo "    ./deploy.sh deploy verify        # 验证部署状态"
    echo ""
    
    echo "  ${BOLD}监控管理:${NC}"
    echo "    ./deploy.sh monitor status       # 查看服务状态"
    echo "    ./deploy.sh monitor health       # 健康检查"
    echo "    ./deploy.sh monitor metrics      # 查看监控地址"
    echo ""
    
    echo "${CYAN}🎯 快速开始:${NC}"
    echo "  1. ${BOLD}首次部署:${NC}   ./deploy.sh deploy full simple"
    echo "  2. ${BOLD}日常开发:${NC}   ./deploy.sh dev start"
    echo "  3. ${BOLD}更新部署:${NC}   ./deploy.sh deploy quick"
    echo "  4. ${BOLD}查看状态:${NC}   ./deploy.sh monitor status"
    echo ""
    
    echo "${CYAN}📁 项目结构:${NC}"
    echo "  • docker/Dockerfile              - 完整版Docker构建文件"
    echo "  • docker/Dockerfile.simple       - 简化版Docker构建文件"
    echo "  • docker/docker-compose.yml      - 完整服务编排"
    echo "  • docker/docker-compose-simple.yml - 简化服务编排"
    echo "  • monitoring/                   - 监控配置文件"
    echo "  • scripts/                      - 部署和管理脚本"
    echo "  • .env.example                  - 环境变量示例"
    echo ""
}

# ----------------------------------------------------------------------------
# 主函数
# ----------------------------------------------------------------------------
main() {
    # 显示帮助信息（如果没有参数）
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    # 显示标题（除了help命令）
    if [ "$1" != "help" ] && [ "$1" != "-h" ] && [ "$1" != "--help" ]; then
        log_header
    fi
    
    case "$1" in
        "dev")
            module_dev "${@:2}"
            ;;
        "docker")
            module_docker "${@:2}"
            ;;
        "deploy")
            module_deploy "${@:2}"
            ;;
        "monitor"|"mon")
            module_monitor "${@:2}"
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "未知模块: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# ----------------------------------------------------------------------------
# 脚本入口
# ----------------------------------------------------------------------------
main "$@"