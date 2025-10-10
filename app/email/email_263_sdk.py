"""
263邮箱SDK
"""

import smtplib
import imaplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class Email263SDK:
    """263邮箱SDK类"""
    
    def __init__(self, email_address: str, password: str, smtp_server: str, smtp_port: int, 
                 imap_server: str, imap_port: int, is_ssl: bool = True):
        self.email_address = email_address
        self.password = password
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.imap_server = imap_server
        self.imap_port = imap_port
        self.is_ssl = is_ssl
    
    def test_smtp_connection(self) -> Tuple[bool, Optional[str]]:
        """测试SMTP连接"""
        try:
            if self.is_ssl:
                server = smtplib.SMTP_SSL(self.smtp_server, self.smtp_port)
            else:
                server = smtplib.SMTP(self.smtp_server, self.smtp_port)
                if self.is_ssl:
                    server.starttls()
            
            server.login(self.email_address, self.password)
            server.quit()
            return True, None
        except Exception as e:
            error_msg = f"SMTP连接失败: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
    
    def test_imap_connection(self) -> Tuple[bool, Optional[str]]:
        """测试IMAP连接"""
        try:
            if self.is_ssl:
                server = imaplib.IMAP4_SSL(self.imap_server, self.imap_port)
            else:
                server = imaplib.IMAP4(self.imap_server, self.imap_port)
                if self.is_ssl:
                    server.starttls()
            
            server.login(self.email_address, self.password)
            server.logout()
            return True, None
        except Exception as e:
            error_msg = f"IMAP连接失败: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
    
    def test_connection(self) -> Dict[str, Any]:
        """测试邮箱连接"""
        smtp_success, smtp_error = self.test_smtp_connection()
        imap_success, imap_error = self.test_imap_connection()
        
        overall_success = smtp_success and imap_success
        error_messages = []
        if smtp_error:
            error_messages.append(smtp_error)
        if imap_error:
            error_messages.append(imap_error)
        
        return {
            "success": overall_success,
            "smtp_test": smtp_success,
            "imap_test": imap_success,
            "error_message": "; ".join(error_messages) if error_messages else None,
            "test_time": datetime.now()
        }
    
    def send_email(self, to_emails: List[str], subject: str, content: str, 
                   cc_emails: Optional[List[str]] = None, 
                   bcc_emails: Optional[List[str]] = None,
                   is_html: bool = False) -> Dict[str, Any]:
        """发送邮件"""
        try:
            # 创建邮件
            msg = MIMEMultipart('alternative')
            msg['From'] = self.email_address
            msg['To'] = ', '.join(to_emails)
            msg['Subject'] = subject
            
            if cc_emails:
                msg['Cc'] = ', '.join(cc_emails)
            
            # 添加邮件内容
            if is_html:
                msg.attach(MIMEText(content, 'html', 'utf-8'))
            else:
                msg.attach(MIMEText(content, 'plain', 'utf-8'))
            
            # 连接SMTP服务器
            if self.is_ssl:
                server = smtplib.SMTP_SSL(self.smtp_server, self.smtp_port)
            else:
                server = smtplib.SMTP(self.smtp_server, self.smtp_port)
                if self.is_ssl:
                    server.starttls()
            
            server.login(self.email_address, self.password)
            
            # 发送邮件
            all_recipients = to_emails.copy()
            if cc_emails:
                all_recipients.extend(cc_emails)
            if bcc_emails:
                all_recipients.extend(bcc_emails)
            
            text = msg.as_string()
            server.sendmail(self.email_address, all_recipients, text)
            server.quit()
            
            return {
                "success": True,
                "sent_count": len(all_recipients),
                "message_ids": [f"msg_{datetime.now().timestamp()}"],  # 简化处理
                "error_message": None,
                "sent_time": datetime.now()
            }
            
        except Exception as e:
            error_msg = f"发送邮件失败: {str(e)}"
            logger.error(error_msg)
            return {
                "success": False,
                "sent_count": 0,
                "message_ids": [],
                "error_message": error_msg,
                "sent_time": datetime.now()
            }
    
    def get_emails(self, folder: str = 'INBOX', limit: int = 50) -> Dict[str, Any]:
        """获取邮件列表"""
        try:
            # 连接IMAP服务器
            if self.is_ssl:
                server = imaplib.IMAP4_SSL(self.imap_server, self.imap_port)
            else:
                server = imaplib.IMAP4(self.imap_server, self.imap_port)
                if self.is_ssl:
                    server.starttls()
            
            server.login(self.email_address, self.password)
            server.select(folder)
            
            # 搜索邮件
            status, messages = server.search(None, 'ALL')
            if status != 'OK':
                server.logout()
                return {
                    "success": False,
                    "emails": [],
                    "error_message": "搜索邮件失败",
                    "fetch_time": datetime.now()
                }
            
            # 获取最新的邮件
            email_ids = messages[0].split()
            if len(email_ids) > limit:
                email_ids = email_ids[-limit:]
            
            emails = []
            for email_id in email_ids:
                try:
                    status, msg_data = server.fetch(email_id, '(RFC822)')
                    if status == 'OK':
                        # 这里可以解析邮件内容，暂时简化处理
                        emails.append({
                            "id": email_id.decode(),
                            "subject": "邮件主题",  # 需要解析邮件头
                            "from": "发件人",      # 需要解析邮件头
                            "date": datetime.now().isoformat(),
                            "size": len(msg_data[0][1])
                        })
                except Exception as e:
                    logger.warning(f"解析邮件 {email_id} 失败: {e}")
                    continue
            
            server.logout()
            
            return {
                "success": True,
                "emails": emails,
                "error_message": None,
                "fetch_time": datetime.now()
            }
            
        except Exception as e:
            error_msg = f"获取邮件失败: {str(e)}"
            logger.error(error_msg)
            return {
                "success": False,
                "emails": [],
                "error_message": error_msg,
                "fetch_time": datetime.now()
            }


class Email263Config:
    """263邮箱配置类"""
    
    # 263邮箱默认配置
    DEFAULT_SMTP_SERVER = "smtp.263.net"
    DEFAULT_SMTP_PORT = 465
    DEFAULT_IMAP_SERVER = "imap.263.net"
    DEFAULT_IMAP_PORT = 993
    
    @classmethod
    def get_default_config(cls, email_address: str, password: str) -> Dict[str, Any]:
        """获取263邮箱默认配置"""
        return {
            "email_address": email_address,
            "password": password,
            "smtp_server": cls.DEFAULT_SMTP_SERVER,
            "smtp_port": cls.DEFAULT_SMTP_PORT,
            "imap_server": cls.DEFAULT_IMAP_SERVER,
            "imap_port": cls.DEFAULT_IMAP_PORT,
            "is_ssl": True
        }
    
    @classmethod
    def create_sdk(cls, email_address: str, password: str, 
                   smtp_server: Optional[str] = None,
                   smtp_port: Optional[int] = None,
                   imap_server: Optional[str] = None,
                   imap_port: Optional[int] = None,
                   is_ssl: bool = True) -> Email263SDK:
        """创建263邮箱SDK实例"""
        config = cls.get_default_config(email_address, password)
        
        if smtp_server:
            config["smtp_server"] = smtp_server
        if smtp_port:
            config["smtp_port"] = smtp_port
        if imap_server:
            config["imap_server"] = imap_server
        if imap_port:
            config["imap_port"] = imap_port
        
        config["is_ssl"] = is_ssl
        
        return Email263SDK(**config)
