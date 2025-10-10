"""
邮箱账户数据模型
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime
from enum import Enum

from ..core.database import Base


class ConnectionStatus(str, Enum):
    """连接状态枚举"""
    UNKNOWN = "unknown"
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"


class EmailAccount(Base):
    """邮箱账户数据表"""
    __tablename__ = "email_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    email_address = Column(String(255), nullable=False, index=True)  # 邮箱地址
    email_password = Column(String(255), nullable=False)  # 邮箱密码（加密存储）
    smtp_server = Column(String(255), nullable=False)  # SMTP服务器
    smtp_port = Column(Integer, nullable=False)  # SMTP端口
    imap_server = Column(String(255), nullable=False)  # IMAP服务器
    imap_port = Column(Integer, nullable=False)  # IMAP端口
    is_ssl = Column(Boolean, default=True)  # 是否使用SSL
    is_active = Column(Boolean, default=True)  # 是否激活
    connection_status = Column(String(20), default=ConnectionStatus.UNKNOWN, index=True)  # 连接状态
    last_connection_test = Column(DateTime(timezone=True), nullable=True)  # 最后连接测试时间
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 用户关联
    user = relationship("User", back_populates="email_accounts")


# Pydantic模型用于API
class EmailAccountBase(BaseModel):
    """邮箱账户基础模型"""
    email_address: EmailStr
    email_password: str
    smtp_server: str
    smtp_port: int
    imap_server: str
    imap_port: int
    is_ssl: bool = True
    is_active: bool = True
    
    @validator('smtp_port', 'imap_port')
    def validate_ports(cls, v):
        if not (1 <= v <= 65535):
            raise ValueError('端口号必须在1-65535之间')
        return v


class EmailAccountCreate(EmailAccountBase):
    """创建邮箱账户模型"""
    pass


class EmailAccountUpdate(BaseModel):
    """更新邮箱账户模型"""
    email_password: Optional[str] = None
    smtp_server: Optional[str] = None
    smtp_port: Optional[int] = None
    imap_server: Optional[str] = None
    imap_port: Optional[int] = None
    is_ssl: Optional[bool] = None
    is_active: Optional[bool] = None
    
    @validator('smtp_port', 'imap_port')
    def validate_ports(cls, v):
        if v is not None and not (1 <= v <= 65535):
            raise ValueError('端口号必须在1-65535之间')
        return v


class EmailAccountResponse(BaseModel):
    """邮箱账户响应模型"""
    id: int
    user_id: int
    email_address: str
    smtp_server: str
    smtp_port: int
    imap_server: str
    imap_port: int
    is_ssl: bool
    is_active: bool
    connection_status: ConnectionStatus
    last_connection_test: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class EmailAccountListResponse(BaseModel):
    """邮箱账户列表响应模型"""
    success: bool
    email_accounts: list[EmailAccountResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class EmailAccountTestResponse(BaseModel):
    """邮箱账户测试响应模型"""
    success: bool
    email_account_id: int
    email_address: str
    connection_status: ConnectionStatus
    smtp_test: bool
    imap_test: bool
    error_message: Optional[str] = None
    test_time: datetime


class EmailSendRequest(BaseModel):
    """邮件发送请求模型"""
    email_account_id: int
    to_emails: list[EmailStr]  # 收件人列表
    cc_emails: Optional[list[EmailStr]] = None  # 抄送列表
    bcc_emails: Optional[list[EmailStr]] = None  # 密送列表
    subject: str  # 邮件主题
    content: str  # 邮件内容
    is_html: bool = False  # 是否为HTML格式


class EmailSendResponse(BaseModel):
    """邮件发送响应模型"""
    success: bool
    email_account_id: int
    email_address: str
    sent_count: int
    failed_count: int
    message_ids: list[str]  # 发送成功的邮件ID
    error_message: Optional[str] = None
    sent_time: datetime
