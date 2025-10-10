"""
Hunter API路由
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List
from datetime import datetime
import logging

from ..hunter.client import HunterClient
from ..hunter.models import HunterSearchResponse, HunterSearchRequest
from ..routers.overseas import MockUser, get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/hunter", tags=["hunter-contacts"])


@router.get("/domain-search", response_model=HunterSearchResponse)
async def search_domain_contacts(
    domain: str = Query(..., description="要搜索的域名"),
    limit: int = Query(20, ge=1, le=20, description="返回结果数量限制（最大20）"),
    current_user: MockUser = Depends(get_current_user)
):
    """
    搜索域名下的联系人信息 - 简化版本
    
    通过Hunter API查询指定域名下的员工信息，返回：姓名、职位、公司、邮箱、简介
    
    Args:
        domain: 要搜索的域名（如：stripe.com）
        limit: 返回结果数量限制（最大20）
    
    Returns:
        包含联系人信息的响应
    """
    try:
        start_time = datetime.now()
        
        # 初始化Hunter客户端
        hunter_client = HunterClient()
        
        # 执行搜索
        result = await hunter_client.search_domain_contacts(
            domain=domain,
            limit=limit
        )
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Hunter API搜索失败: {result.get('error', '未知错误')}"
            )
        
        return HunterSearchResponse(
            success=True,
            domain=domain,
            contacts=result["contacts"],
            total_found=result["total_found"],
            generated_at=end_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = f"搜索域名联系人失败: {str(e)}"
        error_traceback = traceback.format_exc()
        logger.error(error_msg)
        logger.error(f"详细错误信息: {error_traceback}")
        print(f"❌ {error_msg}")
        print(f"❌ 详细错误信息: {error_traceback}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"搜索域名联系人失败: {str(e)}"
        )


@router.post("/domain-search", response_model=HunterSearchResponse)
async def search_domain_contacts_post(
    request: HunterSearchRequest,
    current_user: MockUser = Depends(get_current_user)
):
    """
    通过POST请求搜索域名下的联系人信息
    
    支持更复杂的搜索条件
    """
    try:
        start_time = datetime.now()
        
        # 初始化Hunter客户端
        hunter_client = HunterClient()
        
        # 执行搜索
        result = await hunter_client.search_domain_contacts(
            domain=request.domain,
            limit=request.limit,
            offset=request.offset,
            company=request.company,
            seniority=request.seniority,
            department=request.department
        )
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Hunter API搜索失败: {result.get('error', '未知错误')}"
            )
        
        return HunterSearchResponse(
            success=True,
            domain=request.domain,
            contacts=result["contacts"],
            company_info=result["company_info"],
            meta=result["meta"],
            generated_at=end_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = f"搜索域名联系人失败: {str(e)}"
        error_traceback = traceback.format_exc()
        logger.error(error_msg)
        logger.error(f"详细错误信息: {error_traceback}")
        print(f"❌ {error_msg}")
        print(f"❌ 详细错误信息: {error_traceback}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"搜索域名联系人失败: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Hunter API健康检查"""
    try:
        # 检查Hunter API状态
        hunter_client = HunterClient()
        hunter_health = await hunter_client.health_check()
        
        return {
            "status": "healthy" if hunter_health["status"] == "healthy" else "degraded",
            "service": "Hunter API Contact Search",
            "features": [
                "domain_contact_search",
                "company_info_extraction",
                "contact_verification",
                "seniority_filtering",
                "department_filtering"
            ],
            "data_source": "Hunter.io API",
            "hunter_status": hunter_health,
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "Hunter API Contact Search",
            "error": str(e),
            "last_updated": datetime.now().isoformat()
        }


@router.get("/test-search")
async def test_hunter_search(
    domain: str = Query("stripe.com", description="测试域名"),
    limit: int = Query(5, ge=1, le=10, description="测试结果数量")
):
    """测试Hunter API搜索功能"""
    try:
        hunter_client = HunterClient()
        
        # 执行测试搜索
        result = await hunter_client.search_domain_contacts(
            domain=domain,
            limit=limit
        )
        
        return {
            "success": True,
            "test_domain": domain,
            "result": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "test_domain": domain,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
