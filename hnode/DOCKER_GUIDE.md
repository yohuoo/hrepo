# Docker 部署指南

## 🐳 快速启动

### 一键启动（推荐）

```bash
./start.sh
```

### 手动启动

```bash
# 1. 确保.env文件已配置
cp env.example .env
vim .env  # 修改配置

# 2. 启动所有服务
docker-compose up -d

# 3. 查看服务状态
docker-compose ps

# 4. 查看日志
docker-compose logs -f
```

## 📦 服务说明

### 包含的服务

| 服务 | 容器名 | 端口 | 说明 |
|------|--------|------|------|
| postgres | hnode_postgres | 5432 | PostgreSQL 15数据库 |
| redis | hnode_redis | 6379 | Redis缓存 |
| app | hnode_app | 8000 | Node.js应用 |

### 自动初始化

首次启动时会自动执行：

1. ✅ 运行数据库迁移脚本（`migrations/init.sql`）
2. ✅ 创建所有数据表
3. ✅ 创建索引和约束
4. ✅ 启动应用服务

## 🔧 常用命令

### 服务管理

```bash
# 启动所有服务
docker-compose up -d

# 启动特定服务
docker-compose up -d postgres redis

# 停止所有服务
docker-compose down

# 停止并删除数据卷（慎用，会删除数据）
docker-compose down -v

# 重启服务
docker-compose restart app

# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f redis
```

### 数据库操作

```bash
# 进入PostgreSQL容器
docker exec -it hnode_postgres psql -U user -d hrepo_db

# 在容器内查看表
\dt

# 在容器内查看表结构
\d table_name

# 从宿主机执行SQL
docker exec -i hnode_postgres psql -U user -d hrepo_db << EOF
SELECT * FROM users LIMIT 5;
EOF

# 备份数据库
docker exec hnode_postgres pg_dump -U user hrepo_db > backup.sql

# 恢复数据库
docker exec -i hnode_postgres psql -U user -d hrepo_db < backup.sql
```

### 应用管理

```bash
# 进入应用容器
docker exec -it hnode_app sh

# 查看应用日志
docker-compose logs -f app

# 重新构建镜像
docker-compose build --no-cache app

# 重启应用（不影响数据库）
docker-compose restart app
```

## 🔍 故障排查

### 数据库连接失败

```bash
# 检查数据库容器状态
docker-compose ps postgres

# 查看数据库日志
docker-compose logs postgres

# 测试数据库连接
docker exec hnode_postgres pg_isready -U user

# 重启数据库
docker-compose restart postgres
```

### 应用无法启动

```bash
# 查看应用日志
docker-compose logs app

# 检查环境变量
docker exec hnode_app env | grep DB_

# 进入容器调试
docker exec -it hnode_app sh
node src/app.js
```

### 端口被占用

```bash
# 查找占用8000端口的进程
lsof -i:8000

# 杀掉进程
kill -9 <PID>

# 或修改docker-compose.yml中的端口映射
ports:
  - "8001:8000"  # 改为8001
```

## 📊 数据持久化

### 数据卷

```bash
# 查看所有数据卷
docker volume ls

# 查看特定数据卷信息
docker volume inspect hnode_postgres_data

# 备份数据卷
docker run --rm -v hnode_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .

# 恢复数据卷
docker run --rm -v hnode_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /data
```

## 🚀 生产环境部署

### 环境变量配置

生产环境需要修改以下配置：

```env
# 修改为生产环境
NODE_ENV=production

# 使用强密码
DB_PASSWORD=<strong_password>
JWT_SECRET=<random_secret_key>

# 配置真实的API密钥
OPENAI_API_KEY=<your_api_key>
HUNTER_API_KEY=<your_api_key>
```

### 安全建议

1. ✅ 修改数据库默认密码
2. ✅ 使用随机JWT密钥
3. ✅ 配置防火墙规则
4. ✅ 启用HTTPS
5. ✅ 定期备份数据
6. ✅ 监控日志和性能

## 📝 完整示例

```bash
# 1. 克隆项目
git clone <repository>
cd hnode

# 2. 配置环境变量
cp env.example .env
vim .env

# 3. 启动服务
./start.sh

# 4. 验证服务
curl http://localhost:8000/

# 5. 注册用户
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "your_password"
  }'

# 6. 登录获取token
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your_password"
  }'

# 7. 使用token访问API
curl -X GET "http://localhost:8000/api/contacts/" \
  -H "Authorization: Bearer <your_token>"
```

## 🛑 清理

```bash
# 停止所有服务
docker-compose down

# 删除所有数据（慎用）
docker-compose down -v

# 删除镜像
docker rmi hnode-app
```
