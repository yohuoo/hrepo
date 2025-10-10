# LLM调用包使用说明

## 概述

这个LLM调用包提供了与OpenAI API集成的联网搜索功能，专门用于搜索海外代糖公司信息。

## 功能特性

- ✅ OpenAI API集成
- ✅ 联网搜索功能
- ✅ 异步调用支持
- ✅ 错误处理和重试机制
- ✅ 数据解析和格式化
- ✅ 健康检查功能

## 安装依赖

```bash
pip install -r requirements.txt
```

## 环境配置

在 `.env` 文件中配置以下环境变量：

```env
# OpenAI配置
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=4000
OPENAI_TEMPERATURE=0.7

# LLM搜索配置
LLM_SEARCH_TIMEOUT=30
LLM_MAX_RETRIES=3
LLM_RETRY_DELAY=1.0
LLM_MAX_COMPANIES_PER_SEARCH=20
LLM_SEARCH_LANGUAGE=zh-CN
```

## 使用方法

### 1. 基本使用

```python
from app.llm.company_search import CompanySearchService

# 初始化搜索服务
search_service = CompanySearchService()

# 搜索海外代糖公司
result = await search_service.search_overseas_sugar_free_companies(
    max_results=20,
    countries=["United States", "Japan"],
    company_size="Large"
)

if result["success"]:
    companies = result["companies"]
    print(f"找到 {len(companies)} 家公司")
else:
    print(f"搜索失败: {result['error']}")
```

### 2. 按甜味剂类型搜索

```python
# 搜索罗汉果甜味剂公司
result = await search_service.search_by_specific_sweetener(
    sweetener_type="monk fruit",
    max_results=10
)
```

### 3. 按地区搜索

```python
# 搜索亚洲代糖公司
result = await search_service.search_by_region(
    region="亚洲",
    max_results=15
)
```

### 4. 获取公司详细信息

```python
# 获取特定公司信息
result = await search_service.get_company_details("Tate & Lyle PLC")
```

### 5. 健康检查

```python
# 检查LLM服务状态
health = await search_service.health_check()
print(f"服务状态: {health['status']}")
```

## API端点

### 1. 搜索海外代糖公司

```
GET /overseas/companies/sugar-free
```

参数：
- `max_results`: 最大结果数量 (1-50)
- `countries`: 指定国家列表，用逗号分隔
- `company_size`: 公司规模筛选 (small/medium/large)

示例：
```
GET /overseas/companies/sugar-free?max_results=20&countries=United States,Japan&company_size=Large
```

### 2. 健康检查

```
GET /overseas/health
```

### 3. 测试搜索

```
GET /overseas/test-search?query=海外代糖公司&max_results=5
```

## 数据结构

### 公司信息模型

```python
{
    "company_name": "公司名称",
    "website": "https://example.com",
    "description": "公司简介...",
    "country": "国家",
    "city": "城市",
    "company_size": "Large",
    "founded_year": 2020,
    "business_model": "B2B"
}
```

### 搜索响应模型

```python
{
    "success": True,
    "companies": [...],
    "total_found": 20,
    "search_query": "海外代糖公司",
    "generated_at": "2024-01-01T00:00:00",
    "error": null
}
```

## 错误处理

所有函数都包含完整的错误处理机制：

- API调用失败自动重试
- 数据解析错误跳过无效记录
- 网络超时处理
- 详细的错误日志记录

## 注意事项

1. 需要有效的OpenAI API Key
2. 联网搜索功能需要OpenAI Plus订阅
3. 建议设置合理的超时时间
4. 大量搜索请求可能产生较高费用

## 故障排除

### 常见问题

1. **API Key无效**
   - 检查环境变量 `OPENAI_API_KEY` 是否正确设置
   - 确认API Key有足够的权限

2. **网络连接问题**
   - 检查网络连接
   - 增加超时时间设置

3. **搜索结果为空**
   - 尝试不同的搜索关键词
   - 检查筛选条件是否过于严格

4. **JSON解析错误**
   - 检查OpenAI模型响应格式
   - 查看日志中的原始响应内容
