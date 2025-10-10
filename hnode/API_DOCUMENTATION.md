# Node.js API 完整文档

## 📋 目录

1. [概述](#概述)
2. [认证说明](#认证说明)
3. [用户认证 API](#1-用户认证-api)
4. [海外公司搜索 API](#2-海外公司搜索-api)
5. [Hunter.io 域名搜索 API](#3-hunterio-域名搜索-api)
6. [联系人管理 API](#4-联系人管理-api)
7. [邮件模板管理 API](#5-邮件模板管理-api)
8. [客户管理 API](#6-客户管理-api)
9. [用户邮箱绑定管理 API](#7-用户邮箱绑定管理-api)
10. [邮件往来记录管理 API](#8-邮件往来记录管理-api)
11. [会议视频管理 API](#9-会议视频管理-api)
12. [客户分析 API](#10-客户分析-api)
13. [邮件发送与自动回复 API](#11-邮件发送与自动回复-api)

---

## 概述

本文档描述了Node.js服务中所有可用的API接口，包括请求参数、返回参数和使用示例。

**基础URL**: `http://127.0.0.1:8000/api`

**当前版本**: v1.0

**最后更新**: 2025-10-07

---

## 认证说明

### JWT认证

除认证接口外，所有接口都需要在请求头中包含JWT token：

```
Authorization: Bearer <your_jwt_token>
```

### Token获取

通过 `/auth/login` 或 `/auth/register` 接口获取token。

### Token有效期

默认7天，过期后需重新登录。

### 会话管理

系统使用Redis管理会话，支持：
- 单设备登出
- 多设备管理
- 会话列表查看

---

## 1. 用户认证 API

### 1.1 用户注册

**接口**: `POST /auth/register`

**描述**: 注册新用户

**请求参数**:
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

**字段说明**:
- `username` (string, 必需): 用户名，唯一
- `email` (string, 必需): 邮箱地址，唯一，需符合邮箱格式
- `password` (string, 必需): 密码，最少6位

**返回参数**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "is_active": true,
    "is_admin": false,
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "注册成功"
}
```

**错误响应**:
- `400`: 用户名已存在 / 邮箱已被注册 / 密码长度不足
- `500`: 服务器内部错误

---

### 1.2 用户登录

**接口**: `POST /auth/login`

**描述**: 用户登录（支持用户名或邮箱登录）

**请求参数**:
```json
{
  "username": "testuser",
  "password": "password123"
}
```

**字段说明**:
- `username` (string, 必需): 用户名或邮箱
- `password` (string, 必需): 密码

**返回参数**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "is_active": true,
    "is_admin": false,
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "登录成功"
}
```

**错误响应**:
- `401`: 用户名或密码错误
- `403`: 账户已被禁用
- `500`: 服务器内部错误

---

### 1.3 获取当前用户信息

**接口**: `GET /auth/me`

**描述**: 获取当前登录用户的信息

**请求头**:
```
Authorization: Bearer <your_token>
```

**返回参数**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "is_active": true,
    "is_admin": false,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 1.4 用户登出

**接口**: `POST /auth/logout`

**描述**: 登出当前设备（删除当前会话）

**请求头**:
```
Authorization: Bearer <your_token>
```

**返回参数**:
```json
{
  "success": true,
  "message": "登出成功"
}
```

---

### 1.5 登出所有设备

**接口**: `POST /auth/logout-all`

**描述**: 登出所有设备（删除用户的所有会话）

**请求头**:
```
Authorization: Bearer <your_token>
```

**返回参数**:
```json
{
  "success": true,
  "message": "已登出3个设备",
  "sessions_deleted": 3
}
```

---

### 1.6 获取活跃会话列表

**接口**: `GET /auth/sessions`

**描述**: 获取当前用户的所有活跃会话

**请求头**:
```
Authorization: Bearer <your_token>
```

**返回参数**:
```json
{
  "success": true,
  "sessions": [
    {
      "token": "eyJhbGciOiJIUzI1NiI...",
      "createdAt": "2024-01-01T10:00:00.000Z",
      "userId": 1
    }
  ],
  "total": 2,
  "message": "获取会话列表成功"
}
```

---

## 2. 海外公司搜索 API

### 2.1 获取海外代糖公司列表

**接口**: `GET /overseas/companies/sugar-free`

**描述**: 使用OpenAI搜索全球代糖公司信息

**请求参数**: 无

**返回参数**:
```json
{
  "success": true,
  "companies": [
    {
      "company_name": "PureCircle",
      "website": "https://www.purecircle.com",
      "description": "全球领先的甜叶菊生产商",
      "country": "Malaysia",
      "city": "Kuala Lumpur"
    }
  ],
  "total": 20,
  "message": "搜索完成"
}
```

---

## 3. Hunter.io 域名搜索 API

### 3.1 域名联系人搜索

**接口**: `GET /hunter/domain-search`

**描述**: 使用Hunter.io API搜索指定域名的联系人信息

**请求参数**:
- `domain` (string, 必需): 要搜索的域名（支持带协议的URL，会自动提取域名）
- `limit` (number, 可选): 返回结果数量限制，默认20，最大20

**示例请求**:
```
GET /hunter/domain-search?domain=google.com&limit=10
GET /hunter/domain-search?domain=https://www.cargill.com&limit=10
```

**返回参数**:
```json
{
  "success": true,
  "contacts": [
    {
      "name": "Katie Timmreck",
      "first_name": "Katie",
      "last_name": "Timmreck",
      "position": "Recruiter",
      "company": "Google",
      "email": "katietimmreck@google.com",
      "domain": "google.com",
      "description": "Recruiter at Google"
    }
  ],
  "total": 10,
  "domain": "google.com",
  "message": "搜索完成"
}
```

**字段说明**:
- `name`: 联系人完整姓名
- `first_name`: 名字
- `last_name`: 姓氏
- `position`: 职位
- `company`: 公司名称
- `email`: 邮箱地址
- `domain`: 域名
- `description`: 描述信息

---

## 4. 联系人管理 API

### 4.1 获取联系人列表

**接口**: `GET /contacts/`

**描述**: 获取当前用户的联系人列表，支持分页和多种筛选条件

**请求参数**:
- `page` (number, 可选): 页码，默认1
- `pageSize` (number, 可选): 每页数量，默认20
- `search` (string, 可选): 搜索关键词，支持姓名、邮箱、公司模糊搜索
- `tags` (string, 可选): 标签名称列表，用逗号分隔（如：VIP,重要客户）
- `startDate` (string, 可选): 开始日期，格式：YYYY-MM-DD
- `endDate` (string, 可选): 结束日期，格式：YYYY-MM-DD

**返回参数**:
```json
{
  "success": true,
  "contacts": [
    {
      "id": 1,
      "user_id": 1,
      "name": "张三",
      "first_name": "三",
      "last_name": "张",
      "email": "zhangsan@example.com",
      "company": "示例公司",
      "domain": "example.com",
      "position": "产品经理",
      "tags": ["VIP", "重要客户"],
      "description": "张三是示例公司的产品经理",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

---

### 4.2 创建联系人

**接口**: `POST /contacts/`

**描述**: 创建新的联系人

**请求参数**:
```json
{
  "name": "张三",
  "first_name": "三",
  "last_name": "张",
  "email": "zhangsan@example.com",
  "company": "示例公司",
  "domain": "example.com",
  "position": "产品经理",
  "tag_names": ["VIP", "重要客户"]
}
```

**返回参数**: 同联系人列表中的单个对象

---

### 4.3 获取单个联系人

**接口**: `GET /contacts/:contactId`

**描述**: 获取指定ID的联系人详情

---

### 4.4 更新联系人

**接口**: `PUT /contacts/:contactId`

**描述**: 更新指定联系人的信息

---

### 4.5 删除联系人

**接口**: `DELETE /contacts/:contactId`

**描述**: 删除指定联系人

---

### 4.6 为联系人添加标签

**接口**: `POST /contacts/:contactId/tags`

**描述**: 为指定联系人添加标签

**请求参数**:
```json
{
  "tag_names": ["新标签1", "新标签2"]
}
```

---

### 4.7 从联系人移除标签

**接口**: `DELETE /contacts/:contactId/tags/:tagName`

**描述**: 从指定联系人移除指定标签

---

## 5. 邮件模板管理 API

### 5.1 获取邮件模板列表

**接口**: `GET /email-templates/`

**描述**: 获取当前用户的邮件模板列表

**请求参数**:
- `page` (number, 可选): 页码，默认1
- `pageSize` (number, 可选): 每页数量，默认20

**返回参数**:
```json
{
  "success": true,
  "templates": [
    {
      "id": 1,
      "user_id": 1,
      "title": "邀请{{company}}免费试用",
      "content": "您好{{firstName}}，...",
      "variables": ["firstName", "company"],
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

---

### 5.2 创建邮件模板

**接口**: `POST /email-templates/`

**描述**: 创建新的邮件模板

**请求参数**:
```json
{
  "title": "邀请{{company}}免费试用",
  "content": "您好{{firstName}}，..."
}
```

---

### 5.3 获取单个邮件模板

**接口**: `GET /email-templates/:templateId`

**描述**: 获取指定ID的邮件模板详情

---

### 5.4 更新邮件模板

**接口**: `PUT /email-templates/:templateId`

**描述**: 更新指定邮件模板

---

### 5.5 删除邮件模板

**接口**: `DELETE /email-templates/:templateId`

**描述**: 删除指定邮件模板

---

### 5.6 批量预览模板

**接口**: `POST /email-templates/batch-preview`

**描述**: 为多个联系人和/或客户批量预览模板渲染结果

**请求参数**:
```json
{
  "template_id": 1,
  "contact_ids": [1, 2],
  "customer_ids": [3, 4]
}
```

**注意**: `contact_ids` 和 `customer_ids` 至少需要提供一个

**返回参数**:
```json
{
  "success": true,
  "template_id": 1,
  "previews": [
    {
      "recipient_type": "contact",
      "recipient_id": 1,
      "recipient_name": "Giordano Turri",
      "recipient_email": "giordano@cargill.com",
      "recipient_company": "Cargill",
      "template_title": "邀请Cargill免费试用",
      "rendered_content": "您好Giordano，...",
      "variables_used": ["firstName", "company"]
    }
  ],
  "total_recipients": 2,
  "breakdown": {
    "contacts": 1,
    "customers": 1
  },
  "message": "批量预览成功"
}
```

**支持的模板变量**:
- `{{firstName}}`: 名字
- `{{lastName}}`: 姓氏
- `{{name}}`: 全名
- `{{email}}`: 邮箱
- `{{company}}`: 公司
- `{{position}}`: 职位
- `{{domain}}`: 域名

---

## 6. 客户管理 API

### 6.1 获取客户列表

**接口**: `GET /customers/`

**描述**: 获取当前用户的客户列表

**请求参数**:
- `page` (number, 可选): 页码，默认1
- `pageSize` (number, 可选): 每页数量，默认20
- `search` (string, 可选): 搜索关键词
- `communicationProgress` (string, 可选): 沟通进度筛选（待联系/跟进中/不再跟进/暂停跟进）
- `interestLevel` (string, 可选): 兴趣程度筛选（无兴趣/低兴趣/中等兴趣/高兴趣）

**返回参数**:
```json
{
  "success": true,
  "customers": [
    {
      "id": 1,
      "user_id": 1,
      "name": "张三",
      "first_name": "三",
      "last_name": "张",
      "email": "zhangsan@example.com",
      "company": "示例公司",
      "email_count": 5,
      "communication_progress": "跟进中",
      "interest_level": "中等兴趣",
      "last_communication_time": "2024-01-01T00:00:00.000Z",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

---

### 6.2 创建客户

**接口**: `POST /customers/`

**描述**: 创建新的客户

---

### 6.3 获取单个客户

**接口**: `GET /customers/:customerId`

**描述**: 获取指定ID的客户详情

---

### 6.4 更新客户

**接口**: `PUT /customers/:customerId`

**描述**: 更新指定客户的信息

---

### 6.5 删除客户

**接口**: `DELETE /customers/:customerId`

**描述**: 删除指定客户

---

### 6.6 更新客户沟通进度

**接口**: `PATCH /customers/:customerId/progress`

**描述**: 更新指定客户的沟通进度

**请求参数**:
```json
{
  "progress": "跟进中"
}
```

**可选值**: 待联系 / 跟进中 / 不再跟进 / 暂停跟进

---

### 6.7 更新客户兴趣程度

**接口**: `PATCH /customers/:customerId/interest-level`

**描述**: 更新指定客户的兴趣程度

**请求参数**:
```json
{
  "interest_level": "高兴趣"
}
```

**可选值**: 无兴趣 / 低兴趣 / 中等兴趣 / 高兴趣

---

### 6.8 获取客户统计信息

**接口**: `GET /customers/statistics/overview`

**描述**: 获取客户相关的统计信息

**返回参数**:
```json
{
  "success": true,
  "statistics": {
    "total_customers": 100,
    "by_progress": {
      "待联系": 20,
      "跟进中": 50,
      "不再跟进": 20,
      "暂停跟进": 10
    },
    "by_interest": {
      "无兴趣": 10,
      "低兴趣": 20,
      "中等兴趣": 40,
      "高兴趣": 30
    },
    "total_emails": 500,
    "avg_emails_per_customer": 5
  },
  "message": "获取客户统计成功"
}
```

---

## 7. 用户邮箱绑定管理 API

### 7.1 绑定邮箱

**接口**: `POST /user-email-bindings/bind`

**描述**: 用户绑定新的邮箱账户

**请求参数**:
```json
{
  "email_address": "youxiangaddress@263.com",
  "email_password": "password123"
}
```

**返回参数**:
```json
{
  "success": true,
  "email_binding": {
    "id": 1,
    "user_id": 1,
    "email_address": "youxiangaddress@263.com",
    "status": "active",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "邮箱绑定成功"
}
```

---

### 7.2 获取邮箱绑定列表

**接口**: `GET /user-email-bindings/list`

**描述**: 获取当前用户的邮箱绑定列表

**请求参数**:
- `page` (number, 可选): 页码，默认1
- `pageSize` (number, 可选): 每页数量，默认5

---

### 7.3 获取单个邮箱绑定

**接口**: `GET /user-email-bindings/:bindingId`

**描述**: 获取指定ID的邮箱绑定详情

---

### 7.4 更新邮箱配置

**接口**: `PUT /user-email-bindings/:bindingId`

**描述**: 更新邮箱账户配置

---

### 7.5 删除邮箱绑定

**接口**: `DELETE /user-email-bindings/:bindingId`

**描述**: 删除指定的邮箱绑定

---

### 7.6 设置默认邮箱

**接口**: `PATCH /user-email-bindings/:bindingId/set-default`

**描述**: 设置指定邮箱为默认发件邮箱（同一用户只能有一个默认邮箱）

**返回参数**:
```json
{
  "success": true,
  "email_binding": {
    "id": 1,
    "email_address": "youxiangaddress@263.com",
    "is_default": true,
    "status": "active"
  },
  "message": "默认邮箱设置成功"
}
```

---

### 7.7 启动/暂停邮箱绑定

**接口**: `PATCH /user-email-bindings/:bindingId/status`

**描述**: 启动或暂停邮箱绑定状态

**请求参数**:
```json
{
  "status": "active"
}
```

**状态值**: active（启动）/ inactive（暂停）

---

## 8. 邮件往来记录管理 API

### 8.1 创建邮件往来记录

**接口**: `POST /email-history/`

**描述**: 手动创建邮件往来记录（一般由系统自动创建）

**请求参数**:
```json
{
  "send_address": "sender@example.com",
  "receive_address": "receiver@example.com",
  "title": "邮件主题",
  "content": "邮件内容",
  "send_time": "2024-01-01T10:00:00.000Z",
  "customer_name": "张三",
  "customer_id": 1,
  "contact_id": null
}
```

---

### 8.2 获取邮件往来记录列表（支持收件箱查询）

**接口**: `GET /email-history/`

**描述**: 获取用户的邮件往来记录列表，支持模糊搜索和收件箱查询

**请求参数**:
- `query` (string, 可选): 搜索关键词，支持标题、内容、客户名称模糊搜索
- `customer_id` (number, 可选): 客户ID筛选（查询该账户所有邮箱与该客户的往来）
- `contact_id` (number, 可选): 联系人ID筛选
- `email_type` (string, 可选): 邮件类型筛选
  - `sent`: 仅查询已发送的邮件
  - `received`: 仅查询收到的邮件（**收件箱**）
  - 不传：查询全部邮件
- `sender_email_binding_id` (number, 可选): 按发件邮箱绑定ID筛选
- `send_address` (string, 可选): 按发件邮箱地址筛选（模糊匹配）
- `receive_address` (string, 可选): 按收件邮箱地址筛选（模糊匹配）
- `page` (number, 可选): 页码，默认1
- `pageSize` (number, 可选): 每页数量，默认20

**📮 邮件筛选查询示例**:
```bash
# 1. 收件箱/发件箱查询
GET /email-history/?email_type=received          # 收件箱
GET /email-history/?email_type=sent              # 发件箱

# 2. 按客户/联系人筛选
GET /email-history/?customer_id=1                # 与客户的所有往来
GET /email-history/?customer_id=1&email_type=received  # 客户的回复
GET /email-history/?contact_id=1                 # 与联系人的所有往来

# 3. 按发件邮箱筛选
GET /email-history/?sender_email_binding_id=1    # 从指定邮箱发出的邮件
GET /email-history/?send_address=sender@263.com  # 从指定地址发出的邮件

# 4. 按收件邮箱筛选
GET /email-history/?receive_address=customer@example.com  # 发给指定地址的邮件

# 5. 组合筛选
GET /email-history/?email_type=sent&sender_email_binding_id=1  # 从指定邮箱发出的邮件
GET /email-history/?email_type=received&receive_address=customer@example.com  # 收到的来自指定地址的邮件
GET /email-history/?customer_id=1&email_type=sent  # 发给客户的邮件
```

**特别说明**: 
- **客户/联系人筛选**: 传入`customer_id`或`contact_id`时，会查询用户所有绑定邮箱与该客户/联系人邮箱的所有往来记录
- **收件箱/发件箱**: 使用 `email_type=received` 查看收件箱，`email_type=sent` 查看发件箱
- **发件邮箱筛选**: 
  - 使用 `sender_email_binding_id` 按邮箱ID筛选（精确）
  - 使用 `send_address` 按邮箱地址筛选（模糊匹配）
- **收件邮箱筛选**: 使用 `receive_address` 按收件地址筛选（模糊匹配）
- **组合查询**: 所有参数可以灵活组合使用

**返回参数**:
```json
{
  "success": true,
  "email_history": [
    {
      "id": 1,
      "user_id": 1,
      "send_address": "sender@example.com",
      "receive_address": "receiver@example.com",
      "title": "产品介绍邮件",
      "content": "邮件内容...",
      "send_time": "2024-01-01T10:00:00.000Z",
      "customer_name": "张三",
      "customer_id": 1,
      "contact_id": null,
      "sender_email_binding_id": 1,
      "email_type": "received",
      "parent_email_id": null,
      "status": "sent",
      "customer": {
        "id": 1,
        "name": "张三",
        "email": "zhangsan@example.com",
        "company": "示例公司"
      },
      "contact": null,
      "sender_email_binding": {
        "id": 1,
        "email_address": "youxiangaddress@263.com",
        "status": "active",
        "is_default": true
      },
      "created_at": "2024-01-01T10:00:00.000Z",
      "updated_at": "2024-01-01T10:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

**字段说明**:
- `sender_email_binding_id`: 发件邮箱绑定ID
- `email_type`: 邮件类型，`sent`（已发送）或 `received`（已接收）
- `parent_email_id`: 父邮件ID，如果是回复邮件则有值
- `status`: 邮件状态，`draft`（草稿）、`sending`（发送中）、`sent`（已发送）、`failed`（失败）
- `sender_email_binding`: 发件邮箱详情（如果有关联）

---

### 8.3 获取单个邮件往来记录

**接口**: `GET /email-history/:historyId`

**描述**: 获取指定ID的邮件往来记录详情

---

### 8.4 删除邮件往来记录

**接口**: `DELETE /email-history/:historyId`

**描述**: 删除指定的邮件往来记录

---

## 9. 会议视频管理 API

### 9.1 上传会议视频并自动处理

**接口**: `POST /zoom-meetings/upload`

**描述**: 上传会议视频文件，系统自动进行语音转文字和AI摘要生成

**请求方式**: `multipart/form-data`

**请求参数**:
- `video` (file, 必需): 视频文件（支持mp4, mov, avi, webm等格式）
- `customer_id` (number, 必需): 关联的客户ID
- `meeting_title` (string, 可选): 会议标题
- `meeting_date` (datetime, 可选): 会议时间

**示例请求**:
```bash
curl -X POST "http://127.0.0.1:8000/api/zoom-meetings/upload" \
  -H "Authorization: Bearer <token>" \
  -F "video=@/path/to/meeting.mp4" \
  -F "customer_id=1" \
  -F "meeting_title=产品讨论会议" \
  -F "meeting_date=2024-01-01T10:00:00.000Z"
```

**返回参数**:
```json
{
  "success": true,
  "meeting": {
    "id": 1,
    "user_id": 1,
    "customer_id": 1,
    "meeting_title": "产品讨论会议",
    "meeting_date": "2024-01-01T10:00:00.000Z",
    "video_file_name": "meeting.mp4",
    "video_file_size": 52428800,
    "status": "pending",
    "created_at": "2024-01-01T10:00:00.000Z",
    "updated_at": "2024-01-01T10:00:00.000Z"
  },
  "message": "视频上传成功，正在后台处理（语音转文字 + AI摘要）",
  "poll_url": "/api/zoom-meetings/1",
  "estimated_time": "预计处理时间: 10-60秒（取决于视频长度）"
}
```

**⚠️ 重要说明**:
- 视频处理是**异步**的，上传成功后状态为 `pending`
- 前端需要**轮询** `poll_url` 查询处理进度，直到 `status === 'completed'`
- 推荐轮询间隔：3-5秒

**处理流程**:
1. pending → 等待处理
2. processing → 开始处理
3. transcribing → 语音转文字中
4. summarizing → AI生成摘要中
5. completed → 处理完成
6. failed → 处理失败

---

### 9.2 获取会议列表

**接口**: `GET /zoom-meetings/`

**描述**: 获取用户的会议记录列表

**请求参数**:
- `customer_id` (number, 可选): 筛选指定客户的会议
- `status` (string, 可选): 筛选状态
- `page` (number, 可选): 页码，默认1
- `pageSize` (number, 可选): 每页数量，默认20

---

### 9.3 获取会议详情

**接口**: `GET /zoom-meetings/:meetingId`

**描述**: 获取指定会议的详细信息，包括完整的转录文本和AI摘要

---

### 9.4 删除会议记录

**接口**: `DELETE /zoom-meetings/:meetingId`

**描述**: 删除指定的会议记录（包括视频文件）

---

### 9.5 重新处理会议

**接口**: `POST /zoom-meetings/:meetingId/reprocess`

**描述**: 重新处理已失败的会议（重新进行语音转文字和AI摘要）

---

## 10. 客户分析 API

### 10.1 分析客户进度（实时生成）

**接口**: `POST /customer-analysis/analyze/:customerId`

**描述**: 基于客户的所有邮件往来和会议纪要，使用AI实时分析客户进度和战略建议

**路径参数**:
- `customerId` (number): 客户ID

**分析内容**:
1. **当前沟通进度** - 评估与客户的关系阶段和沟通状态
2. **机会点** - 识别采购意向、进一步沟通可能性等积极信号
3. **风险点** - 识别竞品威胁、预算问题、决策延迟等风险
4. **战略建议** - 提供具体的销售策略和攻克方法
5. **下一步行动** - 给出可执行的行动计划

**返回参数**:
```json
{
  "success": true,
  "analysis": {
    "id": 1,
    "customer_id": 1,
    "customer_name": "张三",
    "customer_first_name": "三",
    "customer_last_name": "张",
    "customer_email": "customer@example.com",
    "current_progress": "客户目前处于需求确认阶段...",
    "opportunities": [
      {
        "title": "客户明确表达采购意向",
        "description": "在最近的会议中...",
        "priority": "高"
      }
    ],
    "risks": [
      {
        "title": "竞品公司已接触客户",
        "description": "客户提到正在与竞品A...",
        "severity": "高"
      }
    ],
    "strategic_suggestions": [
      {
        "title": "提供差异化价值方案",
        "description": "针对客户的特定需求...",
        "expected_outcome": "帮助客户更快做出决策"
      }
    ],
    "next_actions": [
      {
        "action": "发送详细的产品对比方案",
        "deadline": "3天内",
        "priority": "紧急"
      }
    ],
    "email_count": 3,
    "meeting_count": 1,
    "created_at": "2024-01-01T10:00:00.000Z"
  },
  "message": "客户分析完成"
}
```

**说明**:
- 接口会**实时调用LLM**生成分析报告
- 分析结果会**自动保存到数据库**
- 分析基于**时间正序排列**的邮件和会议记录

---

### 10.2 获取客户分析历史记录

**接口**: `GET /customer-analysis/history/:customerId`

**描述**: 获取客户的历史分析记录列表

**路径参数**:
- `customerId` (number): 客户ID

**请求参数**:
- `limit` (number, 可选): 返回记录数量，默认10

---

## 11. 邮件发送与自动回复 API

### 11.1 批量发送邮件（模拟）

**接口**: `POST /emails/send-batch`

**描述**: 批量发送邮件给联系人和/或客户（模拟发送，创建邮件记录），并自动触发模拟回复

**请求参数**:
```json
{
  "template_id": 1,
  "sender_email_binding_id": 1,
  "contact_ids": [1, 2],
  "customer_ids": [3, 4]
}
```

**字段说明**:
- `template_id` (number, 必需): 邮件模板ID
- `sender_email_binding_id` (number, 可选): 发件邮箱绑定ID
  - 不传则自动使用默认邮箱（`is_default=true` 且 `status='active'`）
  - 如果没有默认邮箱，会返回错误提示
- `contact_ids` (array, 可选): 联系人ID列表
- `customer_ids` (array, 可选): 客户ID列表
- ⚠️ `contact_ids` 和 `customer_ids` 至少需要提供一个

**返回参数**:
```json
{
  "success": true,
  "message": "邮件发送成功",
  "total_sent": 4,
  "sent_emails": [
    {
      "email_id": 10,
      "recipient_type": "contact",
      "recipient_id": 1,
      "recipient_name": "Test Contact",
      "recipient_email": "test@example.com",
      "status": "sent"
    }
  ],
  "auto_reply_info": "部分收件人将在5-30秒内自动回复"
}
```

**自动化流程**:
1. ✅ 创建发送记录（email_type='sent'）
2. ✅ 随机选择30-50%的收件人
3. ✅ 5-30秒后自动生成回复（使用OpenAI）
4. ✅ 创建接收记录（email_type='received'，parent_email_id关联原邮件）
5. ✅ 如果回复者是联系人 → 自动转为客户
6. ✅ 更新客户邮件往来次数和最后沟通时间

---

### 11.2 手动触发模拟回复（调试用）

**接口**: `POST /emails/simulate-replies`

**描述**: 手动为指定邮件触发模拟回复（用于测试）

**请求参数**:
```json
{
  "email_ids": [10, 11, 12]
}
```

**返回参数**:
```json
{
  "success": true,
  "message": "模拟回复完成",
  "replies": [
    {
      "original_email_id": 10,
      "reply_email_id": 13,
      "status": "success"
    }
  ]
}
```

---

### 11.3 查看邮件线程

**接口**: `GET /emails/thread/:emailId`

**描述**: 查看邮件及其所有回复（邮件线程）

**路径参数**:
- `emailId` (number): 邮件ID

**返回参数**:
```json
{
  "success": true,
  "thread": {
    "original_email": {
      "id": 8,
      "from": "youxiangaddress@263.com",
      "to": "customer@example.com",
      "title": "邀请试用产品",
      "content": "您好...",
      "send_time": "2025-10-07T10:00:00.000Z",
      "email_type": "sent",
      "status": "sent"
    },
    "parent_email": null,
    "replies": [
      {
        "id": 9,
        "from": "customer@example.com",
        "to": "youxiangaddress@263.com",
        "title": "Re: 邀请试用产品",
        "content": "感谢您的邮件...",
        "send_time": "2025-10-07T10:05:30.000Z",
        "email_type": "received",
        "status": "sent"
      }
    ],
    "total_replies": 1
  }
}
```

---

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": "具体数据",
  "message": "操作成功消息"
}
```

### 错误响应
```json
{
  "success": false,
  "message": "错误描述",
  "error": "详细错误信息"
}
```

### HTTP状态码
- `200`: 请求成功
- `201`: 创建成功
- `400`: 请求参数错误
- `401`: 未授权（需要登录）
- `403`: 禁止访问
- `404`: 资源不存在
- `500`: 服务器内部错误

---

## 分页说明

支持分页的接口都使用以下参数：
- `page`: 页码，从1开始
- `pageSize`: 每页数量，默认20

分页响应包含：
- `total`: 总记录数
- `page`: 当前页码
- `page_size`: 每页数量
- `total_pages`: 总页数

---

## 使用示例

### 完整的业务流程示例

```bash
# 1. 用户注册
curl -X POST "http://127.0.0.1:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'

# 2. 用户登录（获取token）
TOKEN=$(curl -s -X POST "http://127.0.0.1:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }' | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

# 3. 搜索域名联系人（Hunter.io）
curl -X GET "http://127.0.0.1:8000/api/hunter/domain-search?domain=google.com&limit=5" \
  -H "Authorization: Bearer $TOKEN"

# 4. 创建联系人
curl -X POST "http://127.0.0.1:8000/api/contacts/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Katie Timmreck",
    "first_name": "Katie",
    "last_name": "Timmreck",
    "email": "katietimmreck@google.com",
    "company": "Google",
    "position": "Recruiter"
  }'

# 5. 创建邮件模板
curl -X POST "http://127.0.0.1:8000/api/email-templates/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "邀请{{company}}免费试用",
    "content": "您好{{firstName}}，..."
  }'

# 6. 批量预览邮件
curl -X POST "http://127.0.0.1:8000/api/email-templates/batch-preview" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": 1,
    "contact_ids": [1, 2, 3]
  }'

# 7. 绑定邮箱
curl -X POST "http://127.0.0.1:8000/api/user-email-bindings/bind" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email_address": "youxiangaddress@263.com",
    "email_password": "password123"
  }'

# 8. 设置默认邮箱
curl -X PATCH "http://127.0.0.1:8000/api/user-email-bindings/1/set-default" \
  -H "Authorization: Bearer $TOKEN"

# 9. 批量发送邮件（模拟）
curl -X POST "http://127.0.0.1:8000/api/emails/send-batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": 1,
    "contact_ids": [1, 2, 3]
  }'

# 10. 查询客户邮件往来
curl -X GET "http://127.0.0.1:8000/api/email-history/?customer_id=1" \
  -H "Authorization: Bearer $TOKEN"

# 11. AI分析客户
curl -X POST "http://127.0.0.1:8000/api/customer-analysis/analyze/1" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 注意事项

1. **认证**: 所有接口都需要JWT认证（除了注册和登录）
2. **分页**: 建议使用分页避免一次性返回过多数据
3. **搜索**: 搜索功能支持模糊匹配，不区分大小写
4. **标签**: 标签名称区分大小写
5. **模板变量**: 使用双花括号包围，如`{{variableName}}`
6. **错误处理**: 请根据HTTP状态码和错误信息进行相应的错误处理
7. **数据验证**: 请求参数会进行验证，请确保提供正确的数据类型和格式
8. **异步处理**: 视频处理和AI分析是异步的，需要轮询查询结果
9. **默认邮箱**: 发送邮件前建议先设置默认邮箱
10. **客户邮件查询**: 传入customer_id时，会查询该账户所有邮箱与该客户的往来记录

---

*最后更新: 2025-10-07*
*版本: v1.0*
