# VoxFlow - 语音转文字应用

VoxFlow是一个基于Next.js构建的语音转文字应用，使用了SiliconFlow API进行语音识别。该应用允许用户通过录制或上传音频文件，将语音内容转换为文字。

![VoxFlow应用截图]

## 功能特点

- **语音录制**：直接使用麦克风录制音频进行转写
- **音频上传**：上传已有的音频文件进行转写
- **双重认证方式**：
  - 使用服务器API密钥（通过密码验证）
  - 使用个人API密钥（本地存储）
- **现代UI界面**：基于TailwindCSS和Radix UI构建的友好用户界面
- **中文支持**：完全支持中文语音识别和界面

## 技术栈

- **前端框架**：Next.js 15
- **UI组件**：Radix UI组件库
- **样式**：TailwindCSS
- **语音API**：SiliconFlow API
- **服务端功能**：Next.js Server Actions

## 安装步骤

1. 克隆仓库：

```bash
git clone https://github.com/yourusername/vox-flow.git
cd vox-flow
```

2. 安装依赖：

```bash
# 使用npm
npm install

# 或使用yarn
yarn install

# 或使用pnpm
pnpm install
```

3. 配置环境变量：

在项目根目录创建`.env.local`文件，添加以下内容：

```
# 可选：配置服务器端API密钥
SILICONFLOW_API_KEY=your_api_key_here

# 可选：如果使用密码保护API密钥，设置密码
AUTH_PASSWORD=your_password_here
```

4. 运行开发服务器：

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

5. 打开浏览器访问 `http://localhost:3000`

## 使用说明

### 认证方式

应用支持两种使用方式：

1. **服务器API密钥（推荐）**：
   - 管理员配置服务器环境变量`SILICONFLOW_API_KEY`
   - 用户通过密码验证后，使用服务器API密钥
   - 密码验证通过后，所有API请求使用服务器端密钥

2. **本地API密钥**：
   - 用户输入自己的SiliconFlow API密钥
   - 密钥安全存储在浏览器本地存储中
   - 所有API请求使用用户提供的密钥

### 语音转写

1. **录制音频**：
   - 点击"录制音频"标签
   - 点击"开始录制"按钮进行录音
   - 点击"停止录制"结束录音
   - 点击"转录音频"将录音发送到API进行转写

2. **上传音频**：
   - 点击"上传音频"标签
   - 点击"选择音频文件"按钮选择音频文件
   - 选择文件后点击"转录音频"按钮进行转写

### 转写结果

转写完成后，结果将显示在页面上，用户可以：
- 阅读转写文本
- 复制转写内容到剪贴板

## 开发指南

### 项目结构

```
/
├── app/                  # Next.js应用目录
│   ├── api/              # API路由
│   ├── actions.ts        # 服务器端动作
│   ├── globals.css       # 全局样式
│   ├── layout.tsx        # 应用布局
│   └── page.tsx          # 主页
├── components/           # React组件
│   ├── ui/               # UI组件
│   ├── audio-recorder.tsx  # 音频录制组件
│   ├── audio-uploader.tsx  # 音频上传组件
│   ├── auth-dialog.tsx     # 认证对话框
│   └── ...
├── lib/                  # 工具函数和库
│   ├── auth.ts           # 认证相关函数
│   └── utils.ts          # 通用工具函数
├── public/               # 静态资源
├── styles/               # 样式文件
└── ...                   # 配置文件等
```

### 自定义和扩展

1. **修改UI**：
   - UI组件基于TailwindCSS和Radix UI
   - 可以通过编辑`tailwind.config.ts`自定义主题

2. **添加更多功能**：
   - 可以扩展`actions.ts`添加更多服务器端功能
   - 在`components`目录下添加新组件