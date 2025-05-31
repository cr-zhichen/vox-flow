# 使用官方 Node.js 镜像作为基础镜像
FROM node:18-alpine AS base

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm && npm cache clean --force

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile && pnpm store prune

# 复制项目代码
COPY . .

# 构建应用
RUN pnpm build

# 创建一个新的阶段用于生产环境
FROM node:18-alpine AS production

WORKDIR /app

# 安装 dumb-init 用于正确处理信号
RUN apk add --no-cache dumb-init

# 复制 standalone 输出和所有必要文件
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public

# 暴露端口
EXPOSE 3000

# 使用 dumb-init 和正确的启动命令
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"] 