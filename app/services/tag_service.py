"""
标签服务层
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional

from ..models.contact import ContactTag, ContactTagCreate, ContactTagUpdate


class TagService:
    """标签服务类"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_tag(self, tag_data: ContactTagCreate, user_id: int) -> ContactTag:
        """创建标签"""
        db_tag = ContactTag(
            name=tag_data.name,
            color=tag_data.color,
            description=tag_data.description,
            user_id=user_id
        )
        self.db.add(db_tag)
        self.db.commit()
        self.db.refresh(db_tag)
        return db_tag
    
    def get_tag(self, tag_id: int, user_id: int) -> Optional[ContactTag]:
        """获取单个标签"""
        return self.db.query(ContactTag).filter(
            and_(ContactTag.id == tag_id, ContactTag.user_id == user_id)
        ).first()
    
    def get_tags(self, user_id: int) -> List[ContactTag]:
        """获取用户的所有标签"""
        return self.db.query(ContactTag).filter(ContactTag.user_id == user_id).all()
    
    def update_tag(self, tag_id: int, tag_data: ContactTagUpdate, user_id: int) -> Optional[ContactTag]:
        """更新标签"""
        db_tag = self.get_tag(tag_id, user_id)
        if not db_tag:
            return None
        
        update_data = tag_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_tag, field, value)
        
        self.db.commit()
        self.db.refresh(db_tag)
        return db_tag
    
    def delete_tag(self, tag_id: int, user_id: int) -> bool:
        """删除标签"""
        db_tag = self.get_tag(tag_id, user_id)
        if not db_tag:
            return False
        
        self.db.delete(db_tag)
        self.db.commit()
        return True
    
    def get_tag_by_name(self, name: str, user_id: int) -> Optional[ContactTag]:
        """根据名称获取标签"""
        return self.db.query(ContactTag).filter(
            and_(ContactTag.name == name, ContactTag.user_id == user_id)
        ).first()
