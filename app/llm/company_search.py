"""
公司搜索服务
专门用于搜索海外代糖公司信息
"""

import asyncio
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from .openai_client import OpenAIClient
from .config import llm_config

logger = logging.getLogger(__name__)


class CompanySearchService:
    """公司搜索服务类"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.client = OpenAIClient(api_key)
        self.max_companies = llm_config.max_companies_per_search
    
    async def search_overseas_sugar_free_companies(
        self,
        max_results: int = 20
    ) -> Dict[str, Any]:
        """
        搜索海外代糖公司 - 简化版本
        
        Args:
            max_results: 最大结果数量
            
        Returns:
            包含公司信息的字典
        """
        try:
            # 直接调用function_call搜索
            result = await self.client.search_companies_with_function_call(
                query="全球代糖公司 甜味剂公司的相关信息",
                max_results=max_results
            )
            
            print(f"🔍 Function Call搜索结果: {result}")
            
            if not result["success"]:
                return result
            
            # 直接返回function_call的结果
            raw_response = result["raw_response"]
            if raw_response and "companies" in raw_response:
                companies = raw_response["companies"]
                return {
                    "success": True,
                    "companies": companies,
                    "total_found": len(companies),
                    "search_query": "全球代糖公司",
                    "generated_at": datetime.now().isoformat()
                }
            else:
                return {
                    "success": False,
                    "companies": [],
                    "total_found": 0,
                    "search_query": "全球代糖公司",
                    "error": "Function call未返回有效的公司数据",
                    "generated_at": datetime.now().isoformat()
                }
            
        except Exception as e:
            import traceback
            error_msg = f"公司搜索服务失败: {str(e)}"
            error_traceback = traceback.format_exc()
            logger.error(error_msg)
            logger.error(f"详细错误信息: {error_traceback}")
            print(f"❌ 公司搜索服务失败: {error_msg}")
            print(f"❌ 详细错误信息: {error_traceback}")
            return {
                "success": False,
                "companies": [],
                "total_found": 0,
                "search_query": "全球代糖公司",
                "error": str(e),
                "error_traceback": error_traceback,
                "generated_at": datetime.now().isoformat()
            }
    
    def _build_search_query(
        self,
        countries: Optional[List[str]] = None,
        company_size: Optional[str] = None,
        business_model: Optional[str] = None
    ) -> str:
        """构建搜索查询"""
        query_parts = ["全球代糖公司", "甜味剂公司", "天然甜味剂"]
        
        if countries:
            country_str = " ".join(countries)
            query_parts.append(f"({country_str})")
        
        if company_size:
            query_parts.append(f"{company_size}规模")
        
        if business_model:
            query_parts.append(f"{business_model}模式")
        
        return " ".join(query_parts)
    
    async def search_by_specific_sweetener(
        self,
        sweetener_type: str,
        max_results: int = 15
    ) -> Dict[str, Any]:
        """
        按特定甜味剂类型搜索公司
        
        Args:
            sweetener_type: 甜味剂类型（如：stevia, monk fruit, aspartame等）
            max_results: 最大结果数量
            
        Returns:
            包含公司信息的字典
        """
        search_query = f"海外{sweetener_type}甜味剂公司 {sweetener_type}生产商"
        
        return await self.client.search_companies_with_web_search(
            query=search_query,
            max_results=max_results
        )
    
    async def search_by_region(
        self,
        region: str,
        max_results: int = 15
    ) -> Dict[str, Any]:
        """
        按地区搜索代糖公司
        
        Args:
            region: 地区（如：北美、欧洲、亚洲等）
            max_results: 最大结果数量
            
        Returns:
            包含公司信息的字典
        """
        search_query = f"{region}代糖公司 {region}甜味剂企业"
        
        return await self.client.search_companies_with_web_search(
            query=search_query,
            max_results=max_results
        )
    
    async def get_company_details(
        self,
        company_name: str
    ) -> Dict[str, Any]:
        """
        获取特定公司的详细信息
        
        Args:
            company_name: 公司名称
            
        Returns:
            公司详细信息
        """
        search_query = f"{company_name} 公司信息 代糖业务 甜味剂产品"
        
        result = await self.client.search_companies_with_web_search(
            query=search_query,
            max_results=1
        )
        
        if result["success"] and result["companies"]:
            return {
                "success": True,
                "company": result["companies"][0],
                "generated_at": datetime.now().isoformat()
            }
        else:
            return {
                "success": False,
                "company": None,
                "error": "未找到公司信息",
                "generated_at": datetime.now().isoformat()
            }
    
    async def health_check(self) -> Dict[str, Any]:
        """健康检查"""
        return await self.client.health_check()
