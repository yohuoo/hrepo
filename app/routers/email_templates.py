"""
邮件模板管理API路由
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import math

from ..core.database import get_db
from ..models.email_template import (
    EmailTemplateCreate, EmailTemplateUpdate, EmailTemplateResponse, 
    EmailTemplateListResponse, EmailTemplateRenderRequest, EmailTemplateRenderResponse,
    BatchPreviewRequest, BatchPreviewResponse
)
from ..services.email_template_service import EmailTemplateService
from ..routers.overseas import MockUser, get_current_user

router = APIRouter(prefix="/email-templates", tags=["email-template-management"])


@router.get("/", response_model=EmailTemplateListResponse)
async def get_email_templates(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    search: Optional[str] = Query(None, description="搜索关键词（标题、内容）"),
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    获取邮件模板列表
    
    支持分页和搜索功能
    - 按创建时间倒序排序
    - 支持按标题和内容搜索
    """
    try:
        template_service = EmailTemplateService(db)
        
        # 获取模板列表
        templates, total = template_service.get_templates(
            user_id=current_user.id,
            page=page,
            page_size=page_size,
            search_query=search
        )
        
        # 转换为响应模型
        template_responses = [
            EmailTemplateResponse(
                id=template.id,
                user_id=template.user_id,
                title=template.title,
                content=template.content,
                created_at=template.created_at,
                updated_at=template.updated_at
            )
            for template in templates
        ]
        
        # 计算总页数
        total_pages = math.ceil(total / page_size) if total > 0 else 1
        
        return EmailTemplateListResponse(
            success=True,
            templates=template_responses,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取邮件模板列表失败: {str(e)}"
        )


@router.post("/", response_model=EmailTemplateResponse)
async def create_email_template(
    template_data: EmailTemplateCreate,
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    创建新邮件模板
    
    支持在content中使用{{变量名}}格式的变量占位符
    """
    try:
        template_service = EmailTemplateService(db)
        template = template_service.create_template(template_data, current_user.id)
        
        return EmailTemplateResponse(
            id=template.id,
            user_id=template.user_id,
            title=template.title,
            content=template.content,
            created_at=template.created_at,
            updated_at=template.updated_at
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建邮件模板失败: {str(e)}"
        )


@router.get("/{template_id}", response_model=EmailTemplateResponse)
async def get_email_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    获取单个邮件模板详情
    """
    try:
        template_service = EmailTemplateService(db)
        template = template_service.get_template(template_id, current_user.id)
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="邮件模板不存在"
            )
        
        return EmailTemplateResponse(
            id=template.id,
            user_id=template.user_id,
            title=template.title,
            content=template.content,
            created_at=template.created_at,
            updated_at=template.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取邮件模板失败: {str(e)}"
        )


@router.put("/{template_id}", response_model=EmailTemplateResponse)
async def update_email_template(
    template_id: int,
    template_data: EmailTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    更新邮件模板信息
    """
    try:
        template_service = EmailTemplateService(db)
        template = template_service.update_template(template_id, template_data, current_user.id)
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="邮件模板不存在"
            )
        
        return EmailTemplateResponse(
            id=template.id,
            user_id=template.user_id,
            title=template.title,
            content=template.content,
            created_at=template.created_at,
            updated_at=template.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新邮件模板失败: {str(e)}"
        )


@router.delete("/{template_id}")
async def delete_email_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    删除邮件模板
    """
    try:
        template_service = EmailTemplateService(db)
        success = template_service.delete_template(template_id, current_user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="邮件模板不存在"
            )
        
        return {"success": True, "message": "邮件模板删除成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除邮件模板失败: {str(e)}"
        )


@router.post("/{template_id}/render", response_model=EmailTemplateRenderResponse)
async def render_email_template(
    template_id: int,
    variables: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    渲染邮件模板
    
    将模板中的{{变量名}}替换为实际值
    """
    try:
        template_service = EmailTemplateService(db)
        result = template_service.render_template(template_id, variables, current_user.id)
        
        if not result.success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="邮件模板不存在"
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"渲染邮件模板失败: {str(e)}"
        )


@router.get("/{template_id}/variables")
async def get_template_variables(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    获取模板中使用的所有变量名
    """
    try:
        template_service = EmailTemplateService(db)
        variables = template_service.get_template_variables(template_id, current_user.id)
        
        if variables is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="邮件模板不存在"
            )
        
        return {
            "success": True,
            "template_id": template_id,
            "variables": variables,
            "total_variables": len(variables)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取模板变量失败: {str(e)}"
        )


@router.post("/batch-preview", response_model=BatchPreviewResponse)
async def batch_preview_template(
    preview_request: BatchPreviewRequest,
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    批量预览邮件模板
    
    选择多个联系人，使用指定模板生成每个联系人的个性化邮件内容
    
    支持的变量：
    
    联系人信息：
    - {{name}} - 联系人完整姓名
    - {{first_name}} / {{firstName}} - 联系人名字
    - {{last_name}} / {{lastName}} - 联系人姓氏
    - {{email}} - 联系人邮箱地址
    - {{company}} / {{contact_company}} - 联系人的公司名称
    - {{position}} - 联系人职位
    - {{domain}} / {{contact_domain}} - 联系人的公司域名
    
    发送者信息（预配置）：
    - {{sender_name}} - 发送者姓名
    - {{my_company}} / {{sender_company}} - 发送者的公司名称
    - {{product_name}} - 产品名称
    - {{contact_phone}} - 联系电话
    """
    try:
        template_service = EmailTemplateService(db)
        result = template_service.batch_preview_template(
            template_id=preview_request.template_id,
            contact_ids=preview_request.contact_ids,
            user_id=current_user.id
        )
        
        if not result.success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="邮件模板不存在"
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"批量预览失败: {str(e)}"
        )
