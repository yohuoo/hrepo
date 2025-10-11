# HNode - 智能客户关系管理系统

> 基于 Node.js + Express + PostgreSQL + Redis 的企业级CRM系统
> 
> 集成 AI 智能分析 | 邮件营销自动化 | 销售合同管理 | 细粒度权限控制

[![版本](https://img.shields.io/badge/version-1.2.0-blue.svg)](https://github.com/yourusername/hnode)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/postgresql-15-blue.svg)](https://www.postgresql.org)

---

## 🔗 快速导航

| 文档 | 说明 |
|------|------|
| 📖 [完整文档](./README.md) | 您正在阅读 |
| 🚀 [快速开始](./QUICK_START.md) | 5分钟快速上手 |
| 📚 [功能详解](./FEATURES.md) | 功能清单和使用说明 |
| 📡 [API文档](./API_DOCUMENTATION.md) | REST API接口文档 |
| 🐳 [Docker指南](./DOCKER_GUIDE.md) | Docker部署指南 |
| 🚢 [部署指南](./DEPLOYMENT_GUIDE.md) | 生产环境部署 |
| 🆕 [新功能指南](./NEW_FEATURES_GUIDE.md) | 最新功能说明 |

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

### 🎯 客户管理
- 👥 **联系人管理** - 批量导入、Hunter.io搜索、标签分类
- 🏢 **客户管理** - 客户跟进、兴趣度评级、成交状态管理
- 📝 **合同管理** - AI智能建议合同信息、合同录入与查看
- 🤖 **AI客户分析** - 基于邮件和会议记录的智能客户画像
- 🏆 **案例总结** - 自动生成已成交客户的销售案例

### 📧 邮件系统
- ✉️ **邮件收发** - 收件箱、发件箱、邮件分类
- 📝 **邮件模板** - AI辅助生成、个性化变量、批量发送
- 🌐 **智能翻译** - 一键中英文互译、内容润色
- 🎯 **精准投递** - 联系人/客户混合选择、邮箱去重

### 📊 数据分析
- 📈 **数据统计** - 联系人、客户、邮件、销售趋势可视化
- 💰 **销售数据** - 销售记录管理、业绩统计、部门汇总
- 📄 **智能报告** - AI生成个人/部门/公司数据报告
- 🔍 **数据洞察** - AI实时分析数据趋势、提供行动建议

### 🎥 会议管理
- 📹 **视频上传** - 支持多格式会议视频上传
- 🗣️ **AI转录** - 自动语音识别生成文字稿
- 📋 **智能摘要** - AI提取会议要点和行动项

### 🔐 权限与安全
- 🔑 **页面权限** - 细粒度的菜单、页面、操作权限控制
- 👤 **角色管理** - 超级管理员、管理员、普通用户三级权限
- 🏢 **部门权限** - 部门级权限继承、个人权限追加
- 📝 **审计日志** - 完整的权限变更记录

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
| 📊 **控制台** | http://127.0.0.1:8000/dashboard | 数据概览 |
| **客户管理** | | |
| 👥 **联系人** | http://127.0.0.1:8000/contacts | 联系人管理、Hunter搜索 |
| 🏢 **客户** | http://127.0.0.1:8000/customers | 客户管理、合同录入 |
| **邮件系统** | | |
| 📥 **收件箱** | http://127.0.0.1:8000/emails/inbox | 接收邮件列表 |
| 📤 **发件箱** | http://127.0.0.1:8000/emails/sent | 已发送邮件 |
| 📧 **写邮件** | http://127.0.0.1:8000/emails/compose | 撰写和发送邮件 |
| 📝 **邮件模板** | http://127.0.0.1:8000/emails/templates | 模板管理、AI生成 |
| **数据分析** | | |
| 📈 **数据统计** | http://127.0.0.1:8000/statistics | 可视化数据仪表板 |
| 💰 **销售数据** | http://127.0.0.1:8000/sales | 销售记录和统计 |
| 📄 **数据报告** | http://127.0.0.1:8000/reports | AI生成数据报告 |
| 🏆 **案例总结** | http://127.0.0.1:8000/case-studies | 成交案例分析 |
| **其他** | | |
| 🎥 **会议记录** | http://127.0.0.1:8000/meetings | 视频会议管理 |
| **系统设置** | | |
| 🏗️ **部门管理** | http://127.0.0.1:8000/settings/departments | 组织架构管理 |
| 👤 **用户管理** | http://127.0.0.1:8000/settings/users | 用户账号管理 |
| 🔐 **页面权限** | http://127.0.0.1:8000/settings/page-permissions | 权限配置（超管） |
| ⚙️ **邮箱配置** | http://127.0.0.1:8000/settings/email | 发件邮箱配置 |

---

### API 端点

| 分类 | 端点 | 说明 |
|------|------|------|
| **认证** | | |
| 🔐 | `/api/auth/login` | 用户登录 |
| 🔐 | `/api/auth/register` | 用户注册 |
| 🔐 | `/api/auth/me` | 获取当前用户信息 |
| **客户管理** | | |
| 👤 | `/api/contacts` | 联系人CRUD |
| 🏢 | `/api/customers` | 客户CRUD |
| 📝 | `/api/contracts` | 合同管理 |
| 🤖 | `/api/customer-analysis` | AI客户分析 |
| 🔗 | `/api/hunter/domain-search` | Hunter.io搜索 |
| **邮件系统** | | |
| 📧 | `/api/emails/send-batch` | 批量发送邮件 |
| 📝 | `/api/email-templates` | 邮件模板CRUD |
| 📨 | `/api/email-history` | 收发件记录 |
| 🌐 | `/api/emails/ai-assist` | AI邮件辅助（翻译、润色） |
| **数据分析** | | |
| 📈 | `/api/statistics` | 数据统计 |
| 💰 | `/api/sales` | 销售数据 |
| 📄 | `/api/reports` | 数据报告 |
| 🏆 | `/api/case-studies` | 案例总结 |
| **会议管理** | | |
| 🎥 | `/api/zoom-meetings` | 会议CRUD和AI分析 |
| **系统管理** | | |
| 🏗️ | `/api/departments` | 部门管理 |
| 👤 | `/api/users` | 用户管理 |
| 🔐 | `/api/page-permissions` | 页面权限管理 |

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
│   ├── models/                # 数据模型（17张表）
│   │   ├── User.js            # 用户表
│   │   ├── Department.js      # 部门表
│   │   ├── Customer.js        # 客户表
│   │   ├── Contact.js         # 联系人表
│   │   ├── ContactTag.js      # 联系人标签
│   │   ├── EmailTemplate.js   # 邮件模板
│   │   ├── EmailHistory.js    # 邮件历史
│   │   ├── UserEmailBinding.js # 用户邮箱绑定
│   │   ├── ZoomMeeting.js     # 视频会议
│   │   ├── CustomerAnalysis.js # 客户分析
│   │   ├── SalesRecord.js     # 销售记录
│   │   ├── Contract.js        # 合同
│   │   ├── Report.js          # 报告
│   │   ├── CaseStudy.js       # 案例总结
│   │   ├── Page.js            # 页面定义
│   │   ├── PagePermission.js  # 页面权限
│   │   ├── PermissionAuditLog.js # 权限审计
│   │   └── index.js           # 模型汇总
│   ├── routes/                # 路由定义（20+路由）
│   │   ├── auth.js            # 认证路由
│   │   ├── customers.js       # 客户路由
│   │   ├── contacts.js        # 联系人路由
│   │   ├── emails.js          # 邮件发送
│   │   ├── emailTemplates.js  # 邮件模板
│   │   ├── emailHistory.js    # 邮件历史
│   │   ├── contracts.js       # 合同管理
│   │   ├── sales.js           # 销售数据
│   │   ├── reports.js         # 数据报告
│   │   ├── caseStudies.js     # 案例总结
│   │   ├── statistics.js      # 数据统计
│   │   ├── departments.js     # 部门管理
│   │   ├── users.js           # 用户管理
│   │   ├── pagePermissions.js # 页面权限
│   │   ├── hunter.js          # Hunter.io
│   │   ├── zoomMeetings.js    # 会议管理
│   │   ├── views.js           # 前端页面路由
│   │   └── ...
│   ├── services/              # 业务逻辑（15+服务）
│   │   ├── CustomerService.js # 客户服务
│   │   ├── ContactService.js  # 联系人服务
│   │   ├── ContractService.js # 合同服务
│   │   ├── SalesService.js    # 销售服务
│   │   ├── ReportService.js   # 报告服务
│   │   ├── CaseStudyService.js # 案例服务
│   │   ├── StatisticsService.js # 统计服务
│   │   ├── DepartmentService.js # 部门服务
│   │   ├── UserService.js     # 用户服务
│   │   ├── PagePermissionService.js # 权限服务
│   │   ├── HunterService.js   # Hunter.io
│   │   ├── OpenAIService.js   # OpenAI通用
│   │   ├── EmailAIService.js  # 邮件AI
│   │   ├── EmailSendingService.js # 邮件发送
│   │   ├── EmailTemplateService.js # 模板服务
│   │   ├── ZoomService.js     # 会议服务
│   │   └── ...
│   ├── middleware/            # 中间件
│   │   ├── auth.js            # 认证中间件
│   │   ├── permission.js      # 权限中间件
│   │   └── upload.js          # 文件上传中间件
│   └── scripts/               # 脚本工具
│       └── migrate.js         # 数据库迁移脚本
├── views/                     # EJS 模板
│   ├── layouts/
│   │   └── main.ejs           # 主布局
│   ├── partials/
│   │   ├── navbar.ejs         # 导航栏
│   │   └── sidebar.ejs        # 侧边栏（动态权限）
│   ├── pages/                 # 页面模板
│   │   ├── auth/              # 登录注册
│   │   ├── dashboard/         # 控制台
│   │   ├── customers/         # 客户管理
│   │   ├── contacts/          # 联系人管理
│   │   ├── emails/            # 邮件管理
│   │   ├── meetings/          # 会议记录
│   │   ├── sales/             # 销售数据
│   │   ├── reports/           # 数据报告
│   │   ├── statistics/        # 数据统计
│   │   ├── case-studies/      # 案例总结
│   │   └── settings/          # 系统设置
│   │       ├── departments.ejs # 部门管理
│   │       ├── users.ejs       # 用户管理
│   │       ├── page-permissions.ejs # 权限配置
│   │       └── email.ejs       # 邮箱配置
│   └── errors/                # 错误页面
│       └── 403.ejs            # 权限不足
├── public/                    # 静态资源
│   ├── css/
│   │   └── main.css           # 自定义样式
│   └── js/
│       └── main.js            # 自定义脚本
├── migrations/                # 数据库迁移
│   └── init.sql               # 初始化SQL（17张表+权限数据）
├── uploads/                   # 上传文件存储
│   └── videos/                # 会议视频
├── logs/                      # 日志文件
│   └── app.log                # 应用日志
├── .env                       # 环境变量（需创建）
├── env.example                # 环境变量示例
├── package.json               # 项目依赖
├── Dockerfile                 # Docker 镜像定义
├── docker-compose.yml         # Docker Compose 配置
├── start.sh                   # 快速启动脚本
├── README.md                  # 本文档
├── API_DOCUMENTATION.md       # API详细文档
├── DEPLOYMENT_GUIDE.md        # 部署指南
├── DOCKER_GUIDE.md            # Docker使用指南
└── NEW_FEATURES_GUIDE.md      # 新功能使用指南
```

### 📊 数据库表结构（17张表）

| 表名 | 说明 | 主要字段 |
|------|------|---------|
| `departments` | 部门表 | 支持多级部门、部门路径 |
| `users` | 用户表 | 用户名、邮箱、角色、部门 |
| `contacts` | 联系人表 | 姓名、邮箱、公司、标签 |
| `contact_tags` | 联系人标签 | 标签名称、用户ID |
| `customers` | 客户表 | 姓名、公司、兴趣度、成交状态 |
| `customer_analysis` | 客户分析 | AI分析结果、机会点、风险 |
| `email_templates` | 邮件模板 | 标题、内容、个性化变量 |
| `user_email_bindings` | 邮箱绑定 | 发件邮箱、SMTP配置 |
| `email_history` | 邮件历史 | 收发件记录、邮件类型 |
| `zoom_meetings` | 视频会议 | 会议视频、AI转录、摘要 |
| `sales_records` | 销售记录 | 销售金额、数量、销售人员 |
| `contracts` | 合同表 | 甲乙方、产品、金额、交付时间 |
| `reports` | 报告表 | AI生成的数据报告 |
| `case_studies` | 案例总结 | 成交案例、销售技巧 |
| `pages` | 页面定义 | 页面Code、URL、层级关系 |
| `page_permissions` | 页面权限 | 用户/部门权限配置 |
| `permission_audit_logs` | 权限审计 | 权限变更记录 |

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

### ✅ 初始化检查清单

启动前请确认：

- [ ] ✅ 已安装 Docker 和 Docker Compose
- [ ] ✅ 已创建 `.env` 文件（从 `env.example` 复制）
- [ ] ✅ 已配置 `OPENAI_API_KEY`（必需）
- [ ] ✅ 已配置 `JWT_SECRET`（至少32位）
- [ ] ✅ 已配置数据库密码 `DB_PASSWORD`
- [ ] ✅ （可选）已配置 `HUNTER_API_KEY`

### 1. 启动服务

```bash
cd hnode
./start.sh
```

**预期输出**：
```
✅ 数据库连接成功
✅ 数据库迁移完成
✅ Redis连接成功
🚀 服务器启动成功!
📍 地址: http://0.0.0.0:8000
```

### 2. 访问登录页面

浏览器打开：http://127.0.0.1:8000

系统会自动跳转到登录页面：http://127.0.0.1:8000/login

### 3. 使用默认账号登录

```
用户名: admin
密码:   Admin123456
角色:   超级管理员
```

### 4. 首次登录配置

**必做配置**：

1. **修改默认密码**（强烈建议）
   - 点击右上角头像 → "修改密码"
   - 输入旧密码 `Admin123456`
   - 设置新密码

2. **配置发件邮箱**（如需发送邮件）
   - 进入"系统设置" → "邮箱配置"
   - 点击"添加邮箱"
   - 填写：
     - 邮箱地址（如：`your@263.net`）
     - 邮箱密码或授权码
     - SMTP服务器（263邮箱：`smtp.263.net:465`）
   - 勾选"设为默认邮箱"
   - 保存

**可选配置**：

3. **创建部门和用户**
   - 进入"部门管理"创建组织架构
   - 进入"用户管理"添加团队成员
   - 新用户默认拥有所有权限

4. **配置页面权限**
   - 进入"页面权限"
   - 为不同部门/用户配置不同权限
   - 实现精细化权限管理

### 5. 开始使用

登录后即可使用所有功能：
- 👥 添加联系人（Hunter搜索）
- 🏢 管理客户跟进
- 📧 发送邮件（AI辅助）
- 💰 录入销售合同
- 📊 查看数据统计
- 🏆 生成案例总结

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

### 1. 添加和管理联系人

**方式A：Hunter.io搜索（推荐）**
1. 进入"联系人"页面
2. 点击"Hunter.io搜索"按钮
3. 输入公司域名（如：`example.com`）
4. 查看搜索结果，选择需要的联系人
5. 点击"导入"保存到联系人库

**方式B：手动添加**
1. 进入"联系人"页面
2. 点击"添加联系人"
3. 填写姓名、邮箱、公司等信息
4. 保存后可添加标签分类

**批量操作**
- 勾选联系人 → "导出选中"下载CSV
- 勾选联系人 → "删除选中"批量删除

### 2. 客户跟进流程

1. **创建客户**：在"客户"页面点击"新增客户"
2. **发送邮件**：在"写邮件"中选择客户发送邮件
3. **AI分析**：点击客户头像查看详情，系统自动AI分析
4. **查看沟通记录**：详情中查看所有邮件和会议记录
5. **更新状态**：
   - 设置"沟通进度"（待联系、跟进中等）
   - 设置"兴趣度"（无兴趣、低/中/高兴趣）

### 3. 发送邮件（完整流程）

**创建模板**：
1. 进入"邮件模板"页面 → "新建模板"
2. 填写模板标题和内容
3. 使用个性化变量：`{{firstName}}`, `{{company}}`等
4. 可选：点击"AI生成建议"让AI帮您完善

**发送邮件**：
1. 进入"写邮件"页面
2. 选择邮件模板（或手动编写）
3. 点击"选择收件人"，选择联系人/客户
4. 预览邮件内容（自动替换个性化变量）
5. 点击"发送"

**智能翻译**：
- 用中文写邮件 → 点击"一键润色为英文邮件"
- AI自动翻译并润色为专业英文邮件

### 4. 合同管理

**录入合同**：
1. 进入"客户"页面
2. 将客户标记为"已成交"（或录入合同时自动标记）
3. 点击"录入合同"按钮
4. AI会根据邮件往来自动建议：
   - 甲方名称（客户公司）
   - 采购商品
   - 采购数量
   - 预计交付时间
   - 合同金额
5. 确认或修改后保存
6. 系统自动创建销售记录

**查看合同**：
- 点击"合同列表"查看该客户的所有合同
- 可查看合同详情、删除合同

### 5. 数据统计与报告

**查看统计数据**：
1. 进入"数据统计"页面
2. 选择时间范围（今日/7天/30天/自定义）
3. 管理员可筛选：全部/按部门/按用户
4. 查看：
   - 新增联系人/客户趋势图
   - 邮件互动统计
   - 销售金额和数量趋势
   - 客户兴趣度分布
5. **AI数据洞察**：自动分析趋势，给出建议
6. **AI行动建议**：基于当前数据提供具体行动方案

**生成报告**：
1. 进入"数据报告"页面
2. 选择报告类型：
   - 个人报告（我的数据）
   - 部门报告（部门整体）
   - 公司报告（全公司）
3. 选择时间范围
4. 点击"生成报告"
5. AI自动分析数据并生成Markdown格式报告
6. 可下载报告为 `.md` 文件

### 6. 案例总结

**生成案例**：
1. 进入"案例总结"页面
2. 点击"生成新案例"
3. 选择已成交的客户
4. AI自动生成：
   - 客户基本信息
   - 销售技巧总结
   - 沟通亮点
   - 完整销售流程
5. 查看和学习优秀销售案例

### 7. 会议视频分析

1. 进入"会议记录"页面
2. 点击"上传会议录音"
3. 选择视频文件、填写信息
4. 上传后系统自动：
   - 语音转文字（AI转录）
   - 生成会议摘要
   - 提取行动项
5. 在客户详情中可关联查看该客户的所有会议

### 8. 权限管理（超级管理员）

1. 进入"页面权限"配置
2. 选择部门或用户
3. 配置权限：
   - 菜单权限：控制侧边栏显示
   - 页面权限：控制页面访问
   - 操作权限：控制按钮和功能（查看/新增/编辑/删除）
4. 点击"保存权限"
5. 权限立即生效，用户刷新页面即可看到变化

**权限特性**：
- 部门权限继承：用户自动继承部门权限
- 个人权限追加：可为个人添加额外权限
- 审计日志：记录所有权限变更
- 系统页面保护：页面权限管理仅超管可访问

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

### Q11: 为什么用户看不到某些菜单？

**原因**：启用了页面权限系统后，用户只能看到有权限的菜单。

**解决方法**：

1. 使用超级管理员账号登录
2. 进入"页面权限"管理
3. 选择该用户或其所在部门
4. 勾选需要的权限
5. 点击"保存权限"
6. 用户刷新页面即可看到菜单

---

### Q12: 如何清除Redis缓存？

**场景**：权限更新后未生效

```bash
# 方式一：重启Redis
docker-compose restart redis

# 方式二：清空所有缓存
docker-compose exec redis redis-cli FLUSHDB

# 方式三：删除特定用户缓存
docker-compose exec redis redis-cli DEL "user:permissions:用户ID"
```

---

### Q13: 统计数据不准确怎么办？

**检查项**：

1. 确认时间范围选择正确
2. 检查筛选条件（全部/部门/用户）
3. 刷新页面重新加载数据
4. 查看浏览器控制台是否有错误

**时区问题**：
- 统计使用UTC时间
- 如果跨日期，可能会有8小时偏差
- 建议使用"全部"或较长时间范围查看

---

### Q14: AI功能无响应？

**可能原因**：

1. OpenAI API配额用完
2. 网络无法访问OpenAI
3. API Key无效

**检查步骤**：

```bash
# 查看应用日志
docker-compose logs app | grep -i "openai\|ai"

# 测试API连接
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models
```

---

### Q15: 数据库初始化失败？

**症状**：`column does not exist` 错误

**解决方法**：

```bash
# 1. 停止服务
docker-compose down

# 2. 删除数据卷（⚠️ 会清空所有数据）
docker-compose down -v

# 3. 重新启动（会重新运行init.sql）
docker-compose up -d

# 4. 查看迁移日志
docker-compose logs app | grep -i "migration\|init"
```

---

## 📞 技术支持

- 📧 Email: support@workwith.cn
- 📖 API文档: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- 🚀 部署指南: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## 📝 更新日志

### v1.2.0 (2025-10-11)

**重大更新：页面权限系统**
- ✅ 细粒度权限控制（菜单/页面/操作三级）
- ✅ 部门权限继承机制
- ✅ 个人权限追加模式
- ✅ 权限审计日志
- ✅ 前后端双重拦截
- ✅ 侧边栏动态显示

**新功能：**
- ✅ 合同管理系统（AI智能建议）
- ✅ 销售数据统计和可视化
- ✅ 案例总结（成交客户自动分析）
- ✅ AI数据洞察（趋势分析）
- ✅ AI行动建议（智能推荐）
- ✅ 联系人批量导出（CSV）
- ✅ 联系人批量删除
- ✅ 部门管理和用户管理

**功能优化：**
- ✅ 客户/联系人头像显示
- ✅ 邮件列表客户信息优化（当前状态显示）
- ✅ 收发件箱UI优化
- ✅ 数据统计图表优化（双Y轴、动态布局）
- ✅ 邮件翻译功能完善

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
