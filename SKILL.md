---
name: cline-dev
description: Cline开发助手的工作规范。当用户使用Cline进行开发时使用此skill。包含语言偏好、Docker配置、WSL集成和网络代理处理等关键要求。
---

# Cline开发规范

此skill定义了Cline在为用户开发时必须遵循的核心规范和最佳实践。

## 核心要求

### 1. 语言交流
**始终使用中文与用户交流**
- 所有响应、说明、错误信息都用中文
- 代码注释使用中文
- 文档和README使用中文
- 变量名和函数名可以使用英文（遵循编程规范），但必须添加中文注释说明

示例：
```python
# 用户认证服务
class UserAuthService:
    def authenticate_user(self, username, password):
        """
        验证用户身份
        
        参数：
            username: 用户名
            password: 密码
        
        返回：
            bool: 验证是否成功
        """
        pass
```

### 2. Docker依赖管理
**从WSL导出依赖，而不是从网络下载**

当需要设置Docker容器依赖时：

#### 方法A：导出WSL包列表
```bash
# 在WSL中导出已安装的包列表
dpkg --get-selections > packages.list
# 或者导出特定包的版本信息
dpkg -l > packages-detailed.list
```

#### 方法B：使用本地包缓存
```dockerfile
# 在Dockerfile中，优先使用本地缓存
COPY packages.list /tmp/
RUN dpkg --set-selections < /tmp/packages.list && apt-get dselect-upgrade -y
```

#### 方法C：离线包安装
```bash
# 从WSL下载.deb包
apt-get download <package-name>
# 在Dockerfile中使用本地.deb文件
COPY *.deb /tmp/
RUN dpkg -i /tmp/*.deb
```

**关键原则：**
- 优先询问用户是否可以从WSL导出包列表或.deb文件
- 避免在Dockerfile中直接 `apt-get install` 从网络下载
- 如果必须从网络安装，先询问用户确认

### 3. Docker系统选择
**Docker基础镜像应与WSL系统保持一致**

实施步骤：

#### 步骤1：检测WSL系统版本
```bash
# 询问用户或检测WSL系统
lsb_release -a
# 或
cat /etc/os-release
```

#### 步骤2：选择匹配的Docker镜像
如果WSL是Ubuntu 22.04，使用：
```dockerfile
FROM ubuntu:22.04
```

如果WSL是Debian 11，使用：
```dockerfile
FROM debian:11
```

#### 步骤3：说明理由
在与用户交流时说明：
- "我检测到您的WSL系统是 [系统版本]"
- "为了避免部署问题，我将使用相同版本的Docker基础镜像"
- "这样可以确保依赖包版本一致，减少兼容性问题"

**好处：**
- 减少库版本不匹配问题
- 确保开发环境和容器环境一致
- 简化依赖管理和故障排查

### 4. 网络代理处理
**用户长期使用代理，网络问题时优先考虑代理因素**

#### 常见症状和诊断

当遇到以下问题时，首先考虑代理：
- 连接超时
- DNS解析失败
- SSL证书错误
- 包下载失败
- Git克隆/推送失败

#### 诊断步骤

```bash
# 1. 检查代理环境变量
echo $HTTP_PROXY
echo $HTTPS_PROXY
echo $NO_PROXY

# 2. 测试网络连接
curl -I https://www.google.com
curl -I --noproxy "*" https://www.google.com

# 3. 检查Docker代理配置
cat ~/.docker/config.json
```

#### 解决方案模板

**方案1：为Docker配置代理**
```bash
# 创建Docker代理配置
mkdir -p ~/.docker
cat > ~/.docker/config.json <<EOF
{
  "proxies": {
    "default": {
      "httpProxy": "http://proxy.example.com:8080",
      "httpsProxy": "http://proxy.example.com:8080",
      "noProxy": "localhost,127.0.0.1"
    }
  }
}
EOF
```

**方案2：为Git配置代理**
```bash
git config --global http.proxy http://proxy.example.com:8080
git config --global https.proxy http://proxy.example.com:8080
```

**方案3：在Dockerfile中设置代理**
```dockerfile
# 构建时使用代理
ARG HTTP_PROXY
ARG HTTPS_PROXY
ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}
```

#### 与用户沟通时

遇到网络错误时，使用以下模板：
```
我注意到出现了[具体错误]。由于您长期使用代理，这可能是代理配置导致的。

让我们检查几个方面：
1. [诊断步骤1]
2. [诊断步骤2]

可能的解决方案：
- [方案A]
- [方案B]

您当前使用的代理地址是什么？这样我可以帮您正确配置。
```

## 工作流程

### 新项目开始时
1. 询问用户WSL系统版本
2. 询问是否需要Docker容器
3. 如果需要Docker，确认：
   - 基础镜像版本（与WSL一致）
   - 是否可以从WSL导出依赖
   - 代理配置（如果需要网络访问）

### 遇到问题时
1. 首先用中文清晰说明问题
2. 如果是网络相关，优先考虑代理
3. 提供多个解决方案供用户选择
4. 说明每个方案的优缺点

### 代码交付时
1. 所有说明文档用中文
2. 添加充分的中文注释
3. 如果有Docker，确认配置符合上述要求
4. 提供故障排查指南（中文）

## 示例场景

### 场景1：创建Python项目with Docker

**错误做法：**
```dockerfile
FROM python:3.9
RUN apt-get update && apt-get install -y some-package
```

**正确做法：**
```dockerfile
# 用户WSL是Ubuntu 22.04，所以使用相同版本
FROM ubuntu:22.04

# 从WSL导出的包列表安装依赖
COPY packages.deb /tmp/
RUN dpkg -i /tmp/packages.deb

# 安装Python（如果WSL中已有，使用相同版本）
RUN apt-get update && apt-get install -y python3.10
```

并用中文说明：
"我检测到您的WSL是Ubuntu 22.04，因此使用了相同的基础镜像。请将您需要的依赖包从WSL导出为.deb文件，我会在Docker中安装。"

### 场景2：处理网络错误

```
用户：Git克隆失败了

Cline响应：
我看到Git克隆失败了。由于您长期使用代理，这很可能是代理配置问题。

让我帮您诊断：
1. 首先检查当前代理设置
2. 测试直连和代理连接的区别

请告诉我：
- 您的代理地址是什么？（例如：http://127.0.0.1:7890）
- 是否需要为Git单独配置代理？

我可以帮您配置好代理设置，确保Git正常工作。
```

## 关键提醒

✅ **始终做的事：**
- 用中文交流
- Docker基础镜像与WSL版本一致
- 优先使用WSL导出的依赖
- 网络问题时考虑代理

❌ **避免做的事：**
- 用英文回复用户
- 随意选择Docker镜像版本
- 直接从网络下载大量依赖
- 忽略代理配置的影响

## 总结

此skill的核心是为用户提供：
1. **舒适的中文交流体验**
2. **与WSL环境一致的Docker配置**
3. **高效的离线依赖管理**
4. **可靠的代理网络支持**

遵循这些原则，Cline将能够为用户提供更稳定、更符合其工作环境的开发支持。
