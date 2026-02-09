pipeline {
    agent any
    
    environment {
        // Docker配置
        DOCKER_REGISTRY = 'your-docker-registry.com'
        DOCKER_IMAGE_NAME = 'aicreateproject'
        DOCKER_TAG = "${env.BUILD_NUMBER}"
        
        // Kubernetes配置
        K8S_NAMESPACE = 'aicreateproject'
        K8S_CONFIG_PATH = './k8s'
        
        // 代码质量工具
        SONAR_HOST_URL = 'http://sonarqube:9000'
        SONAR_PROJECT_KEY = 'AICreateProject'
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }
    
    stages {
        // 阶段1: 代码检查
        stage('代码检查') {
            steps {
                script {
                    echo '开始代码检查...'
                    
                    // 运行ESLint
                    sh 'npm run lint'
                    
                    // 运行单元测试
                    sh 'npm test'
                    
                    // 代码覆盖率检查
                    sh 'npm run test -- --coverage'
                }
            }
            
            post {
                success {
                    echo '代码检查通过'
                }
                failure {
                    error '代码检查失败，请修复问题后重试'
                }
            }
        }
        
        // 阶段2: SonarQube代码质量分析
        stage('SonarQube分析') {
            when {
                branch 'main'  // 只在主分支运行
            }
            steps {
                script {
                    echo '开始SonarQube代码质量分析...'
                    
                    // 安装SonarScanner
                    sh 'npm install -g sonarqube-scanner'
                    
                    // 运行SonarQube分析
                    withSonarQubeEnv('SonarQube') {
                        sh """
                        sonar-scanner \
                          -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                          -Dsonar.sources=. \
                          -Dsonar.host.url=${SONAR_HOST_URL} \
                          -Dsonar.login=${SONAR_AUTH_TOKEN} \
                          -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
                        """
                    }
                }
            }
        }
        
        // 阶段3: 构建Docker镜像
        stage('构建Docker镜像') {
            steps {
                script {
                    echo '开始构建Docker镜像...'
                    
                    // 构建Docker镜像
                    sh "docker build -t ${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${DOCKER_TAG} ."
                    
                    // 为latest标签也打上标签
                    sh "docker tag ${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${DOCKER_TAG} ${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:latest"
                    
                    echo "Docker镜像构建完成: ${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${DOCKER_TAG}"
                }
            }
        }
        
        // 阶段4: 安全扫描
        stage('安全扫描') {
            steps {
                script {
                    echo '开始安全扫描...'
                    
                    // 使用Trivy进行漏洞扫描
                    sh "docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image ${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${DOCKER_TAG}"
                    
                    // 使用Hadolint检查Dockerfile
                    sh 'docker run --rm -i hadolint/hadolint < Dockerfile'
                }
            }
        }
        
        // 阶段5: 推送Docker镜像
        stage('推送Docker镜像') {
            steps {
                script {
                    echo '开始推送Docker镜像到仓库...'
                    
                    // 登录Docker Registry
                    withCredentials([usernamePassword(
                        credentialsId: 'docker-registry-creds',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        sh "echo ${DOCKER_PASS} | docker login ${DOCKER_REGISTRY} -u ${DOCKER_USER} --password-stdin"
                    }
                    
                    // 推送镜像
                    sh "docker push ${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${DOCKER_TAG}"
                    sh "docker push ${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:latest"
                    
                    echo 'Docker镜像推送完成'
                }
            }
        }
        
        // 阶段6: 部署到开发环境
        stage('部署到开发环境') {
            when {
                branch 'develop'
            }
            steps {
                script {
                    echo '开始部署到开发环境...'
                    
                    // 更新Kubernetes部署文件中的镜像标签
                    sh "sed -i 's|aicreateproject:latest|${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${DOCKER_TAG}|g' ${K8S_CONFIG_PATH}/deployment.yml"
                    
                    // 部署到Kubernetes
                    withKubeConfig([credentialsId: 'k8s-cluster-creds', serverUrl: '']) {
                        sh "kubectl apply -f ${K8S_CONFIG_PATH}/namespace.yml"
                        sh "kubectl apply -f ${K8S_CONFIG_PATH}/configmap.yml"
                        sh "kubectl apply -f ${K8S_CONFIG_PATH}/secret.yml"
                        sh "kubectl apply -f ${K8S_CONFIG_PATH}/deployment.yml"
                        sh "kubectl apply -f ${K8S_CONFIG_PATH}/service.yml"
                        
                        // 等待部署完成
                        sh "kubectl rollout status deployment/aicreateproject-deployment -n ${K8S_NAMESPACE} --timeout=300s"
                    }
                    
                    echo '开发环境部署完成'
                }
            }
        }
        
        // 阶段7: 部署到生产环境
        stage('部署到生产环境') {
            when {
                branch 'main'
            }
            steps {
                input {
                    message "确认部署到生产环境？"
                    ok "确认部署"
                    parameters {
                        choice(
                            choices: ['是', '否'],
                            description: '确认部署到生产环境',
                            name: 'DEPLOY_TO_PROD'
                        )
                    }
                }
                
                script {
                    if (params.DEPLOY_TO_PROD == '是') {
                        echo '开始部署到生产环境...'
                        
                        // 更新Kubernetes部署文件中的镜像标签
                        sh "sed -i 's|aicreateproject:latest|${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${DOCKER_TAG}|g' ${K8S_CONFIG_PATH}/deployment.yml"
                        
                        // 部署到生产Kubernetes集群
                        withKubeConfig([credentialsId: 'k8s-prod-cluster-creds', serverUrl: '']) {
                            sh "kubectl apply -f ${K8S_CONFIG_PATH}/namespace.yml"
                            sh "kubectl apply -f ${K8S_CONFIG_PATH}/configmap.yml"
                            sh "kubectl apply -f ${K8S_CONFIG_PATH}/secret.yml"
                            sh "kubectl apply -f ${K8S_CONFIG_PATH}/deployment.yml"
                            sh "kubectl apply -f ${K8S_CONFIG_PATH}/service.yml"
                            
                            // 蓝绿部署策略
                            sh """
                            kubectl get deployment aicreateproject-deployment -n ${K8S_NAMESPACE} -o yaml > deployment-backup.yaml
                            kubectl rollout status deployment/aicreateproject-deployment -n ${K8S_NAMESPACE} --timeout=300s
                            """
                            
                            // 健康检查
                            sh "sleep 30"
                            sh "curl -f http://production-api.aicreateproject.com/health || (kubectl rollout undo deployment/aicreateproject-deployment -n ${K8S_NAMESPACE} && exit 1)"
                        }
                        
                        echo '生产环境部署完成'
                    } else {
                        echo '用户取消生产环境部署'
                    }
                }
            }
        }
        
        // 阶段8: 集成测试
        stage('集成测试') {
            steps {
                script {
                    echo '开始集成测试...'
                    
                    // 运行API测试
                    sh 'npm run test:integration'
                    
                    // 运行端到端测试
                    sh 'npm run test:e2e'
                    
                    echo '集成测试完成'
                }
            }
            
            post {
                success {
                    echo '集成测试通过'
                }
                failure {
                    echo '集成测试失败，开始回滚'
                    script {
                        // 自动回滚
                        withKubeConfig([credentialsId: 'k8s-cluster-creds', serverUrl: '']) {
                            sh "kubectl rollout undo deployment/aicreateproject-deployment -n ${K8S_NAMESPACE}"
                        }
                    }
                }
            }
        }
    }
    
    post {
        always {
            echo '流水线执行完成'
            
            // 清理工作空间
            cleanWs()
            
            // 发送通知
            emailext(
                subject: "构建通知: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: """
                项目: ${env.JOB_NAME}
                构建号: ${env.BUILD_NUMBER}
                状态: ${currentBuild.currentResult}
                持续时间: ${currentBuild.durationString}
                控制台输出: ${env.BUILD_URL}console
                """,
                to: 'dev-team@example.com',
                attachLog: true
            )
        }
        
        success {
            echo '流水线执行成功'
            
            // 更新部署状态看板
            sh 'curl -X POST https://status-dashboard.com/deploy/success -d "project=AICreateProject&version=${DOCKER_TAG}"'
        }
        
        failure {
            echo '流水线执行失败'
            
            // 更新部署状态看板
            sh 'curl -X POST https://status-dashboard.com/deploy/failure -d "project=AICreateProject&version=${DOCKER_TAG}"'
        }
        
        unstable {
            echo '流水线执行不稳定'
        }
    }
}