# VoxFlow

VoxFlow是一款基于Next.js和SiliconFlow API的语音转录工具，支持录制或上传音频进行转录，并提供高级音频切片和字幕导出功能。

![683b30c51a84b.png](https://img-cdn.ccrui.cn/2025/06/01/683b30c51a84b.png)
![683b30f7c4304.png](https://img-cdn.ccrui.cn/2025/06/01/683b30f7c4304.png)

## 功能特色

- **语音录制与上传**：支持麦克风录音和本地音频文件上传
- **智能切片转录**：基于静音检测自动分割长音频，并发处理提升效率
- **字幕导出**：支持SRT和VTT格式，提供精确时间戳
- **双重认证**：支持服务器API密钥和个人API密钥两种方式
- **中文优化**：全面支持中文语音识别和界面

## 快速开始

### 本地开发

```bash
# 克隆项目
git clone https://github.com/cr-zhichen/vox-flow.git
cd vox-flow

# 安装依赖
pnpm install

# 配置环境变量 (.env.local)
SILICONFLOW_API_KEY=your_api_key_here
AUTH_PASSWORD=your_password_here

# 启动开发服务器
pnpm run dev
```

### Docker 部署

**方式一：使用预构建镜像（推荐）**

```bash
# 创建工作目录
mkdir vox-flow && cd vox-flow

# 创建 docker-compose.yml
cat > docker-compose.yml << EOF
version: '3.8'
services:
  web:
    image: ghcr.io/cr-zhichen/vox-flow:latest
    ports:
      - "3000:3000"
    environment:
      - SILICONFLOW_API_KEY=your_api_key_here
      - AUTH_PASSWORD=your_password_here
    restart: unless-stopped
EOF

# 启动服务
docker-compose up -d
```

**方式二：本地构建**

```bash
# 克隆项目并构建
git clone https://github.com/cr-zhichen/vox-flow.git
cd vox-flow
docker-compose up --build -d
```

## 使用说明

### 认证方式
- **服务器API密钥**：管理员配置，用户通过密码使用
- **个人API密钥**：用户自行输入SiliconFlow API密钥

### 转录流程
1. **基础转录**：录制/上传音频 → 直接转录
2. **高级转录**：上传音频 → 智能切片 → 批量转录 → 导出字幕

访问 `http://localhost:3000` 开始使用。

## 技术栈

- Next.js 15 + TailwindCSS + Radix UI
- SiliconFlow API + Web Audio API