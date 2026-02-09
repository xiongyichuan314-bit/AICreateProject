#!/bin/bash

# AICreateProject DevOps部署脚本
# 支持Docker Compose和Kubernetes部署

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
        log_error "命令 $1 未安装，请先安装"
        exit 1
    fi
}

# 显示帮助信息
show_help() {
    echo "AICreateProject DevOps部署脚本"
    echo ""
    echo "用法: ./deploy.sh [选项]"
    echo ""
    echo "选项:"
    echo "  docker-build     构建Docker镜像"
    echo "  docker-run       使用Docker Compose运行应用"
    echo "  docker-stop      停止Docker Compose服务"
    echo "  docker-clean     清理Docker资源"
    echo "  k8s-deploy      部署到Kubernetes"
    echo "  k8s-delete      从Kubernetes删除部署"
    echo "  k8s-status      查看Kubernetes部署状态"
    echo "  jenkins-run     启动Jenkins CI/CD流水线"
    echo "  monitoring      启动监控服务"
    echo "  all             执行完整部署流程"
    echo "  help            显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  ./deploy.sh docker-build    # 构建Docker镜像"
    echo "  ./deploy.sh docker-run      # 启动Docker服务"
    echo "  ./deploy.sh all             # 执行完整部署"
}

# 构建Docker镜像
docker_build() {
    log_info "开始构建Docker镜像..."
    
    check_command docker
    
    # 构建应用镜像
    docker build -t aicreateproject:latest -t aicreateproject:$(date +%Y%m%d-%H%M%S) .
    
    log_success "Docker镜像构建完成"
}

# 使用Docker Compose运行应用
docker_run() {
    log_info "启动Docker Compose服务..."
    
    check_command docker
    check_command docker-compose
    
    # 检查.env文件是否存在
    if [ ! -f .env ]; then
        log_warning ".env文件不存在，创建示例配置文件"
        cp .env.example .env
        log_warning "请编辑.env文件配置您的环境变量"
    fi
    
    # 启动服务
    docker-compose up -d
    
    log_success "Docker Compose服务已启动"
    echo ""
    echo "访问地址:"
    echo "  - 应用前端: http://localhost:3000"
    echo "  - 应用API: http://localhost:8081"
    echo "  - API文档: http://localhost:8081/api"
    echo "  - Grafana监控: http://localhost:3001 (用户名: admin, 密码: admin)"
    echo "  - Prometheus: http://localhost:9090"
    echo ""
    echo "查看日志: docker-compose logs -f"
    echo "停止服务: ./deploy.sh docker-stop"
}

# 停止Docker Compose服务
docker_stop() {
    log_info "停止Docker Compose服务..."
    
    docker-compose down
    
    log_success "Docker Compose服务已停止"
}

# 清理Docker资源
docker_clean() {
    log_info "清理Docker资源..."
    
    # 停止并删除容器
    docker-compose down -v
    
    # 删除未使用的镜像
    docker image prune -f
    
    # 删除未使用的卷
    docker volume prune -f
    
    log_success "Docker资源已清理"
}

# 部署到Kubernetes
k8s_deploy() {
    log_info "部署到Kubernetes..."
    
    check_command kubectl
    
    # 创建命名空间
    kubectl apply -f k8s/namespace.yml
    
    # 创建ConfigMap
    kubectl apply -f k8s/configmap.yml
    
    # 创建Secret（注意：实际生产环境应该使用安全的Secret管理）
    kubectl apply -f k8s/secret.yml
    
    # 创建部署
    kubectl apply -f k8s/deployment.yml
    
    # 创建服务
    kubectl apply -f k8s/service.yml
    
    # 等待部署完成
    log_info "等待部署完成..."
    kubectl rollout status deployment/aicreateproject-deployment -n aicreateproject --timeout=300s
    
    log_success "Kubernetes部署完成"
    
    # 显示服务信息
    echo ""
    echo "Kubernetes部署状态:"
    kubectl get all -n aicreateproject
    echo ""
    echo "获取服务访问地址:"
    echo "  kubectl get svc aicreateproject-loadbalancer -n aicreateproject"
}

# 从Kubernetes删除部署
k8s_delete() {
    log_info "从Kubernetes删除部署..."
    
    check_command kubectl
    
    kubectl delete -f k8s/service.yml --ignore-not-found
    kubectl delete -f k8s/deployment.yml --ignore-not-found
    kubectl delete -f k8s/secret.yml --ignore-not-found
    kubectl delete -f k8s/configmap.yml --ignore-not-found
    kubectl delete -f k8s/namespace.yml --ignore-not-found
    
    log_success "Kubernetes部署已删除"
}

# 查看Kubernetes部署状态
k8s_status() {
    log_info "Kubernetes部署状态:"
    
    check_command kubectl
    
    echo "命名空间:"
    kubectl get ns aicreateproject
    
    echo ""
    echo "部署状态:"
    kubectl get all -n aicreateproject
    
    echo ""
    echo "Pod详情:"
    kubectl get pods -n aicreateproject -o wide
    
    echo ""
    echo "服务详情:"
    kubectl get svc -n aicreateproject
    
    echo ""
    echo "事件:"
    kubectl get events -n aicreateproject --sort-by='.lastTimestamp'
}

# 启动监控服务
monitoring() {
    log_info "启动监控服务..."
    
    # 使用Docker Compose启动监控服务
    docker-compose -f docker-compose.monitoring.yml up -d
    
    log_success "监控服务已启动"
    echo ""
    echo "监控服务访问地址:"
    echo "  - Grafana: http://localhost:3001 (用户名: admin, 密码: admin)"
    echo "  - Prometheus: http://localhost:9090"
    echo "  - AlertManager: http://localhost:9093"
    echo "  - Node Exporter: http://localhost:9100"
}

# 完整部署流程
full_deploy() {
    log_info "开始完整部署流程..."
    
    # 1. 构建Docker镜像
    docker_build
    
    # 2. 部署到Kubernetes
    k8s_deploy
    
    # 3. 启动监控服务
    monitoring
    
    log_success "完整部署流程完成"
    echo ""
    echo "部署总结:"
    echo "  - 应用已部署到Kubernetes集群"
    echo "  - 监控服务已启动"
    echo "  - 可以使用Jenkins进行CI/CD"
    echo ""
    echo "下一步:"
    echo "  1. 配置Jenkins流水线"
    echo "  2. 设置Git Webhook"
    echo "  3. 配置监控告警"
}

# 主函数
main() {
    case "$1" in
        "docker-build")
            docker_build
            ;;
        "docker-run")
            docker_run
            ;;
        "docker-stop")
            docker_stop
            ;;
        "docker-clean")
            docker_clean
            ;;
        "k8s-deploy")
            k8s_deploy
            ;;
        "k8s-delete")
            k8s_delete
            ;;
        "k8s-status")
            k8s_status
            ;;
        "monitoring")
            monitoring
            ;;
        "all")
            full_deploy
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "未知选项: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
if [ $# -eq 0 ]; then
    show_help
    exit 0
fi

main "$1"