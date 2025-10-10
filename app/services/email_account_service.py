"""
邮箱账户服务层
"""

import hashlib
import secrets
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional, Tuple
import math
from datetime import datetime

from ..models.email_account import (
    EmailAccount, EmailAccountCreate, EmailAccountUpdate, 
    EmailAccountTestResponse, EmailSendRequest, EmailSendResponse,
    ConnectionStatus
)
from ..email.email_263_sdk import Email263SDK, Email263Config


class EmailAccountService:
    """邮箱账户服务类"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def _encrypt_password(self, password: str) -> str:
        """加密密码"""
        # 使用简单的加密方式，实际项目中应该使用更安全的加密方法
        salt = secrets.token_hex(16)
        password_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
        return f"{salt}:{password_hash.hex()}"
    
    def _decrypt_password(self, encrypted_password: str) -> str:
        """解密密码"""
        # 这里简化处理，实际项目中需要实现解密逻辑
        # 为了演示，我们假设密码是明文存储的（实际项目中不应该这样做）
        return encrypted_password
    
    def create_email_account(self, account_data: EmailAccountCreate, user_id: int) -> EmailAccount:
        """创建邮箱账户"""
        # 检查是否已存在相同的邮箱地址
        existing_account = self.db.query(EmailAccount).filter(
            and_(EmailAccount.user_id == user_id, EmailAccount.email_address == account_data.email_address)
        ).first()
        
        if existing_account:
            raise ValueError("该邮箱地址已存在")
        
        # 加密密码
        encrypted_password = self._encrypt_password(account_data.email_password)
        
        db_account = EmailAccount(
            user_id=user_id,
            email_address=account_data.email_address,
            email_password=encrypted_password,
            smtp_server=account_data.smtp_server,
            smtp_port=account_data.smtp_port,
            imap_server=account_data.imap_server,
            imap_port=account_data.imap_port,
            is_ssl=account_data.is_ssl,
            is_active=account_data.is_active,
            connection_status=ConnectionStatus.UNKNOWN
        )
        
        self.db.add(db_account)
        self.db.commit()
        self.db.refresh(db_account)
        return db_account
    
    def get_email_account(self, account_id: int, user_id: int) -> Optional[EmailAccount]:
        """获取单个邮箱账户"""
        return self.db.query(EmailAccount).filter(
            and_(EmailAccount.id == account_id, EmailAccount.user_id == user_id)
        ).first()
    
    def get_email_accounts(
        self, 
        user_id: int, 
        page: int = 1, 
        page_size: int = 20,
        is_active: Optional[bool] = None
    ) -> Tuple[List[EmailAccount], int]:
        """获取邮箱账户列表"""
        query = self.db.query(EmailAccount).filter(EmailAccount.user_id == user_id)
        
        # 激活状态筛选
        if is_active is not None:
            query = query.filter(EmailAccount.is_active == is_active)
        
        # 按创建时间倒序排序
        query = query.order_by(EmailAccount.created_at.desc())
        
        # 计算总数
        total = query.count()
        
        # 分页
        offset = (page - 1) * page_size
        accounts = query.offset(offset).limit(page_size).all()
        
        return accounts, total
    
    def update_email_account(self, account_id: int, account_data: EmailAccountUpdate, user_id: int) -> Optional[EmailAccount]:
        """更新邮箱账户"""
        db_account = self.get_email_account(account_id, user_id)
        if not db_account:
            return None
        
        update_data = account_data.model_dump(exclude_unset=True)
        
        # 如果更新密码，需要加密
        if 'email_password' in update_data:
            update_data['email_password'] = self._encrypt_password(update_data['email_password'])
        
        for field, value in update_data.items():
            setattr(db_account, field, value)
        
        self.db.commit()
        self.db.refresh(db_account)
        return db_account
    
    def delete_email_account(self, account_id: int, user_id: int) -> bool:
        """删除邮箱账户"""
        db_account = self.get_email_account(account_id, user_id)
        if not db_account:
            return False
        
        self.db.delete(db_account)
        self.db.commit()
        return True
    
    def test_email_connection(self, account_id: int, user_id: int) -> EmailAccountTestResponse:
        """测试邮箱连接"""
        db_account = self.get_email_account(account_id, user_id)
        if not db_account:
            return EmailAccountTestResponse(
                success=False,
                email_account_id=account_id,
                email_address="",
                connection_status=ConnectionStatus.ERROR,
                smtp_test=False,
                imap_test=False,
                error_message="邮箱账户不存在",
                test_time=datetime.now()
            )
        
        try:
            # 解密密码
            password = self._decrypt_password(db_account.email_password)
            
            # 创建SDK实例
            sdk = Email263SDK(
                email_address=db_account.email_address,
                password=password,
                smtp_server=db_account.smtp_server,
                smtp_port=db_account.smtp_port,
                imap_server=db_account.imap_server,
                imap_port=db_account.imap_port,
                is_ssl=db_account.is_ssl
            )
            
            # 测试连接
            test_result = sdk.test_connection()
            
            # 更新连接状态
            if test_result["success"]:
                db_account.connection_status = ConnectionStatus.CONNECTED
            else:
                db_account.connection_status = ConnectionStatus.ERROR
            
            db_account.last_connection_test = datetime.now()
            self.db.commit()
            
            return EmailAccountTestResponse(
                success=test_result["success"],
                email_account_id=account_id,
                email_address=db_account.email_address,
                connection_status=db_account.connection_status,
                smtp_test=test_result["smtp_test"],
                imap_test=test_result["imap_test"],
                error_message=test_result["error_message"],
                test_time=test_result["test_time"]
            )
            
        except Exception as e:
            # 更新连接状态为错误
            db_account.connection_status = ConnectionStatus.ERROR
            db_account.last_connection_test = datetime.now()
            self.db.commit()
            
            return EmailAccountTestResponse(
                success=False,
                email_account_id=account_id,
                email_address=db_account.email_address,
                connection_status=ConnectionStatus.ERROR,
                smtp_test=False,
                imap_test=False,
                error_message=f"连接测试失败: {str(e)}",
                test_time=datetime.now()
            )
    
    def send_email(self, send_request: EmailSendRequest, user_id: int) -> EmailSendResponse:
        """发送邮件"""
        db_account = self.get_email_account(send_request.email_account_id, user_id)
        if not db_account:
            return EmailSendResponse(
                success=False,
                email_account_id=send_request.email_account_id,
                email_address="",
                sent_count=0,
                failed_count=len(send_request.to_emails),
                message_ids=[],
                error_message="邮箱账户不存在",
                sent_time=datetime.now()
            )
        
        try:
            # 解密密码
            password = self._decrypt_password(db_account.email_password)
            
            # 创建SDK实例
            sdk = Email263SDK(
                email_address=db_account.email_address,
                password=password,
                smtp_server=db_account.smtp_server,
                smtp_port=db_account.smtp_port,
                imap_server=db_account.imap_server,
                imap_port=db_account.imap_port,
                is_ssl=db_account.is_ssl
            )
            
            # 发送邮件
            send_result = sdk.send_email(
                to_emails=send_request.to_emails,
                subject=send_request.subject,
                content=send_request.content,
                cc_emails=send_request.cc_emails,
                bcc_emails=send_request.bcc_emails,
                is_html=send_request.is_html
            )
            
            return EmailSendResponse(
                success=send_result["success"],
                email_account_id=send_request.email_account_id,
                email_address=db_account.email_address,
                sent_count=send_result["sent_count"],
                failed_count=len(send_request.to_emails) - send_result["sent_count"],
                message_ids=send_result["message_ids"],
                error_message=send_result["error_message"],
                sent_time=send_result["sent_time"]
            )
            
        except Exception as e:
            return EmailSendResponse(
                success=False,
                email_account_id=send_request.email_account_id,
                email_address=db_account.email_address,
                sent_count=0,
                failed_count=len(send_request.to_emails),
                message_ids=[],
                error_message=f"发送邮件失败: {str(e)}",
                sent_time=datetime.now()
            )
    
    def get_connection_statistics(self, user_id: int) -> dict:
        """获取连接统计信息"""
        total_accounts = self.db.query(EmailAccount).filter(EmailAccount.user_id == user_id).count()
        
        # 按连接状态统计
        status_stats = {}
        for status in ConnectionStatus:
            count = self.db.query(EmailAccount).filter(
                and_(EmailAccount.user_id == user_id, EmailAccount.connection_status == status)
            ).count()
            status_stats[status.value] = count
        
        # 激活状态统计
        active_count = self.db.query(EmailAccount).filter(
            and_(EmailAccount.user_id == user_id, EmailAccount.is_active == True)
        ).count()
        
        return {
            "total_accounts": total_accounts,
            "active_accounts": active_count,
            "inactive_accounts": total_accounts - active_count,
            "connection_status": status_stats
        }
