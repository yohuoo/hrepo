"""
邮件模板服务层
"""

import re
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional, Tuple, Dict, Any
import math

from ..models.email_template import (
    EmailTemplate, EmailTemplateCreate, EmailTemplateUpdate,
    EmailTemplateRenderRequest, EmailTemplateRenderResponse,
    BatchPreviewRequest, BatchPreviewResponse, ContactPreviewItem
)
from ..models.contact import Contact


class EmailTemplateService:
    """邮件模板服务类"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_template(self, template_data: EmailTemplateCreate, user_id: int) -> EmailTemplate:
        """创建邮件模板"""
        db_template = EmailTemplate(
            user_id=user_id,
            title=template_data.title,
            content=template_data.content
        )
        self.db.add(db_template)
        self.db.commit()
        self.db.refresh(db_template)
        return db_template
    
    def get_template(self, template_id: int, user_id: int) -> Optional[EmailTemplate]:
        """获取单个邮件模板"""
        return self.db.query(EmailTemplate).filter(
            and_(EmailTemplate.id == template_id, EmailTemplate.user_id == user_id)
        ).first()
    
    def get_templates(
        self, 
        user_id: int, 
        page: int = 1, 
        page_size: int = 20,
        search_query: Optional[str] = None
    ) -> Tuple[List[EmailTemplate], int]:
        """获取邮件模板列表"""
        query = self.db.query(EmailTemplate).filter(EmailTemplate.user_id == user_id)
        
        # 搜索功能
        if search_query:
            search_filter = or_(
                EmailTemplate.title.ilike(f"%{search_query}%"),
                EmailTemplate.content.ilike(f"%{search_query}%")
            )
            query = query.filter(search_filter)
        
        # 按创建时间倒序排序
        query = query.order_by(EmailTemplate.created_at.desc())
        
        # 计算总数
        total = query.count()
        
        # 分页
        offset = (page - 1) * page_size
        templates = query.offset(offset).limit(page_size).all()
        
        return templates, total
    
    def update_template(self, template_id: int, template_data: EmailTemplateUpdate, user_id: int) -> Optional[EmailTemplate]:
        """更新邮件模板"""
        db_template = self.get_template(template_id, user_id)
        if not db_template:
            return None
        
        update_data = template_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_template, field, value)
        
        self.db.commit()
        self.db.refresh(db_template)
        return db_template
    
    def delete_template(self, template_id: int, user_id: int) -> bool:
        """删除邮件模板"""
        db_template = self.get_template(template_id, user_id)
        if not db_template:
            return False
        
        self.db.delete(db_template)
        self.db.commit()
        return True
    
    def render_template(self, template_id: int, variables: Dict[str, Any], user_id: int) -> EmailTemplateRenderResponse:
        """渲染邮件模板，替换变量"""
        template = self.get_template(template_id, user_id)
        if not template:
            return EmailTemplateRenderResponse(
                success=False,
                template_id=template_id,
                title="",
                rendered_content="",
                variables_used={},
                variables_missing=["模板不存在"]
            )
        
        # 查找模板中的所有变量（{{变量名}}格式）
        variable_pattern = r'\{\{([^}]+)\}\}'
        found_variables = set(re.findall(variable_pattern, template.content))
        
        # 渲染内容
        rendered_content = template.content
        variables_used = {}
        variables_missing = []
        
        for var_name in found_variables:
            var_name = var_name.strip()
            if var_name in variables:
                # 替换变量
                rendered_content = rendered_content.replace(f"{{{{{var_name}}}}}", str(variables[var_name]))
                variables_used[var_name] = variables[var_name]
            else:
                variables_missing.append(var_name)
        
        return EmailTemplateRenderResponse(
            success=True,
            template_id=template_id,
            title=template.title,
            rendered_content=rendered_content,
            variables_used=variables_used,
            variables_missing=variables_missing
        )
    
    def get_template_variables(self, template_id: int, user_id: int) -> List[str]:
        """获取模板中使用的所有变量名"""
        template = self.get_template(template_id, user_id)
        if not template:
            return []
        
        # 查找模板中的所有变量
        variable_pattern = r'\{\{([^}]+)\}\}'
        found_variables = re.findall(variable_pattern, template.content)
        
        # 去重并返回
        return list(set([var.strip() for var in found_variables]))
    
    def batch_preview_template(self, template_id: int, contact_ids: List[int], user_id: int) -> BatchPreviewResponse:
        """批量预览邮件模板"""
        # 获取模板
        template = self.get_template(template_id, user_id)
        if not template:
            return BatchPreviewResponse(
                success=False,
                template_id=template_id,
                template_title="",
                total_contacts=len(contact_ids),
                successful_previews=0,
                failed_previews=len(contact_ids),
                previews=[]
            )
        
        # 获取联系人信息
        contacts = self.db.query(Contact).filter(
            and_(Contact.id.in_(contact_ids), Contact.user_id == user_id)
        ).all()
        
        previews = []
        successful_count = 0
        failed_count = 0
        
        for contact in contacts:
            try:
                # 构建联系人变量字典
                contact_variables = {
                    # 联系人信息
                    "name": contact.name,
                    "first_name": contact.first_name or "",
                    "last_name": contact.last_name or "",
                    "firstName": contact.first_name or "",  # 支持驼峰命名
                    "lastName": contact.last_name or "",    # 支持驼峰命名
                    "email": contact.email,
                    "company": contact.company,  # 联系人的公司
                    "contact_company": contact.company,  # 明确标识联系人的公司
                    "position": contact.position or "",
                    "domain": contact.domain or "",
                    "contact_domain": contact.domain or "",
                    
                    # 发送者信息（这些需要在模板中硬编码或通过其他方式提供）
                    "sender_name": "李四",  # 可以从用户配置或参数中获取
                    "my_company": "ABC科技有限公司",  # 可以从用户配置或参数中获取
                    "sender_company": "ABC科技有限公司",  # 明确标识发送者的公司
                    "product_name": "代糖产品",  # 可以从用户配置或参数中获取
                    "contact_phone": "138-0000-0000"  # 可以从用户配置或参数中获取
                }
                
                # 渲染模板
                render_result = self.render_template(template_id, contact_variables, user_id)
                
                if render_result.success:
                    preview_item = ContactPreviewItem(
                        contact_id=contact.id,
                        contact_name=contact.name,
                        first_name=contact.first_name,
                        last_name=contact.last_name,
                        email=contact.email,
                        company=contact.company,
                        position=contact.position,
                        rendered_content=render_result.rendered_content,
                        variables_used=render_result.variables_used,
                        variables_missing=render_result.variables_missing
                    )
                    previews.append(preview_item)
                    successful_count += 1
                else:
                    failed_count += 1
                    
            except Exception as e:
                print(f"❌ 渲染联系人 {contact.id} 失败: {e}")
                failed_count += 1
        
        return BatchPreviewResponse(
            success=True,
            template_id=template_id,
            template_title=template.title,
            total_contacts=len(contact_ids),
            successful_previews=successful_count,
            failed_previews=failed_count,
            previews=previews
        )
