from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List
from pydantic import BaseModel, HttpUrl
from datetime import datetime
import json
import re
from ..core.config import settings
from ..llm.company_search import CompanySearchService


class MockUser:
    """模拟用户类，用于临时替代认证"""
    def __init__(self):
        self.id = 1
        self.username = "demo_user"
        self.email = "demo@example.com"
        self.is_admin = False
        self.is_active = True


class OverseasCompany(BaseModel):
    """海外公司信息模型"""
    company_name: str
    website: Optional[HttpUrl] = None
    description: str
    country: str
    city: Optional[str] = None


class OverseasCompanySearchResponse(BaseModel):
    """海外公司搜索响应"""
    success: bool
    total_found: int
    companies: List[OverseasCompany]
    search_query: str
    generated_at: datetime
    search_duration: Optional[float] = None
    error_message: Optional[str] = None


def get_current_user() -> MockUser:
    """获取当前用户（临时模拟实现）"""
    return MockUser()


router = APIRouter(prefix="/overseas", tags=["overseas-search"])


async def search_overseas_sugar_free_companies(max_results: int = 20) -> List[OverseasCompany]:
    """
    使用LLM function_call搜索获取海外代糖公司数据 - 简化版本
    """
    try:
        # 初始化LLM搜索服务
        search_service = CompanySearchService()
        
        # 调用LLM function_call搜索
        search_result = await search_service.search_overseas_sugar_free_companies(
            max_results=max_results
        )
        
        print(f"🔍 Function Call搜索结果: 成功={search_result['success']}, 公司数量={len(search_result.get('companies', []))}")
        
        if not search_result["success"]:
            print(f"❌ Function Call搜索失败: {search_result.get('error', '未知错误')}")
            return []
        
        # 将搜索结果转换为OverseasCompany对象
        companies = []
        companies_data = search_result.get("companies", [])
        print(f"🔍 开始转换 {len(companies_data)} 家公司数据...")
        
        for i, company_data in enumerate(companies_data):
            try:
                print(f"🔍 转换第 {i+1} 家公司: {company_data.get('company_name', 'Unknown')}")
                company = OverseasCompany(
                    company_name=company_data["company_name"],
                    website=company_data.get("website"),
                    description=company_data["description"],
                    country=company_data["country"],
                    city=company_data.get("city"),
                )
                companies.append(company)
                print(f"✅ 成功转换: {company.company_name}")
            except Exception as e:
                print(f"❌ 跳过无效公司数据: {company_data.get('company_name', 'Unknown')}, 错误: {e}")
                continue
        
        print(f"🔍 转换完成，成功转换 {len(companies)} 家公司")
        return companies
        
    except Exception as e:
        import traceback
        error_msg = f"Function Call搜索服务调用失败: {str(e)}"
        error_traceback = traceback.format_exc()
        print(f"❌ {error_msg}")
        print(f"❌ 详细错误信息: {error_traceback}")
        return []


@router.get("/companies/sugar-free", response_model=OverseasCompanySearchResponse)
async def get_overseas_sugar_free_companies(
    current_user: MockUser = Depends(get_current_user)
):
    """
    获取海外代糖产业相关公司列表
    
    通过LLM大模型联网搜索获取全球范围内的海外代糖产业相关公司信息，包括：
    - 公司名称
    - 公司官网
    - 公司简介
    - 国家和城市
    
    数据来源：LLM function call联网搜索实时获取
    搜索范围：全球范围内，不限定国家
    默认返回：20个公司的详细信息
    """
    try:
        start_time = datetime.now()
        
        # 使用LLM function_call搜索获取全球范围内的海外代糖公司数据
        companies = await search_overseas_sugar_free_companies(max_results=5)
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        return OverseasCompanySearchResponse(
            success=True,
            total_found=len(companies),
            companies=companies,
            search_query="全球海外代糖产业公司",
            generated_at=end_time,
            search_duration=duration
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取海外代糖公司列表失败: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """健康检查"""
    try:
        # 检查LLM服务状态
        search_service = CompanySearchService()
        llm_health = await search_service.health_check()
        
        return {
            "status": "healthy" if llm_health["status"] == "healthy" else "degraded",
            "service": "Overseas Company Search",
            "features": [
                "sugar_free_companies_search",
                "llm_web_search_integration",
                "real_time_data_fetching",
                "multi_country_support",
            ],
            "data_source": "LLM Function Call Web Search",
            "llm_status": llm_health,
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "Overseas Company Search",
            "error": str(e),
            "last_updated": datetime.now().isoformat()
        }


@router.get("/test-search")
async def test_llm_search(
    query: str = Query("海外代糖公司", description="测试搜索查询"),
    max_results: int = Query(5, ge=1, le=10, description="测试结果数量")
):
    """测试LLM搜索功能"""
    try:
        search_service = CompanySearchService()
        
        # 执行测试搜索
        result = await search_service.search_overseas_sugar_free_companies(
            max_results=max_results
        )
        
        return {
            "success": True,
            "test_query": query,
            "result": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "test_query": query,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
