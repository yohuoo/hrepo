"""
OpenAI客户端封装
提供联网搜索和LLM调用功能
"""

import json
import asyncio
import aiohttp
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging

from .config import llm_config

logger = logging.getLogger(__name__)


class OpenAIClient:
    """OpenAI客户端封装类"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or llm_config.openai_api_key
        self.model = llm_config.openai_model
        self.temperature = llm_config.openai_temperature
        self.max_tokens = llm_config.openai_max_tokens
        self.base_url = llm_config.openai_base_url
        
        if not self.api_key:
            raise ValueError("OpenAI API Key is required")
    
    async def search_companies_with_function_call(
        self, 
        query: str, 
        max_results: int = 20
    ) -> Dict[str, Any]:
        """
        使用OpenAI function_call搜索公司信息
        
        Args:
            query: 搜索查询
            max_results: 最大结果数量
            
        Returns:
            包含公司信息的字典
        """
        try:
            # 构建简单的提示词
            search_prompt = f"请搜索{query}，返回{max_results}家公司的详细信息。"
            
            # 调用OpenAI API with function_call
            response = await self._call_openai_api_with_function_call(search_prompt)
            
            print(f"🔍 Function Call原始响应: {response}")
            
            # 直接返回响应，让上层处理
            return {
                "success": True,
                "raw_response": response,
                "search_query": query,
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            import traceback
            error_msg = f"OpenAI function_call搜索失败: {str(e)}"
            error_traceback = traceback.format_exc()
            logger.error(error_msg)
            logger.error(f"详细错误信息: {error_traceback}")
            print(f"❌ OpenAI function_call搜索失败: {error_msg}")
            print(f"❌ 详细错误信息: {error_traceback}")
            return {
                "success": False,
                "raw_response": None,
                "search_query": query,
                "error": str(e),
                "error_traceback": error_traceback,
                "generated_at": datetime.now().isoformat()
            }
    
    def _build_company_search_prompt(
        self, 
        query: str, 
        max_results: int, 
        countries: Optional[List[str]] = None
    ) -> str:
        """构建公司搜索提示词"""
        
        country_filter = ""
        if countries:
            country_list = ", ".join(countries)
            country_filter = f"请重点关注以下国家的公司: {country_list}。"
        
        prompt = f"""
你是一个专业的商业信息搜索助手。请直接搜索并返回海外代糖产业相关的公司信息。

搜索要求：
1. 搜索关键词：{query}
2. 返回公司数量：最多{max_results}个
3. {country_filter}
4. 重点关注：甜味剂、代糖、天然甜味剂、人工甜味剂等相关公司

请直接以JSON格式返回结果，不要进行对话确认。格式如下：
{{
    "companies": [
        {{
            "company_name": "公司名称",
            "website": "https://example.com",
            "description": "公司简介...",
            "country": "国家",
            "city": "城市",
            "company_size": "Large",
            "founded_year": 2020,
            "business_model": "B2B"
        }}
    ]
}}

重要要求：
1. 直接返回JSON格式，不要任何解释或确认
2. 公司确实与代糖产业相关
3. 信息准确可靠
4. 返回有效的JSON格式
5. 不要询问任何问题，直接提供结果
"""
        return prompt
    
    async def _call_openai_api_with_function_call(self, prompt: str) -> str:
        """使用function_call调用OpenAI API"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # 定义function_call工具
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "search_companies",
                    "description": "搜索全球代糖产业相关的公司信息",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "companies": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "company_name": {
                                            "type": "string",
                                            "description": "公司名称"
                                        },
                                        "website": {
                                            "type": "string",
                                            "description": "公司官网"
                                        },
                                        "description": {
                                            "type": "string",
                                            "description": "公司简介"
                                        },
                                        "country": {
                                            "type": "string",
                                            "description": "所在国家"
                                        },
                                        "city": {
                                            "type": "string",
                                            "description": "所在城市"
                                        },
                                    },
                                    "required": ["company_name", "website"]
                                }
                            }
                        },
                        "required": ["companies"]
                    }
                }
            }
        ]
        
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "你是一个专业的商业信息搜索助手。请搜索全球代糖产业相关的公司信息。"
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "tools": tools,
            "tool_choice": {"type": "function", "function": {"name": "search_companies"}}
        }
        
        # 根据模型类型使用不同的参数
        if "gpt-5" in self.model.lower():
            payload["max_completion_tokens"] = self.max_tokens
        else:
            payload["max_tokens"] = self.max_tokens
            payload["temperature"] = self.temperature
        
        print(f"🔍 发送的payload: {json.dumps(payload, indent=2, ensure_ascii=False)}")
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=llm_config.search_timeout)
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"OpenAI API调用失败: {response.status} - {error_text}")
                
                result = await response.json()
                print(f"🔍 完整API响应: {json.dumps(result, indent=2, ensure_ascii=False)}")
                
                # 提取function_call结果
                message = result["choices"][0]["message"]
                if "tool_calls" in message and message["tool_calls"]:
                    function_call = message["tool_calls"][0]["function"]
                    function_args = json.loads(function_call["arguments"])
                    return function_args
                else:
                    # 如果没有function_call，返回content
                    return message.get("content", "")
    
    def _parse_company_response(self, response: str) -> List[Dict[str, Any]]:
        """解析OpenAI响应中的公司信息"""
        try:
            print(f"🔍 开始解析LLM响应，响应长度: {len(response)}")
            
            # 尝试提取JSON部分
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            
            print(f"🔍 JSON位置: start={json_start}, end={json_end}")
            
            if json_start == -1 or json_end == 0:
                print(f"❌ 未找到有效的JSON格式")
                print(f"❌ 原始响应前500字符: {response[:500]}")
                raise ValueError("未找到有效的JSON格式")
            
            json_str = response[json_start:json_end]
            print(f"🔍 提取的JSON字符串长度: {len(json_str)}")
            print(f"🔍 JSON字符串前200字符: {json_str[:200]}")
            
            data = json.loads(json_str)
            print(f"🔍 JSON解析成功，数据类型: {type(data)}")
            
            if "companies" not in data:
                print(f"❌ 响应中缺少companies字段，可用字段: {list(data.keys())}")
                raise ValueError("响应中缺少companies字段")
            
            companies = data["companies"]
            print(f"✅ 成功解析到 {len(companies)} 家公司")
            return companies
            
        except json.JSONDecodeError as e:
            error_msg = f"JSON解析失败: {str(e)}"
            logger.error(error_msg)
            logger.error(f"原始响应: {response}")
            print(f"❌ {error_msg}")
            print(f"❌ 原始响应: {response}")
            return []
        except Exception as e:
            error_msg = f"响应解析失败: {str(e)}"
            logger.error(error_msg)
            print(f"❌ {error_msg}")
            import traceback
            print(f"❌ 详细错误: {traceback.format_exc()}")
            return []
    
    async def health_check(self) -> Dict[str, Any]:
        """健康检查"""
        try:
            # 简单的API调用测试
            test_prompt = "请简单回复'OK'"
            response = await self._call_openai_api(test_prompt)
            
            return {
                "status": "healthy",
                "model": self.model,
                "api_accessible": True,
                "last_check": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "model": self.model,
                "api_accessible": False,
                "error": str(e),
                "last_check": datetime.now().isoformat()
            }
