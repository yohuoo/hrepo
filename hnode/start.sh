#!/bin/bash

echo "🚀 启动HNode服务..."

# 检查.env文件
if [ ! -f .env ]; then
    echo "⚠️  .env文件不存在，从env.example复制..."
    cp env.example .env
    echo "⚠️  请修改.env文件中的配置后再启动"
    exit 1
fi

# 检查必要的环境变量
echo "🔍 检查环境配置..."
source .env

# 检查关键配置项
MISSING_CONFIG=0

if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your-super-secret-jwt-key-change-this-in-production" ]; then
    echo "❌ JWT_SECRET 未配置或使用默认值，请修改 .env 文件"
    MISSING_CONFIG=1
fi

if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "your-openai-api-key" ]; then
    echo "⚠️  OPENAI_API_KEY 未配置，AI功能将不可用"
fi

if [ $MISSING_CONFIG -eq 1 ]; then
    echo ""
    echo "❌ 存在必须配置的项，请修改 .env 文件后重新启动"
    exit 1
fi

echo "✅ 环境配置检查通过"

# 停止旧容器
echo "🛑 停止旧容器..."
docker-compose down

# 构建并启动服务
echo "🔨 构建Docker镜像..."
docker-compose build

echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose ps

echo ""
echo "✅ 服务启动完成！"
echo "📍 API地址: http://localhost:8000"
echo "📊 查看日志: docker-compose logs -f app"
echo "🛑 停止服务: docker-compose down"
