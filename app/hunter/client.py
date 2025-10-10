"""
Hunter API客户端
"""

import aiohttp
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging

from .config import hunter_config

logger = logging.getLogger(__name__)


class HunterClient:
    """Hunter API客户端类"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or hunter_config.hunter_api_key
        self.base_url = hunter_config.hunter_base_url
        self.timeout = hunter_config.request_timeout
        
        if not self.api_key:
            raise ValueError("Hunter API Key is required")
    
    async def search_domain_contacts(
        self, 
        domain: str,
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        搜索域名下的联系人信息 - 简化版本
        
        Args:
            domain: 域名
            limit: 返回结果数量限制（最大20）
            
        Returns:
            包含联系人信息的字典
        """
        try:
            # 限制最大数量为20
            limit = min(limit, 20)
            
            # 构建请求参数
            params = {
                "domain": domain,
                "api_key": self.api_key,
                "limit": limit
            }
            
            # 发送请求
            response = await self._make_request("/domain-search", params)
            
            if response.get("data"):
                # 处理联系人数据，转换为简化格式
                contacts = []
                company_name = response["data"].get("organization", "Unknown Company")
                
                for email_data in response["data"].get("emails", []):
                    # 构建姓名
                    first_name = email_data.get("first_name", "")
                    last_name = email_data.get("last_name", "")
                    name = f"{first_name} {last_name}".strip()
                    
                    # 构建职位
                    position = email_data.get("position", "Unknown Position")
                    
                    # 构建简介
                    description = f"{position} at {company_name}"
                    if email_data.get("department"):
                        description += f" ({email_data['department']} department)"
                    
                    contact = {
                        "name": name,
                        "first_name": first_name,
                        "last_name": last_name,
                        "position": position,
                        "company": company_name,
                        "email": email_data.get("value", ""),
                        "description": description
                    }
                    contacts.append(contact)
                
                return {
                    "success": True,
                    "domain": domain,
                    "contacts": contacts,
                    "total_found": len(contacts),
                    "generated_at": datetime.now().isoformat()
                }
            else:
                return {
                    "success": False,
                    "domain": domain,
                    "contacts": [],
                    "error": "未找到联系人信息",
                    "generated_at": datetime.now().isoformat()
                }
                
        except Exception as e:
            import traceback
            error_msg = f"Hunter API搜索失败: {str(e)}"
            error_traceback = traceback.format_exc()
            logger.error(error_msg)
            logger.error(f"详细错误信息: {error_traceback}")
            print(f"❌ Hunter API搜索失败: {error_msg}")
            print(f"❌ 详细错误信息: {error_traceback}")
            return {
                "success": False,
                "domain": domain,
                "contacts": [],
                "error": str(e),
                "error_traceback": error_traceback,
                "generated_at": datetime.now().isoformat()
            }
    
    async def _make_request(self, endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """发送HTTP请求到Hunter API"""
        url = f"{self.base_url}{endpoint}"
        
        async with aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=self.timeout)
        ) as session:
            async with session.get(url, params=params) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Hunter API调用失败: {response.status} - {error_text}")
                
                result = await response.json()
                print(f"🔍 Hunter API响应: {result}")
                return result
    
    async def health_check(self) -> Dict[str, Any]:
        """健康检查"""
        try:
            # 使用一个简单的域名进行测试
            test_result = await self.search_domain_contacts("example.com", limit=1)
            
            return {
                "status": "healthy",
                "api_accessible": True,
                "last_check": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "api_accessible": False,
                "error": str(e),
                "last_check": datetime.now().isoformat()
            }
