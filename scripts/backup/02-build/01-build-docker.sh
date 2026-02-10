#!/bin/bash

# 步骤2: 构建Docker镜像
# 构建应用Docker镜像

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

# 构建Docker镜像
build_docker_image() {
    log_info "开始构建Docker镜像..."
    
    check_command docker
    check_docker_service
    
    # 检查Dockerfile是否存在
    if [ ! -f Dockerfile ]; then
        log_error "Dockerfile不存在"
        exit 1
    fi
    
    # 生成版本标签
    local version_tag="$(date +%Y%m%d-%H%M%S)"
    local image_name="aicreateproject"
    
    log_info "构建镜像: ${image_name}:${version_tag}"
    
    # 构建镜像
    docker build \
        -t ${image_name}:${version_tag} \
        -t ${image_name}:latest \
        .
    
    # 验证镜像构建成功
    if docker images | grep -q "${image_name}"; then
        log_success "Docker镜像构建成功"
        echo ""
        echo "构建的镜像:"
        docker images | grep "${image_name}"
    else
        log_error "Docker镜像构建失败"
        exit 1
    fi
}

# 运行安全扫描
run_security_scan() {
    log_info "运行Docker镜像安全扫描..."
    
    local image_name="aicreateproject:latest"
    
    # 检查Trivy是否可用
    if ! command -v trivy &> /dev/null; then
        log_warning "Trivy未安装，跳过安全扫描"
        log_info "安装Trivy: sudo apt-get install -y trivy"
        return 0
    fi
    
    # 运行Trivy扫描
    log_info "使用Trivy扫描镜像漏洞..."
    trivy image --severity HIGH,CRITICAL ${image_name}
    
    log_success "安全扫描完成"
}

# 检查Dockerfile语法
check_dockerfile() {
    log_info "检查Dockerfile语法..."
    
    if [ ! -f Dockerfile ]; then
        log_error "Dockerfile不存在"
        exit 1
    fi
    
    # 检查Hadolint是否可用
    if ! command -v hadolint &> /dev/null; then
        log_warning "Hadolint未安装，跳过Dockerfile检查"
        log_info "安装Hadolint: sudo apt-get install -y hadolint"
        return 0
    fi
    
    # 运行Hadolint检查
    hadolint Dockerfile
    
    log_success "Dockerfile语法检查完成"
}

# 清理旧的Docker镜像
cleanup_old_images() {
    log_info "清理旧的Docker镜像..."
    
    # 保留最近5个镜像
    local image_name="aicreateproject"
    local keep_count=5
    
    # 获取所有镜像ID（按创建时间排序）
    local images=$(docker images ${image_name} --format "{{.ID}} {{.CreatedAt}}" | sort -r -k2)
    local count=0
    
    echo "当前${image_name}镜像:"
    docker images ${image_name}
    
    echo ""
    echo "清理策略: 保留最近${keep_count}个镜像"
    
    # 删除旧的镜像
    while IFS= read -r line; do
        if [ -n "$line" ]; then
            count=$((count + 1))
            if [ $count -gt $keep_count ]; then
                local image_id=$(echo $line | awk '{print $1}')
                log_info "删除旧镜像: ${image_id}"
                docker rmi -f ${image_id} 2>/dev/null || true
            fi
        fi
    done <<< "$images"
    
    log_success "镜像清理完成"
}

# 显示帮助
show_help() {
    echo "Docker镜像构建脚本"
    echo ""
    echo "用法: ./01-build-docker.sh [选项]"
    echo ""
    echo "选项:"
    echo "  build     构建Docker镜像（默认）"
    echo "  scan      运行安全扫描"
    echo "  check     检查Dockerfile语法"
    echo "  clean     清理旧的Docker镜像"
    echo "  all       执行所有步骤"
    echo "  help      显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  ./01-build-docker.sh build    # 构建Docker镜像"
    echo "  ./01-build-docker.sh all      # 执行所有步骤"
}

# 主函数
main() {
    case "$1" in
        "scan")
            run_security_scan
            ;;
        "check")
            check_dockerfile
            ;;
        "clean")
            cleanup_old_images
            ;;
        "help"|"-h"|"--help")
            show_help
            exit 0
            ;;
        "all")
            log_info "执行所有构建步骤..."
            check_dockerfile
            build_docker_image
            run_security_scan
            cleanup_old_images
            ;;
        "build"|"")
            log_info "开始构建Docker镜像..."
            check_dockerfile
            build_docker_image
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
    
    log_success "Docker镜像构建流程完成"
    echo ""
    echo "下一步:"
    echo "  1. 运行 03-deploy/01-docker-compose.sh 启动应用"
    echo "  2. 运行 03-deploy/02-kubernetes-deploy.sh 部署到Kubernetes"
    echo "  3. 运行 04-monitoring/01-start-monitoring.sh 启动监控"
}

# 执行主函数
main "$1"