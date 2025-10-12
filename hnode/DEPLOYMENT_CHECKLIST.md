# 🚀 HNode CRM 部署检查清单

## ✅ 自动化部署说明

当你运行 `./start.sh` 或 `docker-compose up -d` 后，系统会**自动完成**以下操作：

### 1️⃣ 自动创建数据库表（17张表）

PostgreSQL容器启动时会自动执行 `migrations/init.sql`，创建：

**用户与组织（2张表）**
- ✅ `departments` - 部门表（支持多级）
- ✅ `users` - 用户表

**客户管理（4张表）**
- ✅ `contacts` - 联系人表
- ✅ `contact_tags` - 联系人标签表
- ✅ `customers` - 客户表
- ✅ `customer_analysis` - 客户AI分析表

**邮件系统（3张表）**
- ✅ `email_templates` - 邮件模板表
- ✅ `user_email_bindings` - 用户邮箱绑定表
- ✅ `email_history` - 邮件往来记录表

**会议管理（1张表）**
- ✅ `zoom_meetings` - 视频会议表

**销售与合同（2张表）**
- ✅ `sales_records` - 销售记录表
- ✅ `contracts` - 合同表

**数据分析（2张表）**
- ✅ `reports` - 数据报告表
- ✅ `case_studies` - 案例总结表

**权限系统（3张表）**
- ✅ `pages` - 页面定义表
- ✅ `page_permissions` - 页面权限表
- ✅ `permission_audit_logs` - 权限审计日志表

### 2️⃣ 自动插入初始数据

- ✅ **默认超级管理员账号**
  - 用户名: `admin`
  - 密码: `Admin123456`
  - 邮箱: `admin@workwith.cn`
  - 角色: `super_admin`

- ✅ **80+ 个页面权限定义**
  - 所有菜单和页面
  - 所有操作权限（查看、新增、编辑、删除等）

- ✅ **默认权限配置**
  - 新创建的部门和用户默认拥有所有权限
  - 可通过"页面权限"管理页面调整

### 3️⃣ 自动启动服务

Docker Compose 会按顺序启动：

1. **PostgreSQL** - 等待健康检查通过
2. **Redis** - 等待健康检查通过
3. **Node.js应用** - 在数据库和Redis就绪后启动

---

## 📝 部署前检查清单

### 必须配置项 ❗

在 `.env` 文件中，以下配置**必须修改**：

- [ ] `JWT_SECRET` - JWT密钥（至少32位随机字符串）
  ```env
  JWT_SECRET=your-32-char-random-secret-key-here
  ```

### 推荐配置项 ⭐

- [ ] `OPENAI_API_KEY` - OpenAI API密钥（用于AI功能）
  ```env
  OPENAI_API_KEY=sk-your-openai-api-key
  ```

- [ ] `DB_PASSWORD` - 数据库密码（生产环境建议修改）
  ```env
  DB_PASSWORD=your-strong-password
  ```

### 可选配置项

- [ ] `REDIS_PASSWORD` - Redis密码
- [ ] `HUNTER_API_KEY` - Hunter.io API密钥（用于邮箱搜索）
- [ ] `SMTP_*` - SMTP邮件配置（用于发送邮件）

---

## 🔧 快速部署步骤

### 方式1：使用启动脚本（推荐）

```bash
# 1. 进入项目目录
cd hnode

# 2. 复制并编辑环境变量
cp env.example .env
nano .env  # 或使用其他编辑器

# 3. 一键启动（会自动检查配置）
./start.sh
```

### 方式2：使用Docker Compose

```bash
# 1. 进入项目目录
cd hnode

# 2. 确保.env文件已配置
cp env.example .env
# 编辑.env文件

# 3. 启动服务
docker-compose up -d

# 4. 查看日志
docker-compose logs -f app
```

---

## 🎯 启动后验证

### 1. 检查服务状态

```bash
docker-compose ps
```

应该看到3个服务都在运行：
- `hnode_postgres` - PostgreSQL数据库
- `hnode_redis` - Redis缓存
- `hnode_app` - Node.js应用

### 2. 检查日志

```bash
# 查看应用日志
docker-compose logs -f app

# 应该看到类似输出：
# ✅ 数据库连接成功
# ✅ Redis连接成功
# 🚀 服务器启动成功: http://0.0.0.0:8000
```

### 3. 访问系统

打开浏览器访问：`http://localhost:8000`

使用默认账号登录：
- 用户名: `admin`
- 密码: `Admin123456`

### 4. 验证功能

登录后检查：
- [ ] 能否访问控制台页面
- [ ] 侧边栏菜单是否正常显示
- [ ] 能否创建联系人
- [ ] 能否访问系统设置

---

## 🔄 重新部署

如果需要重新部署（清空所有数据）：

```bash
# 停止并删除所有容器和数据卷
docker-compose down -v

# 重新启动（会自动重新初始化数据库）
./start.sh
```

⚠️ **注意**：`-v` 参数会删除所有数据，包括数据库数据！

---

## 🐛 常见问题

### Q1: 启动失败，提示端口被占用

**解决方案**：
```bash
# 检查端口占用
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :8000  # 应用

# 停止占用端口的进程，或修改docker-compose.yml中的端口映射
```

### Q2: 数据库连接失败

**原因**：数据库还未完全启动

**解决方案**：
```bash
# 等待30秒后重启应用容器
docker-compose restart app

# 或查看数据库日志
docker-compose logs postgres
```

### Q3: 页面提示"未授权"或"无权限"

**原因**：权限配置问题

**解决方案**：
1. 使用 `admin` 账号登录
2. 进入"系统设置" → "页面权限"
3. 为用户或部门分配权限

### Q4: AI功能不可用

**原因**：未配置 `OPENAI_API_KEY`

**解决方案**：
1. 在 `.env` 文件中添加：
   ```env
   OPENAI_API_KEY=sk-your-key
   ```
2. 重启服务：
   ```bash
   docker-compose restart app
   ```

### Q5: 邮件功能不可用

**原因**：未配置SMTP或邮箱绑定

**解决方案**：
1. 登录系统
2. 进入"系统设置" → "邮箱配置"
3. 添加邮箱账号（如263邮箱）

---

## 📊 部署架构图

```
┌─────────────────────────────────────────────┐
│         Docker Compose                       │
│                                              │
│  ┌──────────────┐  ┌──────────────┐        │
│  │  PostgreSQL  │  │    Redis     │        │
│  │   (5432)     │  │   (6379)     │        │
│  └──────┬───────┘  └──────┬───────┘        │
│         │                 │                 │
│         └────────┬────────┘                 │
│                  │                          │
│         ┌────────▼────────┐                 │
│         │  Node.js App    │                 │
│         │    (8000)       │                 │
│         └─────────────────┘                 │
│                  │                          │
└──────────────────┼──────────────────────────┘
                   │
                   ▼
            浏览器访问
         http://localhost:8000
```

---

## 📚 相关文档

- **主要文档**: [README.md](README.md)
- **新功能指南**: [NEW_FEATURES_GUIDE.md](NEW_FEATURES_GUIDE.md)
- **API文档**: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Docker指南**: [DOCKER_GUIDE.md](DOCKER_GUIDE.md)

---

## 🔒 安全建议

### 生产环境部署

1. **修改所有默认密码**
   - 数据库密码
   - Redis密码（如果启用）
   - 管理员账号密码

2. **配置HTTPS**
   - 使用Nginx反向代理
   - 配置SSL证书

3. **限制网络访问**
   - 数据库和Redis不对外暴露
   - 使用防火墙规则

4. **定期备份**
   ```bash
   # 备份数据库
   docker exec hnode_postgres pg_dump -U user hrepo_db > backup.sql
   
   # 备份上传文件
   tar -czf uploads_backup.tar.gz uploads/
   ```

5. **配置日志轮转**
   - 使用Docker日志驱动
   - 配置日志大小限制

---

## ✅ 总结

执行 `./start.sh` 或 `docker-compose up -d` 后，系统会：

✅ **自动创建**所有数据库表（17张）  
✅ **自动插入**初始数据（管理员账号+权限配置）  
✅ **自动启动**所有服务（数据库、缓存、应用）  
✅ **自动检查**依赖服务健康状态  

你只需要：
1. 配置 `.env` 文件（至少配置 `JWT_SECRET`）
2. 运行启动脚本
3. 使用默认账号登录

**首次登录后请立即修改默认密码！**

