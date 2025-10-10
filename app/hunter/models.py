"""
Hunter API数据模型
"""

from pydantic import BaseModel, HttpUrl, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


class ContactSource(BaseModel):
    """联系人信息来源"""
    domain: str
    uri: str
    extracted_on: str
    last_seen_on: str
    still_on_page: bool


class ContactVerification(BaseModel):
    """联系人验证信息"""
    date: Optional[str] = None
    status: Optional[str] = None


class Contact(BaseModel):
    """联系人信息 - 简化版本"""
    name: str  # 姓名
    first_name: Optional[str] = None  # 名字
    last_name: Optional[str] = None  # 姓氏
    position: str  # 职位
    company: str  # 公司
    email: EmailStr  # 邮箱
    description: str  # 简介


class CompanyInfo(BaseModel):
    """公司信息"""
    organization: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    headcount: Optional[str] = None
    company_type: Optional[str] = None


class HunterSearchResponse(BaseModel):
    """Hunter搜索响应 - 简化版本"""
    success: bool
    domain: str
    contacts: List[Contact]
    total_found: int
    generated_at: datetime
    error: Optional[str] = None


class HunterSearchRequest(BaseModel):
    """Hunter搜索请求"""
    domain: str
    limit: int = 10
    offset: int = 0
    company: Optional[str] = None
    seniority: Optional[str] = None
    department: Optional[str] = None
