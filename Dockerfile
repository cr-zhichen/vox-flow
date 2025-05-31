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

# 构建应用 - 注意：不在构建时设置环境变量
RUN pnpm build

# 创建一个新的阶段用于生产环境
FROM node:18-alpine AS production

WORKDIR /app

# 安装 dumb-init 用于正确处理信号
RUN apk add --no-cache dumb-init

# 创建非root用户以提高安全性
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制 standalone 输出和所有必要文件
COPY --from=base --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=base --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=base --chown=nextjs:nodejs /app/public ./public

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 设置环境变量以确保Next.js能够正确读取运行时环境变量
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 使用 dumb-init 和正确的启动命令
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"] 