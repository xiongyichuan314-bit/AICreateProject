#!/bin/bash
# AICreateProject Docker镜像构建脚本
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
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# 检查Docker
check_docker() {
    log_info "检查Docker..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    log_success "Docker已安装"
}

# 选择构建模式
select_build_mode() {
    echo ""
    echo "请选择构建模式："
    echo "1) 完整构建 (使用Dockerfile)"
    echo "2) 简化构建 (使用现有镜像)"
    echo "3) 多架构构建"
    echo ""
    read -p "请输入选项 (1/2/3): " build_choice
    
    case $build_choice in
        1)
            BUILD_MODE="full"
            log_info "选择完整构建模式"
            ;;
        2)
            BUILD_MODE="simple"
            log_info "选择简化构建模式"
            ;;
        3)
            BUILD_MODE="multiarch"
            log_info "选择多架构构建模式"
            ;;
        *)
            log_error "无效选项，使用默认完整构建"
            BUILD_MODE="full"
            ;;
    esac
}

# 输入镜像标签
input_image_tag() {
    echo ""
    read -p "请输入镜像标签 (默认: aicreateproject:latest): " image_tag
    image_tag=${image_tag:-"aicreateproject:latest"}
    
    read -p "请输入版本标签 (默认: $(date +%Y%m%d-%H%M%S)): " version_tag
    version_tag=${version_tag:-$(date +%Y%m%d-%H%M%S)}
    
    log_info "镜像标签: $image_tag"
    log_info "版本标签: $version_tag"
}

# 完整构建
build_full() {
    log_info "开始完整构建..."
    
    # 检查Dockerfile
    if [ ! -f "Dockerfile" ]; then
        log_error "Dockerfile不存在"
        exit 1
    fi
    
    # 构建镜像
    log_info "构建镜像: $image_tag, $image_tag-$version_tag"
    docker build \
        -t $image_tag \
        -t $image_tag-$version_tag \
        -f Dockerfile \
        ..
    
    if [ $? -eq 0 ]; then
        log_success "镜像构建成功"
    else
        log_error "镜像构建失败"
        exit 1
    fi
}

# 简化构建
build_simple() {
    log_info "开始简化构建..."
    
    # 检查现有镜像
    if docker images | grep -q "aicreateproject:pure-local"; then
        log_info "找到现有镜像: aicreateproject:pure-local"
        read -p "是否使用现有镜像？(y/N): " use_existing
        
        if [[ "$use_existing" =~ ^[Yy]$ ]]; then
            log_info "使用现有镜像"
            docker tag aicreateproject:pure-local $image_tag
            docker tag aicreateproject:pure-local $image_tag-$version_tag
            log_success "镜像标签更新成功"
            return 0
        fi
    fi
    
    # 构建简化镜像
    log_info "构建简化镜像..."
    docker build \
        -t $image_tag \
        -t $image_tag-$version_tag \
        -f Dockerfile \
        ..
    
    if [ $? -eq 0 ]; then
        log_success "简化镜像构建成功"
    else
        log_error "简化镜像构建失败"
        exit 1
    fi
}

# 多架构构建
build_multiarch() {
    log_info "开始多架构构建..."
    
    # 检查buildx
    if ! docker buildx version &> /dev/null; then
        log_error "Docker Buildx未安装，无法进行多架构构建"
        exit 1
    fi
    
    # 创建构建器
    log_info "创建多架构构建器..."
    docker buildx create --name multiarch-builder --use 2>/dev/null || true
    docker buildx inspect --bootstrap
    
    # 多架构构建
    log_info "构建多架构镜像..."
    docker buildx build \
        --platform linux/amd64,linux/arm64 \
        -t $image_tag \
        -t $image_tag-$version_tag \
        -f Dockerfile \
        --push \
        ..
    
    if [ $? -eq 0 ]; then
        log_success "多架构镜像构建成功"
    else
        log_error "多架构镜像构建失败"
        exit 1
    fi
}

# 显示构建结果
show_build_result() {
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "  构建结果"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    
    log_info "已构建的镜像："
    docker images | grep "$(echo $image_tag | cut -d: -f1)"
    
    echo ""
    echo "🔧 使用命令："
    echo "  • 运行容器: docker run -p 8081:8081 $image_tag"
    echo "  • 推送到仓库: docker push $image_tag"
    echo "  • 查看镜像: docker images | grep aicreateproject"
    echo ""
    echo "📝 镜像信息："
    echo "  • 主标签: $image_tag"
    echo "  • 版本标签: $image_tag-$version_tag"
    echo "  • 构建时间: $(date)"
    echo ""
    echo "════════════════════════════════════════════════════════════════"
}

# 主函数
main() {
    echo "=========================================="
    echo "  AICreateProject Docker镜像构建工具"
    echo "=========================================="
    echo ""
    
    check_docker
    select_build_mode
    input_image_tag
    
    case $BUILD_MODE in
        "full")
            build_full
            ;;
        "simple")
            build_simple
            ;;
        "multiarch")
            build_multiarch
            ;;
    esac
    
    show_build_result
    log_success "镜像构建完成！"
}

# 执行主函数
main "$@"
