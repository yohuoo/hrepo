"""
数据模型模块
"""

from .contact import Contact, ContactTag
from .user import User
from .email_template import EmailTemplate
from .customer import Customer
from .email_account import EmailAccount

__all__ = ["Contact", "ContactTag", "User", "EmailTemplate", "Customer", "EmailAccount"]
