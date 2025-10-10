FROM node:18-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm install --production

# 复制源代码
COPY . .

# 创建上传目录
RUN mkdir -p /app/uploads/videos

# 暴露端口
EXPOSE 8000

# 启动应用
CMD ["node", "src/app.js"]
