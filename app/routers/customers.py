"""
客户管理API路由
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import math

from ..core.database import get_db
from ..models.customer import (
    CustomerCreate, CustomerUpdate, CustomerResponse, CustomerListResponse,
    CustomerProgressUpdate, CustomerEmailCountUpdate, CommunicationProgress, InterestLevel
)
from ..services.customer_service import CustomerService
from ..routers.overseas import MockUser, get_current_user

router = APIRouter(prefix="/customers", tags=["customer-management"])


@router.get("/", response_model=CustomerListResponse)
async def get_customers(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    search: Optional[str] = Query(None, description="搜索关键词（姓名、邮箱、公司）"),
    communication_progress: Optional[CommunicationProgress] = Query(None, description="沟通进度筛选"),
    interest_level: Optional[InterestLevel] = Query(None, description="感兴趣程度筛选"),
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    获取客户列表
    
    支持分页、搜索和筛选功能
    - 按创建时间倒序排序
    - 支持按姓名、邮箱、公司搜索
    - 支持按沟通进度和感兴趣程度筛选
    """
    try:
        customer_service = CustomerService(db)
        
        # 获取客户列表
        customers, total = customer_service.get_customers(
            user_id=current_user.id,
            page=page,
            page_size=page_size,
            search_query=search,
            communication_progress=communication_progress,
            interest_level=interest_level
        )
        
        # 转换为响应模型
        customer_responses = [
            CustomerResponse(
                id=customer.id,
                user_id=customer.user_id,
                name=customer.name,
                email=customer.email,
                company=customer.company,
                email_count=customer.email_count,
                communication_progress=customer.communication_progress,
                interest_level=customer.interest_level,
                last_communication_time=customer.last_communication_time,
                current_progress=customer.current_progress,
                created_at=customer.created_at,
                updated_at=customer.updated_at
            )
            for customer in customers
        ]
        
        # 计算总页数
        total_pages = math.ceil(total / page_size) if total > 0 else 1
        
        return CustomerListResponse(
            success=True,
            customers=customer_responses,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取客户列表失败: {str(e)}"
        )


@router.post("/", response_model=CustomerResponse)
async def create_customer(
    customer_data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    创建新客户
    """
    try:
        customer_service = CustomerService(db)
        customer = customer_service.create_customer(customer_data, current_user.id)
        
        return CustomerResponse(
            id=customer.id,
            user_id=customer.user_id,
            name=customer.name,
            email=customer.email,
            company=customer.company,
            email_count=customer.email_count,
            communication_progress=customer.communication_progress,
            interest_level=customer.interest_level,
            last_communication_time=customer.last_communication_time,
            current_progress=customer.current_progress,
            created_at=customer.created_at,
            updated_at=customer.updated_at
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建客户失败: {str(e)}"
        )


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    获取单个客户详情
    """
    try:
        customer_service = CustomerService(db)
        customer = customer_service.get_customer(customer_id, current_user.id)
        
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="客户不存在"
            )
        
        return CustomerResponse(
            id=customer.id,
            user_id=customer.user_id,
            name=customer.name,
            email=customer.email,
            company=customer.company,
            email_count=customer.email_count,
            communication_progress=customer.communication_progress,
            interest_level=customer.interest_level,
            last_communication_time=customer.last_communication_time,
            current_progress=customer.current_progress,
            created_at=customer.created_at,
            updated_at=customer.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取客户失败: {str(e)}"
        )


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: int,
    customer_data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    更新客户信息
    """
    try:
        customer_service = CustomerService(db)
        customer = customer_service.update_customer(customer_id, customer_data, current_user.id)
        
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="客户不存在"
            )
        
        return CustomerResponse(
            id=customer.id,
            user_id=customer.user_id,
            name=customer.name,
            email=customer.email,
            company=customer.company,
            email_count=customer.email_count,
            communication_progress=customer.communication_progress,
            interest_level=customer.interest_level,
            last_communication_time=customer.last_communication_time,
            current_progress=customer.current_progress,
            created_at=customer.created_at,
            updated_at=customer.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新客户失败: {str(e)}"
        )


@router.patch("/{customer_id}/progress", response_model=CustomerResponse)
async def update_customer_progress(
    customer_id: int,
    progress_data: CustomerProgressUpdate,
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    更新客户进度（沟通进度、感兴趣程度、当前进度）
    """
    try:
        customer_service = CustomerService(db)
        customer = customer_service.update_customer_progress(customer_id, progress_data, current_user.id)
        
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="客户不存在"
            )
        
        return CustomerResponse(
            id=customer.id,
            user_id=customer.user_id,
            name=customer.name,
            email=customer.email,
            company=customer.company,
            email_count=customer.email_count,
            communication_progress=customer.communication_progress,
            interest_level=customer.interest_level,
            last_communication_time=customer.last_communication_time,
            current_progress=customer.current_progress,
            created_at=customer.created_at,
            updated_at=customer.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新客户进度失败: {str(e)}"
        )


@router.patch("/{customer_id}/email-count", response_model=CustomerResponse)
async def update_email_count(
    customer_id: int,
    email_data: CustomerEmailCountUpdate,
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    更新客户邮件计数
    """
    try:
        customer_service = CustomerService(db)
        customer = customer_service.update_email_count(customer_id, email_data, current_user.id)
        
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="客户不存在"
            )
        
        return CustomerResponse(
            id=customer.id,
            user_id=customer.user_id,
            name=customer.name,
            email=customer.email,
            company=customer.company,
            email_count=customer.email_count,
            communication_progress=customer.communication_progress,
            interest_level=customer.interest_level,
            last_communication_time=customer.last_communication_time,
            current_progress=customer.current_progress,
            created_at=customer.created_at,
            updated_at=customer.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新邮件计数失败: {str(e)}"
        )


@router.delete("/{customer_id}")
async def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    删除客户
    """
    try:
        customer_service = CustomerService(db)
        success = customer_service.delete_customer(customer_id, current_user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="客户不存在"
            )
        
        return {"success": True, "message": "客户删除成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除客户失败: {str(e)}"
        )


@router.get("/statistics/overview")
async def get_customer_statistics(
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    获取客户统计信息
    """
    try:
        customer_service = CustomerService(db)
        statistics = customer_service.get_customer_statistics(current_user.id)
        
        return {
            "success": True,
            "statistics": statistics
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取客户统计失败: {str(e)}"
        )
