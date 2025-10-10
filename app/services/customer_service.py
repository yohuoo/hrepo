"""
客户服务层
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional, Tuple
import math
from datetime import datetime

from ..models.customer import (
    Customer, CustomerCreate, CustomerUpdate, CustomerProgressUpdate, CustomerEmailCountUpdate,
    CommunicationProgress, InterestLevel
)


class CustomerService:
    """客户服务类"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_customer(self, customer_data: CustomerCreate, user_id: int) -> Customer:
        """创建客户"""
        db_customer = Customer(
            user_id=user_id,
            name=customer_data.name,
            email=customer_data.email,
            company=customer_data.company,
            email_count=customer_data.email_count,
            communication_progress=customer_data.communication_progress,
            interest_level=customer_data.interest_level,
            last_communication_time=customer_data.last_communication_time,
            current_progress=customer_data.current_progress
        )
        self.db.add(db_customer)
        self.db.commit()
        self.db.refresh(db_customer)
        return db_customer
    
    def get_customer(self, customer_id: int, user_id: int) -> Optional[Customer]:
        """获取单个客户"""
        return self.db.query(Customer).filter(
            and_(Customer.id == customer_id, Customer.user_id == user_id)
        ).first()
    
    def get_customers(
        self, 
        user_id: int, 
        page: int = 1, 
        page_size: int = 20,
        search_query: Optional[str] = None,
        communication_progress: Optional[CommunicationProgress] = None,
        interest_level: Optional[InterestLevel] = None
    ) -> Tuple[List[Customer], int]:
        """获取客户列表"""
        query = self.db.query(Customer).filter(Customer.user_id == user_id)
        
        # 搜索功能
        if search_query:
            search_filter = or_(
                Customer.name.ilike(f"%{search_query}%"),
                Customer.email.ilike(f"%{search_query}%"),
                Customer.company.ilike(f"%{search_query}%")
            )
            query = query.filter(search_filter)
        
        # 沟通进度筛选
        if communication_progress:
            query = query.filter(Customer.communication_progress == communication_progress)
        
        # 感兴趣程度筛选
        if interest_level:
            query = query.filter(Customer.interest_level == interest_level)
        
        # 按创建时间倒序排序
        query = query.order_by(Customer.created_at.desc())
        
        # 计算总数
        total = query.count()
        
        # 分页
        offset = (page - 1) * page_size
        customers = query.offset(offset).limit(page_size).all()
        
        return customers, total
    
    def update_customer(self, customer_id: int, customer_data: CustomerUpdate, user_id: int) -> Optional[Customer]:
        """更新客户信息"""
        db_customer = self.get_customer(customer_id, user_id)
        if not db_customer:
            return None
        
        update_data = customer_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_customer, field, value)
        
        self.db.commit()
        self.db.refresh(db_customer)
        return db_customer
    
    def update_customer_progress(self, customer_id: int, progress_data: CustomerProgressUpdate, user_id: int) -> Optional[Customer]:
        """更新客户进度"""
        db_customer = self.get_customer(customer_id, user_id)
        if not db_customer:
            return None
        
        update_data = progress_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_customer, field, value)
        
        self.db.commit()
        self.db.refresh(db_customer)
        return db_customer
    
    def update_email_count(self, customer_id: int, email_data: CustomerEmailCountUpdate, user_id: int) -> Optional[Customer]:
        """更新邮件计数"""
        db_customer = self.get_customer(customer_id, user_id)
        if not db_customer:
            return None
        
        db_customer.email_count = email_data.email_count
        if email_data.last_communication_time:
            db_customer.last_communication_time = email_data.last_communication_time
        else:
            db_customer.last_communication_time = datetime.now()
        
        self.db.commit()
        self.db.refresh(db_customer)
        return db_customer
    
    def delete_customer(self, customer_id: int, user_id: int) -> bool:
        """删除客户"""
        db_customer = self.get_customer(customer_id, user_id)
        if not db_customer:
            return False
        
        self.db.delete(db_customer)
        self.db.commit()
        return True
    
    def get_customers_by_progress(self, user_id: int, progress: CommunicationProgress) -> List[Customer]:
        """根据沟通进度获取客户列表"""
        return self.db.query(Customer).filter(
            and_(Customer.user_id == user_id, Customer.communication_progress == progress)
        ).all()
    
    def get_customers_by_interest(self, user_id: int, interest: InterestLevel) -> List[Customer]:
        """根据感兴趣程度获取客户列表"""
        return self.db.query(Customer).filter(
            and_(Customer.user_id == user_id, Customer.interest_level == interest)
        ).all()
    
    def get_customer_statistics(self, user_id: int) -> dict:
        """获取客户统计信息"""
        total_customers = self.db.query(Customer).filter(Customer.user_id == user_id).count()
        
        # 按沟通进度统计
        progress_stats = {}
        for progress in CommunicationProgress:
            count = self.db.query(Customer).filter(
                and_(Customer.user_id == user_id, Customer.communication_progress == progress)
            ).count()
            progress_stats[progress.value] = count
        
        # 按感兴趣程度统计
        interest_stats = {}
        for interest in InterestLevel:
            count = self.db.query(Customer).filter(
                and_(Customer.user_id == user_id, Customer.interest_level == interest)
            ).count()
            interest_stats[interest.value] = count
        
        return {
            "total_customers": total_customers,
            "communication_progress": progress_stats,
            "interest_level": interest_stats
        }
