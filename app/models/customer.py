"""
客户数据模型
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime
from enum import Enum

from ..core.database import Base


class CommunicationProgress(str, Enum):
    """沟通进度枚举"""
    PENDING = "待联系"
    FOLLOWING = "跟进中"
    NO_FOLLOW = "不再跟进"
    PAUSED = "暂停跟进"


class InterestLevel(str, Enum):
    """客户感兴趣程度枚举"""
    NO_INTEREST = "无兴趣"
    LOW_INTEREST = "低兴趣"
    MEDIUM_INTEREST = "中等兴趣"
    HIGH_INTEREST = "高兴趣"


class Customer(Base):
    """客户数据表"""
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    name = Column(String(200), nullable=False, index=True)  # 客户姓名
    email = Column(String(255), nullable=False, index=True)  # 邮件地址
    company = Column(String(200), nullable=False, index=True)  # 公司
    email_count = Column(Integer, default=0)  # 来往邮件次数
    communication_progress = Column(String(20), default=CommunicationProgress.PENDING, index=True)  # 沟通进度
    interest_level = Column(String(20), default=InterestLevel.NO_INTEREST, index=True)  # 客户感兴趣程度
    last_communication_time = Column(DateTime(timezone=True), nullable=True)  # 最近沟通时间
    current_progress = Column(Text, nullable=True)  # 当前进度
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 用户关联
    user = relationship("User", back_populates="customers")


# Pydantic模型用于API
class CustomerBase(BaseModel):
    """客户基础模型"""
    name: str
    email: EmailStr
    company: str
    email_count: int = 0
    communication_progress: CommunicationProgress = CommunicationProgress.PENDING
    interest_level: InterestLevel = InterestLevel.NO_INTEREST
    last_communication_time: Optional[datetime] = None
    current_progress: Optional[str] = None


class CustomerCreate(CustomerBase):
    """创建客户模型"""
    pass


class CustomerUpdate(BaseModel):
    """更新客户模型"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    company: Optional[str] = None
    email_count: Optional[int] = None
    communication_progress: Optional[CommunicationProgress] = None
    interest_level: Optional[InterestLevel] = None
    last_communication_time: Optional[datetime] = None
    current_progress: Optional[str] = None


class CustomerResponse(CustomerBase):
    """客户响应模型"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class CustomerListResponse(BaseModel):
    """客户列表响应模型"""
    success: bool
    customers: list[CustomerResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class CustomerProgressUpdate(BaseModel):
    """客户进度更新模型"""
    communication_progress: Optional[CommunicationProgress] = None
    interest_level: Optional[InterestLevel] = None
    current_progress: Optional[str] = None
    last_communication_time: Optional[datetime] = None


class CustomerEmailCountUpdate(BaseModel):
    """客户邮件计数更新模型"""
    email_count: int
    last_communication_time: Optional[datetime] = None
