"""
联系人管理API路由
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from datetime import datetime
import math

from ..core.database import get_db
from ..models.contact import (
    ContactCreate, ContactUpdate, ContactResponse, ContactListResponse,
    ContactTagCreate, ContactTagUpdate, ContactTagResponse
)
from ..services.contact_service import ContactService
from ..services.tag_service import TagService
from ..routers.overseas import MockUser, get_current_user

router = APIRouter(prefix="/contacts", tags=["contact-management"])


@router.get("/", response_model=ContactListResponse)
async def get_contacts(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    search: Optional[str] = Query(None, description="搜索关键词（姓名、邮箱、公司）"),
    tags: Optional[str] = Query(None, description="标签名称列表，用逗号分隔（如：VIP,重要客户）"),
    start_date: Optional[str] = Query(None, description="创建开始时间（ISO格式，如：2025-01-01T00:00:00Z）"),
    end_date: Optional[str] = Query(None, description="创建结束时间（ISO格式，如：2025-12-31T23:59:59Z）"),
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    获取联系人列表
    
    支持分页、搜索、标签筛选和时间筛选
    - 如果所有筛选条件都为空，则返回全量数据
    - 按创建时间倒序排序
    - 默认每页10条，页码从1开始
    """
    try:
        contact_service = ContactService(db)
        
        # 解析标签名称列表
        tag_names = None
        if tags:
            tag_names = [tag_name.strip() for tag_name in tags.split(",") if tag_name.strip()]
        
        # 获取联系人列表
        contacts, total = contact_service.get_contacts(
            user_id=current_user.id,
            page=page,
            page_size=page_size,
            search_query=search,
            tag_names=tag_names,
            start_date=start_date,
            end_date=end_date
        )
        
        # 转换为响应模型
        contact_responses = []
        for contact in contacts:
            # 解析标签
            tag_names = []
            if contact.tags:
                try:
                    tag_names = json.loads(contact.tags)
                except json.JSONDecodeError:
                    tag_names = []
            
            contact_responses.append(ContactResponse(
                id=contact.id,
                user_id=contact.user_id,
                name=contact.name,
                first_name=contact.first_name,
                last_name=contact.last_name,
                email=contact.email,
                company=contact.company,
                domain=contact.domain,
                position=contact.position,
                tag_names=tag_names,
                created_at=contact.created_at,
                updated_at=contact.updated_at,
                description=contact.description,
                tags=tag_names
            ))
        
        # 计算总页数
        total_pages = math.ceil(total / page_size) if total > 0 else 1
        
        return ContactListResponse(
            success=True,
            contacts=contact_responses,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取联系人列表失败: {str(e)}"
        )




@router.post("/", response_model=ContactResponse)
async def create_contact(
    contact_data: ContactCreate,
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    创建新联系人
    """
    try:
        contact_service = ContactService(db)
        contact = contact_service.create_contact(contact_data, current_user.id)
        
        # 解析标签
        tag_names = []
        if contact.tags:
            try:
                tag_names = json.loads(contact.tags)
            except json.JSONDecodeError:
                tag_names = []
        
        return ContactResponse(
            id=contact.id,
            user_id=contact.user_id,
            name=contact.name,
            first_name=contact.first_name,
            last_name=contact.last_name,
            email=contact.email,
            company=contact.company,
            domain=contact.domain,
            position=contact.position,
            tag_names=tag_names,
            created_at=contact.created_at,
            updated_at=contact.updated_at,
            description=contact.description,
            tags=tag_names
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建联系人失败: {str(e)}"
        )


@router.get("/{contact_id}", response_model=ContactResponse)
async def get_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    获取单个联系人详情
    """
    try:
        contact_service = ContactService(db)
        contact = contact_service.get_contact_with_tags(contact_id, current_user.id)
        
        if not contact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="联系人不存在"
            )
        
        # 解析标签
        tag_names = []
        if contact.tags:
            try:
                tag_names = json.loads(contact.tags)
            except json.JSONDecodeError:
                tag_names = []
        
        return ContactResponse(
            id=contact.id,
            user_id=contact.user_id,
            name=contact.name,
            first_name=contact.first_name,
            last_name=contact.last_name,
            email=contact.email,
            company=contact.company,
            domain=contact.domain,
            position=contact.position,
            tag_names=tag_names,
            created_at=contact.created_at,
            updated_at=contact.updated_at,
            description=contact.description,
            tags=tag_names
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取联系人失败: {str(e)}"
        )


@router.put("/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: int,
    contact_data: ContactUpdate,
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    更新联系人信息
    """
    try:
        contact_service = ContactService(db)
        contact = contact_service.update_contact(contact_id, contact_data, current_user.id)
        
        if not contact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="联系人不存在"
            )
        
        # 解析标签
        tag_names = []
        if contact.tags:
            try:
                tag_names = json.loads(contact.tags)
            except json.JSONDecodeError:
                tag_names = []
        
        return ContactResponse(
            id=contact.id,
            user_id=contact.user_id,
            name=contact.name,
            first_name=contact.first_name,
            last_name=contact.last_name,
            email=contact.email,
            company=contact.company,
            domain=contact.domain,
            position=contact.position,
            tag_names=tag_names,
            created_at=contact.created_at,
            updated_at=contact.updated_at,
            description=contact.description,
            tags=tag_names
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新联系人失败: {str(e)}"
        )


@router.delete("/{contact_id}")
async def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    删除联系人
    """
    try:
        contact_service = ContactService(db)
        success = contact_service.delete_contact(contact_id, current_user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="联系人不存在"
            )
        
        return {"success": True, "message": "联系人删除成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除联系人失败: {str(e)}"
        )


@router.post("/{contact_id}/tags/{tag_id}")
async def add_tag_to_contact(
    contact_id: int,
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    给联系人添加标签
    """
    try:
        contact_service = ContactService(db)
        success = contact_service.add_tag_to_contact(contact_id, tag_id, current_user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="联系人或标签不存在"
            )
        
        return {"success": True, "message": "标签添加成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"添加标签失败: {str(e)}"
        )


@router.delete("/{contact_id}/tags/{tag_id}")
async def remove_tag_from_contact(
    contact_id: int,
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    从联系人移除标签
    """
    try:
        contact_service = ContactService(db)
        success = contact_service.remove_tag_from_contact(contact_id, tag_id, current_user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="联系人或标签不存在"
            )
        
        return {"success": True, "message": "标签移除成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"移除标签失败: {str(e)}"
        )


# 标签管理接口
@router.get("/tags/", response_model=List[ContactTagResponse])
async def get_tags(
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    获取用户的所有标签
    """
    try:
        tag_service = TagService(db)
        tags = tag_service.get_tags(current_user.id)
        return tags
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取标签列表失败: {str(e)}"
        )


@router.post("/tags/", response_model=ContactTagResponse)
async def create_tag(
    tag_data: ContactTagCreate,
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    创建新标签
    """
    try:
        tag_service = TagService(db)
        
        # 检查标签名称是否已存在
        existing_tag = tag_service.get_tag_by_name(tag_data.name, current_user.id)
        if existing_tag:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="标签名称已存在"
            )
        
        tag = tag_service.create_tag(tag_data, current_user.id)
        return tag
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建标签失败: {str(e)}"
        )


@router.put("/tags/{tag_id}", response_model=ContactTagResponse)
async def update_tag(
    tag_id: int,
    tag_data: ContactTagUpdate,
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    更新标签信息
    """
    try:
        tag_service = TagService(db)
        tag = tag_service.update_tag(tag_id, tag_data, current_user.id)
        
        if not tag:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="标签不存在"
            )
        
        return tag
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新标签失败: {str(e)}"
        )


@router.delete("/tags/{tag_id}")
async def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    删除标签
    """
    try:
        tag_service = TagService(db)
        success = tag_service.delete_tag(tag_id, current_user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="标签不存在"
            )
        
        return {"success": True, "message": "标签删除成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除标签失败: {str(e)}"
        )
