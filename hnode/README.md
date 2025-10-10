# HNode - 海外客户关系管理系统

一个基于 Node.js + Express + PostgreSQL + Redis 的智能客户关系管理系统，集成了 Hunter.io 联系人搜索、OpenAI 智能分析、邮件管理和视频会议分析等功能。

---

## 📋 目录

- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [启动方式](#启动方式)
- [访问地址](#访问地址)
- [默认账号](#默认账号)
- [常用命令](#常用命令)
- [项目结构](#项目结构)
- [API文档](#api文档)
- [常见问题](#常见问题)

---

## ✨ 功能特性

- 🌍 **海外客户搜索** - 基于关键词搜索潜在海外客户
- 👥 **联系人管理** - 集成 Hunter.io API 批量获取公司联系人
- 📧 **邮件管理** - 邮件模板、批量发送、收发件箱、邮件线程
- 🎥 **视频会议分析** - AI 自动转录和智能摘要生成
- 🤖 **客户智能分析** - 基于邮件和会议记录的 AI 客户画像分析
- 📊 **数据可视化** - 客户互动数据可视化展示
- 🔐 **安全认证** - JWT + Redis 会话管理

---

## 🛠 技术栈

- **后端框架**: Node.js 18 + Express.js
- **数据库**: PostgreSQL 15
- **缓存**: Redis 7
- **ORM**: Sequelize
- **模板引擎**: EJS
- **前端框架**: Bootstrap 5 + jQuery
- **AI 能力**: OpenAI API (GPT-4/GPT-5)
- **第三方服务**: Hunter.io API

---

## 📦 环境要求

### 必需软件

- **Node.js**: 18.x 或更高版本
- **Docker**: 20.x 或更高版本（推荐）
- **Docker Compose**: 2.x 或更高版本（推荐）

### 可选软件（本地开发）

如果不使用 Docker 完全运行，需要本地安装：
- **PostgreSQL**: 15.x 或更高版本
- **Redis**: 7.x 或更高版本

---

## 🚀 快速开始

### 第一步：克隆项目

```bash
git clone <your-repo-url>
cd hrepo/hnode
```

---

### 第二步：配置环境变量

#### 2.1 创建 `.env` 文件

```bash
cp env.example .env
```

#### 2.2 编辑 `.env` 文件

**最小必需配置：**

```bash
# ========== 数据库配置 ==========
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hrepo_db
DB_USER=user
DB_PASSWORD=password

# ========== Redis配置 ==========
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# ========== JWT配置 ==========
JWT_SECRET=your-very-long-and-secure-secret-key-here
JWT_EXPIRES_IN=7d

# ========== OpenAI配置 ==========
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4o
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=8000
OPENAI_BASE_URL=https://api.openai.com/v1

# ========== Hunter.io配置 ==========
HUNTER_API_KEY=your-hunter-api-key-here
HUNTER_BASE_URL=https://api.hunter.io/v2

# ========== 服务器配置 ==========
PORT=8000
NODE_ENV=development
HOST=0.0.0.0
```

---

## 🐳 启动方式

### 方式一：完全 Docker 启动（推荐）

**适用场景**：生产环境、快速部署、完整隔离

```bash
# 1. 确保已配置 .env 文件
cd hnode

# 2. 使用启动脚本（推荐）
./start.sh

# 或者手动启动
docker-compose up -d

# 3. 查看服务状态
docker-compose ps

# 4. 查看日志
docker-compose logs -f app
```

**服务说明：**
- `hnode_postgres` - PostgreSQL 数据库（端口：5432）
- `hnode_redis` - Redis 缓存（端口：6379）
- `hnode_app` - Node.js 应用（端口：8000）

---

### 方式二：混合启动（推荐开发）

**适用场景**：开发调试、快速迭代

#### 2.1 启动数据库和 Redis（Docker）

```bash
cd hnode

# 只启动数据库和Redis
docker-compose up -d postgres redis

# 验证服务状态
docker-compose ps
```

#### 2.2 本地启动 Node.js 应用

```bash
# 确保在 hnode 目录下
cd hnode

# 安装依赖（首次运行）
npm install

# 运行数据库迁移（首次运行或表结构变更后）
npm run migrate

# 启动应用
node src/app.js

# 或使用 nodemon 自动重启（开发环境）
npm install -g nodemon
nodemon src/app.js
```

**注意**：混合启动时，`.env` 中的配置应为：
```bash
DB_HOST=localhost      # ← Docker映射到宿主机的localhost
REDIS_HOST=localhost   # ← Docker映射到宿主机的localhost
```

---

### 方式三：完全本地启动（不推荐）

**前提**：本地已安装 PostgreSQL 和 Redis

```bash
# 1. 启动 PostgreSQL 和 Redis（根据您的安装方式）
# macOS Homebrew 示例：
brew services start postgresql
brew services start redis

# 2. 创建数据库
psql -U postgres -c "CREATE DATABASE hrepo_db;"

# 3. 运行迁移
npm run migrate

# 4. 启动应用
node src/app.js
```

---

## 🌐 访问地址

### 前端页面

启动成功后，访问以下地址：

| 页面 | 地址 | 说明 |
|------|------|------|
| 🏠 **登录页面** | http://127.0.0.1:8000/login | 首次访问的入口 |
| 📊 **控制台** | http://127.0.0.1:8000/dashboard | 搜索海外客户 |
| 👥 **联系人管理** | http://127.0.0.1:8000/contacts | 管理联系人 |
| 🏢 **客户管理** | http://127.0.0.1:8000/customers | 管理客户列表 |
| 📧 **写邮件** | http://127.0.0.1:8000/emails/compose | 撰写和发送邮件 |
| 📝 **邮件模板** | http://127.0.0.1:8000/emails/templates | 管理邮件模板 |
| 📤 **发件箱** | http://127.0.0.1:8000/emails/sent | 查看已发送邮件 |
| 📥 **收件箱** | http://127.0.0.1:8000/emails/inbox | 查看接收邮件 |
| 🎥 **会议记录** | http://127.0.0.1:8000/meetings | 视频会议管理 |
| ⚙️ **邮箱配置** | http://127.0.0.1:8000/settings/email | 配置发件邮箱 |

---

### API 端点

| 端点 | 地址 | 说明 |
|------|------|------|
| 🔐 **认证** | http://127.0.0.1:8000/api/auth | 登录、注册、登出 |
| 🌍 **海外搜索** | http://127.0.0.1:8000/api/companies | 搜索海外公司 |
| 👤 **联系人** | http://127.0.0.1:8000/api/contacts | 联系人CRUD |
| 🏢 **客户** | http://127.0.0.1:8000/api/customers | 客户CRUD |
| 📧 **邮件** | http://127.0.0.1:8000/api/emails | 邮件发送 |
| 📝 **邮件模板** | http://127.0.0.1:8000/api/email-templates | 模板管理 |
| 📨 **邮件历史** | http://127.0.0.1:8000/api/email-history | 收发件记录 |
| 🎥 **会议** | http://127.0.0.1:8000/api/zoom-meetings | 会议管理 |
| 🤖 **客户分析** | http://127.0.0.1:8000/api/customer-analysis | AI 分析 |
| 🔗 **Hunter.io** | http://127.0.0.1:8000/api/hunter | 联系人搜索 |

完整 API 文档请查看：[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

## 👤 默认账号

系统首次启动时会自动创建管理员账号：

```
用户名: admin
邮箱:   admin@workwith.cn
密码:   Admin123456
```

**安全提示**：⚠️ 首次登录后请立即修改密码！

---

## 📂 项目结构

```
hnode/
├── src/
│   ├── app.js                 # 主应用入口
│   ├── config/                # 配置文件
│   │   ├── config.js          # 应用配置
│   │   ├── database.js        # 数据库配置
│   │   └── redis.js           # Redis配置
│   ├── models/                # 数据模型
│   │   ├── User.js
│   │   ├── Customer.js
│   │   ├── Contact.js
│   │   ├── EmailTemplate.js
│   │   ├── EmailHistory.js
│   │   ├── ZoomMeeting.js
│   │   └── ...
│   ├── routes/                # 路由定义
│   │   ├── auth.js            # 认证路由
│   │   ├── customers.js       # 客户路由
│   │   ├── contacts.js        # 联系人路由
│   │   ├── emails.js          # 邮件路由
│   │   ├── views.js           # 前端页面路由
│   │   └── ...
│   ├── services/              # 业务逻辑
│   │   ├── HunterService.js   # Hunter.io 服务
│   │   ├── OpenAIService.js   # OpenAI 服务
│   │   ├── EmailSendingService.js  # 邮件服务
│   │   ├── ZoomService.js     # 会议服务
│   │   └── ...
│   ├── middleware/            # 中间件
│   │   ├── auth.js            # 认证中间件
│   │   └── upload.js          # 文件上传中间件
│   └── scripts/               # 脚本工具
│       └── migrate.js         # 数据库迁移脚本
├── views/                     # EJS 模板
│   ├── layouts/
│   │   └── main.ejs           # 主布局
│   ├── partials/
│   │   ├── navbar.ejs         # 导航栏
│   │   └── sidebar.ejs        # 侧边栏
│   └── pages/                 # 页面模板
│       ├── auth/              # 登录注册
│       ├── dashboard/         # 控制台
│       ├── customers/         # 客户管理
│       ├── contacts/          # 联系人管理
│       ├── emails/            # 邮件管理
│       ├── meetings/          # 会议记录
│       └── settings/          # 系统设置
├── public/                    # 静态资源
│   ├── css/
│   │   └── main.css           # 自定义样式
│   └── js/
│       └── main.js            # 自定义脚本
├── migrations/                # 数据库迁移
│   └── init.sql               # 初始化 SQL
├── uploads/                   # 上传文件存储
│   └── videos/                # 会议视频
├── logs/                      # 日志文件
├── .env                       # 环境变量（需创建）
├── env.example                # 环境变量示例
├── package.json               # 项目依赖
├── Dockerfile                 # Docker 镜像定义
├── docker-compose.yml         # Docker Compose 配置
├── start.sh                   # 快速启动脚本
└── README.md                  # 本文档
```

---

## ⚙️ 配置说明

### 必需配置

| 配置项 | 说明 | 示例值 |
|--------|------|--------|
| `DB_HOST` | 数据库主机 | `localhost` (本地) 或 `postgres` (Docker) |
| `DB_PORT` | 数据库端口 | `5432` |
| `DB_NAME` | 数据库名称 | `hrepo_db` |
| `DB_USER` | 数据库用户 | `user` |
| `DB_PASSWORD` | 数据库密码 | `password` |
| `REDIS_HOST` | Redis主机 | `localhost` (本地) 或 `redis` (Docker) |
| `REDIS_PORT` | Redis端口 | `6379` |
| `JWT_SECRET` | JWT签名密钥 | 至少32位随机字符串 |
| `OPENAI_API_KEY` | OpenAI API密钥 | `sk-...` |
| `HUNTER_API_KEY` | Hunter.io API密钥 | 从 hunter.io 获取 |

### 可选配置

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | 应用端口 | `8000` |
| `NODE_ENV` | 运行环境 | `development` |
| `OPENAI_MODEL` | OpenAI 模型 | `gpt-4` |
| `OPENAI_MAX_TOKENS` | 最大Token数 | `8000` |
| `LOG_LEVEL` | 日志级别 | `info` |
| `RATE_LIMIT_MAX_REQUESTS` | API限流 | `100` |

---

## 🎯 启动方式详解

### 方式一：Docker 完全启动（生产环境推荐）

**特点**：
- ✅ 一键启动，环境隔离
- ✅ 自动初始化数据库
- ✅ 自动创建管理员账号
- ✅ 适合生产部署

**步骤**：

```bash
# 1. 进入项目目录
cd hnode

# 2. 确保 .env 文件已配置
ls -la .env

# 3. 启动所有服务
./start.sh

# 或者手动启动
docker-compose up -d

# 4. 查看服务状态
docker-compose ps

# 5. 查看应用日志
docker-compose logs -f app
```

**预期输出**：

```
✅ 数据库连接成功
✅ 数据库迁移完成
✅ Redis连接成功
✅ Redis准备就绪
🚀 服务器启动成功!
📍 地址: http://0.0.0.0:8000
```

---

### 方式二：混合启动（开发环境推荐）

**特点**：
- ✅ 代码热重载，方便调试
- ✅ 数据持久化在Docker
- ✅ 开发效率高

**步骤**：

```bash
# 1. 启动数据库和Redis（Docker）
cd hnode
docker-compose up -d postgres redis

# 2. 验证数据库和Redis状态
docker-compose ps
# 应该看到 postgres 和 redis 都是 healthy 状态

# 3. 安装依赖（首次或依赖更新时）
npm install

# 4. 运行数据库迁移（首次或表结构变更后）
npm run migrate

# 5. 启动Node.js应用
node src/app.js

# 开发环境推荐使用 nodemon（自动重启）
npm install -g nodemon
nodemon src/app.js
```

**预期输出**：

```
✅ 数据库连接成功
✅ Redis连接成功
✅ Redis准备就绪
✅ 数据库模型同步成功
🚀 服务器启动成功!
📍 地址: http://0.0.0.0:8000
🌍 环境: development
```

---

### 方式三：完全本地启动

**前提**：本地已安装并启动 PostgreSQL 和 Redis

```bash
# 1. 启动本地数据库服务
# macOS Homebrew
brew services start postgresql
brew services start redis

# Ubuntu/Debian
sudo systemctl start postgresql
sudo systemctl start redis

# 2. 创建数据库
psql -U postgres -c "CREATE DATABASE hrepo_db;"
psql -U postgres -c "CREATE USER user WITH PASSWORD 'password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE hrepo_db TO user;"

# 3. 安装依赖
npm install

# 4. 运行迁移
npm run migrate

# 5. 启动应用
node src/app.js
```

---

## 🔐 首次使用流程

### 1. 启动服务

```bash
cd hnode
./start.sh
```

### 2. 访问登录页面

浏览器打开：http://127.0.0.1:8000

系统会自动跳转到登录页面：http://127.0.0.1:8000/login

### 3. 使用默认账号登录

```
用户名: admin
密码:   Admin123456
```

### 4. 登录后自动跳转到控制台

成功登录后会自动跳转到：http://127.0.0.1:8000/dashboard

### 5. 配置邮箱（可选）

如需发送邮件，请先配置发件邮箱：

1. 点击右上角用户菜单 → **邮箱配置**
2. 点击 **添加邮箱**
3. 填写：
   - 邮箱地址（如：`sales@263.net`）
   - 密码（邮箱的授权码或密码）
   - 勾选"设为默认邮箱"
4. 保存后即可使用该邮箱发送邮件

---

## 🛠 常用命令

### Docker 操作

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 查看服务状态
docker-compose ps

# 查看日志（所有服务）
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f redis

# 重启特定服务
docker-compose restart app

# 进入容器
docker-compose exec app sh
docker-compose exec postgres psql -U user -d hrepo_db

# 停止并删除所有数据（⚠️ 慎用）
docker-compose down -v
```

---

### 数据库操作

```bash
# 运行迁移脚本
npm run migrate

# 连接到数据库（Docker）
docker-compose exec postgres psql -U user -d hrepo_db

# 查看所有表
\dt

# 查看用户表
SELECT * FROM users;

# 退出
\q
```

---

### 应用管理

```bash
# 安装依赖
npm install

# 启动应用（开发环境）
npm start
# 或
node src/app.js

# 使用 nodemon（自动重启）
nodemon src/app.js

# 运行数据库迁移
npm run migrate
```

---

## 📖 使用示例

### 1. 搜索海外客户

1. 登录后进入控制台
2. 在搜索框输入关键词（如：`sugar-free`）
3. 点击"搜索潜在客户"
4. 查看搜索结果，可导出为CSV

### 2. 添加联系人

**方式A：通过Hunter.io搜索**
1. 在客户列表中点击"联系人"按钮
2. 自动调用Hunter.io搜索该公司联系人
3. 点击"添加"按钮保存联系人

**方式B：手动添加**
1. 进入"联系人管理"页面
2. 点击"添加联系人"
3. 填写信息后保存

### 3. 发送邮件

1. 进入"邮件模板"页面，创建模板
2. 进入"写邮件"页面
3. 选择模板和收件人
4. 预览后发送

### 4. 上传会议录音

1. 进入"视频会议记录"页面
2. 点击"上传会议录音"
3. 选择视频文件、填写信息
4. 上传后系统自动进行AI转录和分析

### 5. 查看客户分析

1. 进入"客户管理"页面
2. 点击客户详情
3. 系统自动进行AI智能分析
4. 查看客户画像、机会点、风险点、战略建议等

---

## 🔧 开发调试

### 启用详细日志

修改 `.env`：

```bash
LOG_LEVEL=debug
NODE_ENV=development
```

### 查看实时日志

```bash
# Docker方式
docker-compose logs -f app

# 本地运行方式
# 日志会直接输出到控制台
```

### 数据库调试

```bash
# 进入数据库
docker-compose exec postgres psql -U user -d hrepo_db

# 常用查询
SELECT * FROM users;
SELECT * FROM customers;
SELECT * FROM contacts;
SELECT * FROM email_history;
SELECT * FROM zoom_meetings;
```

---

## 📊 监控和维护

### 查看资源使用

```bash
# 查看容器资源占用
docker stats

# 查看磁盘使用
docker system df
```

### 日志管理

```bash
# 日志文件位置
hnode/logs/app.log

# 查看日志
tail -f logs/app.log

# 清理旧日志
rm logs/app.log
```

### 数据备份

```bash
# 备份数据库
docker-compose exec postgres pg_dump -U user hrepo_db > backup_$(date +%Y%m%d).sql

# 恢复数据库
docker-compose exec -T postgres psql -U user -d hrepo_db < backup_20251010.sql
```

---

## ❓ 常见问题

### Q1: 启动后无法访问 8000 端口？

**检查步骤：**

```bash
# 1. 检查容器状态
docker-compose ps
# 确保 app 状态是 "Up"，不是 "Restarting"

# 2. 查看错误日志
docker-compose logs app --tail=100

# 3. 检查端口占用
lsof -i:8000

# 4. 检查防火墙
# 确保 8000 端口未被防火墙阻止
```

---

### Q2: 数据库连接失败？

**可能原因：**

1. PostgreSQL 未启动或未就绪
2. 数据库配置错误

**解决方法：**

```bash
# 检查 PostgreSQL 状态
docker-compose ps postgres

# 查看 PostgreSQL 日志
docker-compose logs postgres

# 验证数据库配置
docker-compose exec postgres psql -U user -d hrepo_db -c "SELECT 1;"
```

---

### Q3: Redis 连接失败？

**说明**：Redis 连接失败不会阻止应用启动，系统会降级为仅 JWT 认证模式。

**检查 Redis：**

```bash
# 检查 Redis 状态
docker-compose ps redis

# 测试 Redis 连接
docker-compose exec redis redis-cli ping
# 应该返回：PONG
```

---

### Q4: OpenAI API 调用失败？

**可能原因：**

1. API Key 无效或过期
2. 网络无法访问 OpenAI API
3. API 配额已用完

**解决方法：**

1. 检查 `.env` 中的 `OPENAI_API_KEY` 是否正确
2. 如使用代理，确保 `OPENAI_BASE_URL` 配置正确
3. 查看日志中的具体错误信息

---

### Q5: Hunter.io 搜索失败？

**可能原因：**

1. API Key 无效
2. 搜索配额已用完
3. 域名格式不正确

**解决方法：**

1. 验证 `HUNTER_API_KEY` 是否有效
2. 登录 hunter.io 查看配额使用情况
3. 确保输入的是有效域名（如：`example.com`）

---

### Q6: 邮件发送失败？

**检查清单：**

1. ✅ 是否已配置发件邮箱？（设置 → 邮箱配置）
2. ✅ 邮箱账号密码是否正确？
3. ✅ 是否使用的是授权码而非邮箱密码？
4. ✅ SMTP 服务器是否正确？（263邮箱：`smtp.263.net:465`）

---

### Q7: 视频上传后无法分析？

**可能原因：**

1. 视频格式不支持
2. OpenAI API 配额不足
3. 视频文件过大或过长

**建议：**

- 支持的格式：`.mp4`, `.mov`, `.avi`, `.webm`
- 建议时长：< 30分钟
- 建议大小：< 500MB

---

### Q8: 如何重置数据库？

```bash
# ⚠️ 警告：此操作会删除所有数据！

# 停止服务并删除数据卷
docker-compose down -v

# 重新启动（会重新初始化数据库）
docker-compose up -d

# admin 账号会重新创建
```

---

### Q9: 忘记密码怎么办？

**方式一：使用默认管理员账号**

```
用户名: admin
密码:   Admin123456
```

**方式二：数据库重置密码**

```bash
# 1. 生成新密码哈希
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('NewPassword123', 10));"

# 2. 更新数据库
docker-compose exec postgres psql -U user -d hrepo_db -c "
UPDATE users 
SET hashed_password = '刚才生成的哈希值' 
WHERE username = 'admin';
"
```

---

### Q10: 如何升级项目？

```bash
# 1. 拉取最新代码
git pull

# 2. 停止服务
docker-compose down

# 3. 重新构建镜像
docker-compose build --no-cache

# 4. 启动服务
docker-compose up -d

# 5. 运行数据库迁移（如有新的表结构）
docker-compose exec app npm run migrate
```

---

## 📞 技术支持

- 📧 Email: support@workwith.cn
- 📖 API文档: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- 🚀 部署指南: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## 📝 更新日志

### v1.0.0 (2025-10-10)

**新功能：**
- ✅ 海外客户搜索功能
- ✅ Hunter.io 联系人批量获取
- ✅ 邮件模板和批量发送
- ✅ 视频会议AI分析
- ✅ 客户智能画像分析
- ✅ Toast通知系统
- ✅ 完整的前端页面

**技术优化：**
- ✅ Docker 容器化部署
- ✅ Redis 会话管理
- ✅ JWT 认证机制
- ✅ EJS 服务端渲染
- ✅ Markdown 格式支持

---

## 📄 许可证

MIT License

---

## 🎉 开始使用

```bash
# 一键启动
cd hnode && ./start.sh

# 访问系统
open http://127.0.0.1:8000

# 使用默认账号登录
用户名: admin
密码:   Admin123456
```

**祝您使用愉快！** 🚀
