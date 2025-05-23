# 使用官方 Node.js LTS 镜像
FROM node:18-slim

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
