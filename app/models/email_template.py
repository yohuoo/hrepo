"""
邮件模板数据模型
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

from ..core.database import Base


class EmailTemplate(Base):
    """邮件模板数据表"""
    __tablename__ = "email_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    title = Column(String(200), nullable=False, index=True)  # 模板标题
    content = Column(Text, nullable=False)  # 邮件内容，支持{{变量}}格式
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 用户关联
    user = relationship("User", back_populates="email_templates")


# Pydantic模型用于API
class EmailTemplateBase(BaseModel):
    """邮件模板基础模型"""
    title: str
    content: str


class EmailTemplateCreate(EmailTemplateBase):
    """创建邮件模板模型"""
    pass


class EmailTemplateUpdate(BaseModel):
    """更新邮件模板模型"""
    title: Optional[str] = None
    content: Optional[str] = None


class EmailTemplateResponse(EmailTemplateBase):
    """邮件模板响应模型"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class EmailTemplateListResponse(BaseModel):
    """邮件模板列表响应模型"""
    success: bool
    templates: list[EmailTemplateResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class EmailTemplateRenderRequest(BaseModel):
    """邮件模板渲染请求模型"""
    template_id: int
    variables: Dict[str, Any]  # 变量替换字典，如 {"name": "张三", "company": "ABC公司"}


class EmailTemplateRenderResponse(BaseModel):
    """邮件模板渲染响应模型"""
    success: bool
    template_id: int
    title: str
    rendered_content: str  # 渲染后的内容
    variables_used: Dict[str, Any]  # 使用的变量
    variables_missing: list[str]  # 缺失的变量


class BatchPreviewRequest(BaseModel):
    """批量预览请求模型"""
    template_id: int
    contact_ids: List[int]  # 选择的联系人ID列表


class ContactPreviewItem(BaseModel):
    """单个联系人预览项"""
    contact_id: int
    contact_name: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: str
    company: str
    position: Optional[str] = None
    rendered_content: str  # 渲染后的邮件内容
    variables_used: Dict[str, Any]  # 使用的变量
    variables_missing: List[str]  # 缺失的变量


class BatchPreviewResponse(BaseModel):
    """批量预览响应模型"""
    success: bool
    template_id: int
    template_title: str
    total_contacts: int
    successful_previews: int
    failed_previews: int
    previews: List[ContactPreviewItem]  # 预览结果列表
