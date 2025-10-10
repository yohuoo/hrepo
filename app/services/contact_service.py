"""
联系人服务层
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional, Tuple
import math
import json

from ..models.contact import Contact, ContactTag, ContactCreate, ContactUpdate, ContactResponse
from ..models.user import User


class ContactService:
    """联系人服务类"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_contact(self, contact_data: ContactCreate, user_id: int) -> Contact:
        """创建联系人"""
        # 处理标签
        tags_json = None
        if contact_data.tag_names:
            tags_json = json.dumps(contact_data.tag_names, ensure_ascii=False)
        
        db_contact = Contact(
            name=contact_data.name,
            first_name=contact_data.first_name,
            last_name=contact_data.last_name,
            email=contact_data.email,
            company=contact_data.company,
            domain=contact_data.domain,
            position=contact_data.position,
            tags=tags_json,
            user_id=user_id
        )
        self.db.add(db_contact)
        self.db.commit()
        self.db.refresh(db_contact)
        return db_contact
    
    def get_contact(self, contact_id: int, user_id: int) -> Optional[Contact]:
        """获取单个联系人"""
        return self.db.query(Contact).filter(
            and_(Contact.id == contact_id, Contact.user_id == user_id)
        ).first()
    
    def get_contacts(
        self, 
        user_id: int, 
        page: int = 1, 
        page_size: int = 20,
        search_query: Optional[str] = None,
        tag_names: Optional[List[str]] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Tuple[List[Contact], int]:
        """获取联系人列表"""
        from datetime import datetime
        
        query = self.db.query(Contact).filter(Contact.user_id == user_id)
        
        # 搜索功能
        if search_query:
            search_filter = or_(
                Contact.name.ilike(f"%{search_query}%"),
                Contact.first_name.ilike(f"%{search_query}%"),
                Contact.last_name.ilike(f"%{search_query}%"),
                Contact.email.ilike(f"%{search_query}%"),
                Contact.company.ilike(f"%{search_query}%")
            )
            query = query.filter(search_filter)
        
        # 标签筛选 - 使用JSON查询（大小写不敏感）
        if tag_names:
            # 使用JSON查询筛选包含指定标签的联系人
            tag_conditions = []
            for tag_name in tag_names:
                # 支持大小写不敏感的搜索
                tag_conditions.append(Contact.tags.ilike(f'%"{tag_name}"%'))
            if tag_conditions:
                query = query.filter(or_(*tag_conditions))
        
        # 创建时间筛选
        if start_date:
            try:
                start_datetime = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query = query.filter(Contact.created_at >= start_datetime)
            except ValueError:
                pass  # 忽略无效的日期格式
        
        if end_date:
            try:
                end_datetime = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                query = query.filter(Contact.created_at <= end_datetime)
            except ValueError:
                pass  # 忽略无效的日期格式
        
        # 按创建时间倒序排序
        query = query.order_by(Contact.created_at.desc())
        
        # 计算总数
        total = query.count()
        
        # 分页
        offset = (page - 1) * page_size
        contacts = query.offset(offset).limit(page_size).all()
        
        return contacts, total
    
    def update_contact(self, contact_id: int, contact_data: ContactUpdate, user_id: int) -> Optional[Contact]:
        """更新联系人"""
        db_contact = self.get_contact(contact_id, user_id)
        if not db_contact:
            return None
        
        update_data = contact_data.model_dump(exclude_unset=True, exclude={"tag_names"})
        
        # 处理标签更新
        if contact_data.tag_names is not None:
            tags_json = json.dumps(contact_data.tag_names, ensure_ascii=False) if contact_data.tag_names else None
            update_data["tags"] = tags_json
        
        for field, value in update_data.items():
            setattr(db_contact, field, value)
        
        self.db.commit()
        self.db.refresh(db_contact)
        return db_contact
    
    def delete_contact(self, contact_id: int, user_id: int) -> bool:
        """删除联系人"""
        db_contact = self.get_contact(contact_id, user_id)
        if not db_contact:
            return False
        
        self.db.delete(db_contact)
        self.db.commit()
        return True
    
    def add_tag_to_contact(self, contact_id: int, tag_id: int, user_id: int) -> bool:
        """给联系人添加标签"""
        contact = self.get_contact(contact_id, user_id)
        if not contact:
            return False
        
        tag = self.db.query(ContactTag).filter(
            and_(ContactTag.id == tag_id, ContactTag.user_id == user_id)
        ).first()
        
        if not tag:
            return False
        
        # 解析现有标签
        current_tags = []
        if contact.tags:
            try:
                current_tags = json.loads(contact.tags)
            except json.JSONDecodeError:
                current_tags = []
        
        # 添加新标签（如果不存在）
        if tag.name not in current_tags:
            current_tags.append(tag.name)
            contact.tags = json.dumps(current_tags, ensure_ascii=False)
            self.db.commit()
        
        return True
    
    def remove_tag_from_contact(self, contact_id: int, tag_id: int, user_id: int) -> bool:
        """从联系人移除标签"""
        contact = self.get_contact(contact_id, user_id)
        if not contact:
            return False
        
        tag = self.db.query(ContactTag).filter(
            and_(ContactTag.id == tag_id, ContactTag.user_id == user_id)
        ).first()
        
        if not tag:
            return False
        
        # 解析现有标签
        current_tags = []
        if contact.tags:
            try:
                current_tags = json.loads(contact.tags)
            except json.JSONDecodeError:
                current_tags = []
        
        # 移除标签
        if tag.name in current_tags:
            current_tags.remove(tag.name)
            contact.tags = json.dumps(current_tags, ensure_ascii=False) if current_tags else None
            self.db.commit()
        
        return True
    
    def get_contact_with_tags(self, contact_id: int, user_id: int) -> Optional[Contact]:
        """获取带标签的联系人"""
        return self.db.query(Contact).filter(
            and_(Contact.id == contact_id, Contact.user_id == user_id)
        ).first()
    
    def search_contacts(
        self, 
        user_id: int, 
        query: str, 
        page: int = 1, 
        page_size: int = 20
    ) -> Tuple[List[Contact], int]:
        """搜索联系人"""
        search_filter = or_(
            Contact.name.ilike(f"%{query}%"),
            Contact.first_name.ilike(f"%{query}%"),
            Contact.last_name.ilike(f"%{query}%"),
            Contact.email.ilike(f"%{query}%"),
            Contact.company.ilike(f"%{query}%"),
            Contact.domain.ilike(f"%{query}%"),
            Contact.position.ilike(f"%{query}%")
        )
        
        db_query = self.db.query(Contact).filter(
            and_(Contact.user_id == user_id, search_filter)
        )
        
        total = db_query.count()
        offset = (page - 1) * page_size
        contacts = db_query.offset(offset).limit(page_size).all()
        
        return contacts, total
