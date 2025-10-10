"""
联系人数据模型
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

from ..core.database import Base

# 联系人标签关联表
contact_tag_association = Table(
    'contact_tag_associations',
    Base.metadata,
    Column('contact_id', Integer, ForeignKey('contacts.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('contact_tags.id'), primary_key=True)
)


class Contact(Base):
    """联系人数据表 - 简化版本"""
    __tablename__ = "contacts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    name = Column(String(200), nullable=False, index=True)  # 联系人姓名
    first_name = Column(String(100), nullable=True, index=True)  # 名字
    last_name = Column(String(100), nullable=True, index=True)  # 姓氏
    email = Column(String(255), nullable=False, index=True)  # 邮箱
    company = Column(String(200), nullable=False, index=True)  # 公司
    domain = Column(String(255), nullable=True)  # 公司域名
    position = Column(String(200), nullable=True)  # 职位
    tags = Column(Text, nullable=True)  # 存储标签的JSON字符串，如["VIP", "重要客户"]
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 用户关联
    user = relationship("User", back_populates="contacts")
    
    @property
    def description(self):
        """获取描述信息"""
        desc_parts = []
        if self.position:
            desc_parts.append(self.position)
        if self.company:
            desc_parts.append(f"at {self.company}")
        return " ".join(desc_parts) if desc_parts else "No description"


class ContactTag(Base):
    """联系人标签表 - 简化版本"""
    __tablename__ = "contact_tags"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    name = Column(String(50), nullable=False)  # 标签名称，如"VIP", "重要客户"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 用户关联
    user = relationship("User", back_populates="contact_tags")


# Pydantic模型用于API
class ContactBase(BaseModel):
    """联系人基础模型"""
    name: str
    first_name: Optional[str] = None  # 名字
    last_name: Optional[str] = None  # 姓氏
    email: EmailStr
    company: str
    domain: Optional[str] = None  # 公司域名
    position: Optional[str] = None
    tag_names: Optional[List[str]] = None  # 标签名称列表，如["VIP", "重要客户"]


class ContactCreate(ContactBase):
    """创建联系人模型"""
    pass


class ContactUpdate(BaseModel):
    """更新联系人模型"""
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    company: Optional[str] = None
    domain: Optional[str] = None
    position: Optional[str] = None
    tag_names: Optional[List[str]] = None


class ContactResponse(ContactBase):
    """联系人响应模型"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    description: str  # 使用@property获取
    tags: List[str] = []  # 标签名称列表
    
    class Config:
        from_attributes = True


class ContactTagBase(BaseModel):
    """标签基础模型"""
    name: str


class ContactTagCreate(ContactTagBase):
    """创建标签模型"""
    pass


class ContactTagUpdate(BaseModel):
    """更新标签模型"""
    name: Optional[str] = None


class ContactTagResponse(ContactTagBase):
    """标签响应模型"""
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class ContactListResponse(BaseModel):
    """联系人列表响应模型"""
    success: bool
    contacts: List[ContactResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# 更新前向引用
ContactResponse.model_rebuild()
