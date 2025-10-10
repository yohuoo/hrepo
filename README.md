# HRepo - 海外客户搜索与管理系统

## 🚀 快速开始

### 推荐使用 Node.js 版本

```bash
cd hnode
./start.sh
```

详细文档请查看：
- **快速开始**: [hnode/README.md](hnode/README.md)
- **API文档**: [hnode/API_DOCUMENTATION.md](hnode/API_DOCUMENTATION.md)
- **Docker指南**: [hnode/DOCKER_GUIDE.md](hnode/DOCKER_GUIDE.md)

## 📁 项目结构

```
hrepo/
├── hnode/                    # ✅ Node.js版本（主要使用）
│   ├── docker-compose.yml    # Docker编排配置
│   ├── Dockerfile            # 应用镜像
│   ├── src/                  # 源代码
│   ├── migrations/           # 数据库迁移
│   └── start.sh              # 启动脚本
│
├── app/                      # 📦 Python版本（备份保留）
│   ├── routers/
│   ├── models/
│   └── services/
│
├── docker-compose.db.yml     # 独立数据库配置
└── env.example               # 环境变量示例
```

## 🎯 核心功能

- ✅ 用户认证（注册、登录、JWT）
- ✅ 联系人管理（CRUD、标签、搜索）
- ✅ 客户管理（进度跟踪、统计）
- ✅ 邮件模板（模板管理、批量预览）
- ✅ 邮箱绑定（账户管理）
- ✅ 邮件往来（记录、搜索）
- ✅ 会议视频（上传、转文字、AI摘要）
- ✅ 客户分析（AI智能分析）
- ✅ Hunter.io集成（域名搜索）
- ✅ OpenAI集成（公司搜索）

## 🔧 技术栈

### Node.js版本（推荐）
- **框架**: Express.js
- **数据库**: PostgreSQL 15 + Sequelize ORM
- **缓存**: Redis 7
- **认证**: JWT + bcrypt
- **AI**: OpenAI GPT-4/GPT-5, Whisper
- **文件上传**: Multer
- **容器化**: Docker + Docker Compose

### Python版本（备份）
- **框架**: FastAPI
- **数据库**: PostgreSQL + SQLAlchemy
- **迁移**: Alembic
- **状态**: 保留作为参考

## 📚 文档

- [项目总览](PROJECT_README.md)
- [Node.js版本 README](hnode/README.md)
- [完整API文档](hnode/API_DOCUMENTATION.md)
- [Docker部署指南](hnode/DOCKER_GUIDE.md)

## 🆘 获取帮助

有问题请查看相应的文档文件，或查看Docker日志：

```bash
cd hnode
docker-compose logs -f app
```

## 📝 License

MIT