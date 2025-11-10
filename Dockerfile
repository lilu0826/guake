# 使用官方的 Node.js 镜像作为基础镜像
FROM node:22.12.0-alpine3.20

# 安装 ca-certificates
RUN apk add --no-cache ca-certificates && update-ca-certificates

# 设置时区
RUN apk add --no-cache tzdata \
    && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/timezone \
    && apk del tzdata

# 安装编译 canvas 所需依赖
RUN apk add --no-cache \
    build-base \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    librsvg-dev \
    python3

# 创建工作目录
WORKDIR /app

# 拷贝依赖文件并安装
COPY package*.json ./
RUN npm install

# 拷贝源代码
COPY . .

# 暴露端口（如果你使用 8081 端口）
EXPOSE 8081

# 启动应用
CMD ["node", "index.js"]
