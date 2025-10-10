# 🚀 CRM系统部署与使用指南

## 📋 目录

- [系统架构](#系统架构)
- [快速开始](#快速开始)
- [访问前端页面](#访问前端页面)
- [页面功能说明](#页面功能说明)
- [常见问题](#常见问题)

---

## 🏗 系统架构

### 技术栈

**后端**:
- Node.js + Express.js
- PostgreSQL 数据库
- Redis 会话管理
- Sequelize ORM

**前端**:
- EJS 模板引擎
- Bootstrap 5
- jQuery
- Chart.js（数据可视化）

**AI集成**:
- OpenAI API (GPT-4/GPT-5)
- Whisper API（语音转文字）

---

## 🚀 快速开始

### 1. 启动服务

```bash
# 进入项目目录
cd /Users/liuhesong/Desktop/backend/Python/hrepo/hnode

# 启动所有服务（PostgreSQL + Redis + App）
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f app
```

### 2. 验证服务

```bash
# 检查API健康状态
curl http://localhost:8000/api

# 应该返回:
# {
#   "message": "HRepo API - 海外客户搜索系统 (Node.js版本)",
#   "version": "1.0.0",
#   ...
# }
```

### 3. 访问前端页面

打开浏览器访问：**http://localhost:8000**

---

## 🌐 访问前端页面

### 页面路由列表

| 页面 | 路由 | 说明 |
|------|------|------|
| **登录页面** | http://localhost:8000/login | 用户登录 |
| **注册页面** | http://localhost:8000/register | 新用户注册 |
| **控制台** | http://localhost:8000/dashboard | 数据概览和统计 |
| **联系人管理** | http://localhost:8000/contacts | 联系人列表和搜索 |
| **客户管理** | http://localhost:8000/customers | 客户列表和管理 |
| **收件箱** | http://localhost:8000/emails/inbox | 查看收到的邮件 |
| **发件箱** | http://localhost:8000/emails/sent | 查看发送的邮件 |
| **邮件模板** | http://localhost:8000/emails/templates | 管理邮件模板 |
| **邮箱设置** | http://localhost:8000/settings/email-accounts | 绑定和管理邮箱 |

---

## 📖 页面功能说明

### 1️⃣ 登录/注册页面

**功能**:
- ✅ 用户注册（用户名、邮箱、密码）
- ✅ 用户登录（支持用户名或邮箱登录）
- ✅ 记住登录状态
- ✅ 自动跳转到控制台

**操作步骤**:
1. 访问 http://localhost:8000/register
2. 填写用户名、邮箱、密码
3. 点击"注册"按钮
4. 自动登录并跳转到控制台

---

### 2️⃣ 控制台（Dashboard）

**功能**:
- ✅ 实时统计数据
  - 总客户数
  - 总联系人数
  - 邮件往来数
  - 会议记录数
- ✅ 客户沟通进度分布图表（柱状图）
- ✅ 客户兴趣程度分布图表（饼图）
- ✅ 最近收到的邮件列表
- ✅ 最近更新的客户列表

**特色**:
- 📊 使用Chart.js实现数据可视化
- 🔄 实时数据更新
- 📱 响应式设计

---

### 3️⃣ 联系人管理

**功能**:
- ✅ 联系人列表（表格展示）
- ✅ 搜索联系人（姓名、邮箱、公司）
- ✅ 按标签筛选
- ✅ 手动添加联系人
- ✅ **Hunter.io域名搜索**
  - 输入公司域名
  - 自动搜索联系人
  - 一键导入
- ✅ 删除联系人
- ✅ 分页浏览

**操作步骤（Hunter.io搜索）**:
1. 点击"Hunter.io搜索"按钮
2. 输入公司域名（如：google.com）
3. 点击搜索
4. 查看搜索结果
5. 点击"导入"按钮添加到联系人

---

### 4️⃣ 客户管理

**功能**:
- ✅ 客户卡片展示
- ✅ 筛选功能
  - 按沟通进度筛选（待联系、跟进中等）
  - 按兴趣程度筛选（无兴趣、低兴趣等）
  - 关键词搜索
- ✅ 添加新客户
- ✅ 查看客户详情
- ✅ 邮件往来次数显示
- ✅ 最后沟通时间显示
- ✅ 分页浏览

**客户状态说明**:
- **沟通进度**: 待联系、跟进中、不再跟进、暂停跟进
- **兴趣程度**: 无兴趣、低兴趣、中等兴趣、高兴趣

---

### 5️⃣ 收件箱 📮

**功能**:
- ✅ 查看所有收到的邮件
- ✅ 多维度筛选
  - 按发件人邮箱地址筛选
  - 按客户筛选
  - 关键词搜索
- ✅ 邮件详情查看
- ✅ 邮件线程追踪
- ✅ 关联客户信息显示
- ✅ 实时刷新
- ✅ 分页浏览

**筛选示例**:
```
1. 查看所有收件 → 默认显示
2. 查看某客户的回复 → 选择客户筛选
3. 搜索关键词 → 输入关键词搜索
4. 来自特定邮箱 → 输入发件人邮箱
```

---

### 6️⃣ 发件箱 📤

**功能**:
- ✅ 查看所有发送的邮件
- ✅ 多维度筛选
  - **按发件邮箱筛选**（下拉选择）
  - 按收件人邮箱地址筛选
  - 按客户筛选
  - 关键词搜索
- ✅ 发件邮箱信息显示
- ✅ 邮件状态显示（已发送/失败）
- ✅ 邮件详情查看
- ✅ 跳转到写邮件页面
- ✅ 分页浏览

**筛选示例**:
```
1. 查看所有发件 → 默认显示
2. 查看从邮箱A发出的邮件 → 选择发件邮箱
3. 查看发给某客户的邮件 → 选择客户
4. 查看发给特定邮箱的邮件 → 输入收件人邮箱
```

---

### 7️⃣ 邮件模板管理

**功能**:
- ✅ 模板列表（卡片展示）
- ✅ 创建新模板
- ✅ 模板变量支持
  - {{firstName}} - 名字
  - {{lastName}} - 姓氏
  - {{company}} - 公司
  - {{position}} - 职位
- ✅ 模板预览
- ✅ 删除模板

**创建模板示例**:
```
标题: 邀请{{company}}免费试用产品
内容: 
您好{{firstName}}，

我是XXX公司的销售代表。我们注意到{{company}}...

期待您的回复！
```

---

### 8️⃣ 邮箱设置

**功能**:
- ✅ 查看已绑定邮箱列表
- ✅ 绑定新邮箱
  - 邮箱地址
  - 邮箱密码（加密存储）
- ✅ 设置默认发件邮箱
- ✅ 启用/禁用邮箱
- ✅ 删除邮箱绑定

**重要**:
- 📧 发送邮件时会使用默认邮箱
- 🔒 邮箱密码会被加密存储
- ⭐ 每个账户只能有一个默认邮箱

---

## 🎯 完整业务流程示例

### 场景：开拓新客户

#### Step 1: 搜索联系人（Hunter.io）

1. 访问 http://localhost:8000/contacts
2. 点击"Hunter.io搜索"
3. 输入目标公司域名：`google.com`
4. 点击搜索
5. 查看搜索结果，点击"导入"

#### Step 2: 创建邮件模板

1. 访问 http://localhost:8000/emails/templates
2. 点击"新建模板"
3. 填写模板标题和内容
4. 使用变量：`{{firstName}}`, `{{company}}`
5. 保存模板

#### Step 3: 绑定邮箱

1. 访问 http://localhost:8000/settings/email-accounts
2. 点击"绑定新邮箱"
3. 填写邮箱地址和密码
4. 绑定成功后，设置为默认邮箱

#### Step 4: 批量发送邮件（使用API）

```bash
# 使用API批量发送
curl -X POST "http://localhost:8000/api/emails/send-batch" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": 1,
    "contact_ids": [1, 2, 3]
  }'
```

#### Step 5: 查看收件箱

1. 访问 http://localhost:8000/emails/inbox
2. 等待自动回复（5-30秒）
3. 刷新页面查看收到的邮件
4. 点击邮件查看详情

#### Step 6: 查看发件箱

1. 访问 http://localhost:8000/emails/sent
2. 筛选发件邮箱：选择发件邮箱
3. 查看发送状态
4. 点击邮件查看详情

#### Step 7: 查看客户（自动转换）

1. 访问 http://localhost:8000/customers
2. 查看从联系人自动转换的客户
3. 查看邮件往来次数
4. 点击客户查看详情

---

## 🎨 页面截图说明

### 登录页面
- 居中卡片式设计
- 渐变背景
- 简洁的表单

### 控制台
- 4个统计卡片（悬浮效果）
- 2个图表（沟通进度、兴趣程度）
- 最近邮件和客户列表

### 收件箱/发件箱
- 邮件列表（带筛选器）
- 发件人/收件人信息
- 时间格式化显示
- 邮件状态标识
- 模态框显示详情

### 客户管理
- 卡片式布局（3列）
- 悬浮效果
- 状态徽章
- 统计信息

---

## 🔧 自定义配置

### 修改端口

编辑 `docker-compose.yml`:

```yaml
services:
  app:
    ports:
      - "8000:8000"  # 修改为您想要的端口
```

### 修改主题颜色

编辑 `public/css/main.css`:

```css
:root {
  --primary-color: #1890ff;  /* 主色调 */
  --sidebar-width: 260px;     /* 侧边栏宽度 */
}
```

---

## 📊 数据流程

### 邮件发送流程

```
1. 用户在前端选择模板和收件人
   ↓
2. 调用 /api/emails/send-batch 接口
   ↓
3. 后端创建邮件记录（email_type='sent'）
   ↓
4. 自动触发模拟回复（30-50%收件人）
   ↓
5. 5-30秒后创建回复记录（email_type='received'）
   ↓
6. 联系人自动转为客户
   ↓
7. 前端收件箱显示新邮件
```

### 收件箱查询流程

```
1. 用户访问 /emails/inbox
   ↓
2. 前端调用 /api/email-history/?email_type=received
   ↓
3. 后端查询 email_type='received' 的记录
   ↓
4. 返回邮件列表（包含发件人、客户信息）
   ↓
5. 前端渲染邮件列表
```

### 发件箱筛选流程

```
1. 用户在发件箱选择筛选条件
   ↓
2. 选择发件邮箱 → sender_email_binding_id=1
3. 输入收件人邮箱 → receive_address=customer@example.com
4. 选择客户 → customer_id=1
   ↓
5. 前端调用 /api/email-history/ 并传入筛选参数
   ↓
6. 后端根据条件查询
   ↓
7. 返回筛选后的邮件列表
```

---

## 🛠 常见问题

### 1. 页面无法访问？

**检查服务状态**:
```bash
docker-compose ps
```

所有服务应该显示 `Up` 状态。

**检查日志**:
```bash
docker-compose logs app
```

查找错误信息。

---

### 2. 登录后立即跳转回登录页？

**原因**: Cookie或Session配置问题

**解决方案**:
- 检查浏览器是否允许Cookie
- 清除浏览器缓存
- 检查 `.env` 文件中的 `JWT_SECRET` 配置

---

### 3. 收件箱为空？

**原因**: 还没有发送邮件或触发自动回复

**解决方案**:
1. 先绑定邮箱（邮箱设置）
2. 创建邮件模板（邮件模板）
3. 使用API发送邮件（见下方示例）
4. 等待5-30秒
5. 刷新收件箱页面

**发送邮件示例**:
```bash
# 获取Token（从浏览器开发者工具 → Application → localStorage）
TOKEN="your-jwt-token"

# 批量发送邮件
curl -X POST "http://localhost:8000/api/emails/send-batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": 1,
    "contact_ids": [1, 2]
  }'
```

---

### 4. 发件箱筛选不生效？

**检查**:
1. 发件邮箱下拉框是否有数据 → 先绑定邮箱
2. 客户下拉框是否有数据 → 先添加客户
3. 确认邮件是通过该邮箱发送的

**调试方法**:
- 打开浏览器开发者工具 → Network
- 查看API请求参数
- 确认 `sender_email_binding_id` 等参数已传递

---

### 5. 图表不显示？

**原因**: Chart.js加载失败或数据为空

**解决方案**:
- 检查网络连接（CDN资源）
- 打开开发者工具 → Console 查看错误
- 确保有客户数据

---

### 6. 如何获取API Token？

**方法1**: 从浏览器获取
1. 登录系统
2. 打开开发者工具 → Application → Local Storage
3. 查找 `authToken` 的值

**方法2**: 使用API登录
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your-username",
    "password": "your-password"
  }'
```

---

## 📱 移动端支持

### 响应式设计

- ✅ 侧边栏自动隐藏（< 992px）
- ✅ 点击菜单按钮显示侧边栏
- ✅ 卡片布局自适应
- ✅ 表格横向滚动

### 移动端操作

1. 点击左上角菜单图标打开侧边栏
2. 选择功能模块
3. 自动关闭侧边栏

---

## 🔐 安全说明

### 密码加密

- ✅ 用户密码：bcrypt加密
- ✅ 邮箱密码：AES-256加密
- ✅ JWT Token：7天有效期
- ✅ Session：Redis存储

### 会话管理

- ✅ 支持多设备登录
- ✅ 可查看活跃会话
- ✅ 可登出单个或所有设备

---

## 📈 性能优化

### 前端优化

- ✅ 搜索防抖（500ms）
- ✅ 分页加载
- ✅ 按需加载图表库
- ✅ 静态资源CDN

### 后端优化

- ✅ 数据库索引优化
- ✅ Redis缓存
- ✅ Gzip压缩
- ✅ 请求限流

---

## 🎓 开发指南

### 添加新页面

1. 在 `views/pages/` 创建EJS文件
2. 在 `src/routes/views.js` 添加路由
3. 在 `views/partials/sidebar.ejs` 添加导航链接

### 调用API

```javascript
// 使用封装的axios（自动带Token）
const response = await axios.get('/customers/');
const customers = response.data.customers;

// 处理错误
try {
  await axios.post('/customers/', data);
  showToast('操作成功', 'success');
} catch (error) {
  showToast(error.response?.data?.message || '操作失败', 'danger');
}
```

---

## 🚀 生产环境部署

### 环境变量配置

确保 `.env` 文件包含：

```env
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
OPENAI_API_KEY=<your-openai-key>
HUNTER_API_KEY=<your-hunter-key>
```

### 启动生产服务

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📞 技术支持

如有问题，请查看：
- API文档: `API_DOCUMENTATION.md`
- 项目README: `README.md`
- 日志文件: `docker-compose logs -f app`

---

**祝您使用愉快！🎉**

*最后更新: 2025-10-07*
