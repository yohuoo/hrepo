"""
邮箱账户管理API路由
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import math

from ..core.database import get_db
from ..models.email_account import (
    EmailAccountCreate, EmailAccountUpdate, EmailAccountResponse, EmailAccountListResponse,
    EmailAccountTestResponse, EmailSendRequest, EmailSendResponse, ConnectionStatus
)
from ..services.email_account_service import EmailAccountService
from ..routers.overseas import MockUser, get_current_user

router = APIRouter(prefix="/email-accounts", tags=["email-account-management"])


@router.get("/", response_model=EmailAccountListResponse)
async def get_email_accounts(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    is_active: Optional[bool] = Query(None, description="激活状态筛选"),
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    获取邮箱账户列表
    
    支持分页和激活状态筛选
    """
    try:
        email_account_service = EmailAccountService(db)
        
        # 获取邮箱账户列表
        accounts, total = email_account_service.get_email_accounts(
            user_id=current_user.id,
            page=page,
            page_size=page_size,
            is_active=is_active
        )
        
        # 转换为响应模型
        account_responses = [
            EmailAccountResponse(
                id=account.id,
                user_id=account.user_id,
                email_address=account.email_address,
                smtp_server=account.smtp_server,
                smtp_port=account.smtp_port,
                imap_server=account.imap_server,
                imap_port=account.imap_port,
                is_ssl=account.is_ssl,
                is_active=account.is_active,
                connection_status=account.connection_status,
                last_connection_test=account.last_connection_test,
                created_at=account.created_at,
                updated_at=account.updated_at
            )
            for account in accounts
        ]
        
        # 计算总页数
        total_pages = math.ceil(total / page_size) if total > 0 else 1
        
        return EmailAccountListResponse(
            success=True,
            email_accounts=account_responses,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取邮箱账户列表失败: {str(e)}"
        )


@router.post("/", response_model=EmailAccountResponse)
async def create_email_account(
    account_data: EmailAccountCreate,
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    创建新邮箱账户
    
    支持263邮箱配置
    """
    try:
        email_account_service = EmailAccountService(db)
        account = email_account_service.create_email_account(account_data, current_user.id)
        
        return EmailAccountResponse(
            id=account.id,
            user_id=account.user_id,
            email_address=account.email_address,
            smtp_server=account.smtp_server,
            smtp_port=account.smtp_port,
            imap_server=account.imap_server,
            imap_port=account.imap_port,
            is_ssl=account.is_ssl,
            is_active=account.is_active,
            connection_status=account.connection_status,
            last_connection_test=account.last_connection_test,
            created_at=account.created_at,
            updated_at=account.updated_at
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建邮箱账户失败: {str(e)}"
        )


@router.get("/{account_id}", response_model=EmailAccountResponse)
async def get_email_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    获取单个邮箱账户详情
    """
    try:
        email_account_service = EmailAccountService(db)
        account = email_account_service.get_email_account(account_id, current_user.id)
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="邮箱账户不存在"
            )
        
        return EmailAccountResponse(
            id=account.id,
            user_id=account.user_id,
            email_address=account.email_address,
            smtp_server=account.smtp_server,
            smtp_port=account.smtp_port,
            imap_server=account.imap_server,
            imap_port=account.imap_port,
            is_ssl=account.is_ssl,
            is_active=account.is_active,
            connection_status=account.connection_status,
            last_connection_test=account.last_connection_test,
            created_at=account.created_at,
            updated_at=account.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取邮箱账户失败: {str(e)}"
        )


@router.put("/{account_id}", response_model=EmailAccountResponse)
async def update_email_account(
    account_id: int,
    account_data: EmailAccountUpdate,
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    更新邮箱账户信息
    """
    try:
        email_account_service = EmailAccountService(db)
        account = email_account_service.update_email_account(account_id, account_data, current_user.id)
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="邮箱账户不存在"
            )
        
        return EmailAccountResponse(
            id=account.id,
            user_id=account.user_id,
            email_address=account.email_address,
            smtp_server=account.smtp_server,
            smtp_port=account.smtp_port,
            imap_server=account.imap_server,
            imap_port=account.imap_port,
            is_ssl=account.is_ssl,
            is_active=account.is_active,
            connection_status=account.connection_status,
            last_connection_test=account.last_connection_test,
            created_at=account.created_at,
            updated_at=account.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新邮箱账户失败: {str(e)}"
        )


@router.delete("/{account_id}")
async def delete_email_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    删除邮箱账户
    """
    try:
        email_account_service = EmailAccountService(db)
        success = email_account_service.delete_email_account(account_id, current_user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="邮箱账户不存在"
            )
        
        return {"success": True, "message": "邮箱账户删除成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除邮箱账户失败: {str(e)}"
        )


@router.post("/{account_id}/test", response_model=EmailAccountTestResponse)
async def test_email_connection(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    测试邮箱连接
    
    测试SMTP和IMAP连接状态
    """
    try:
        email_account_service = EmailAccountService(db)
        result = email_account_service.test_email_connection(account_id, current_user.id)
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"测试邮箱连接失败: {str(e)}"
        )


@router.post("/{account_id}/send", response_model=EmailSendResponse)
async def send_email(
    account_id: int,
    send_request: EmailSendRequest,
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    发送邮件
    
    使用指定的邮箱账户发送邮件
    """
    try:
        # 确保account_id与请求中的一致
        send_request.email_account_id = account_id
        
        email_account_service = EmailAccountService(db)
        result = email_account_service.send_email(send_request, current_user.id)
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"发送邮件失败: {str(e)}"
        )


@router.get("/statistics/overview")
async def get_email_account_statistics(
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    获取邮箱账户统计信息
    """
    try:
        email_account_service = EmailAccountService(db)
        statistics = email_account_service.get_connection_statistics(current_user.id)
        
        return {
            "success": True,
            "statistics": statistics
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取邮箱账户统计失败: {str(e)}"
        )


@router.post("/263/create", response_model=EmailAccountResponse)
async def create_263_email_account(
    email_address: str = Query(..., description="263邮箱地址"),
    password: str = Query(..., description="邮箱密码"),
    db: Session = Depends(get_db),
    current_user: MockUser = Depends(get_current_user)
):
    """
    快速创建263邮箱账户
    
    使用263邮箱默认配置
    """
    try:
        from ..email.email_263_sdk import Email263Config
        
        # 获取263邮箱默认配置
        config = Email263Config.get_default_config(email_address, password)
        
        # 创建邮箱账户
        account_data = EmailAccountCreate(
            email_address=config["email_address"],
            email_password=config["password"],
            smtp_server=config["smtp_server"],
            smtp_port=config["smtp_port"],
            imap_server=config["imap_server"],
            imap_port=config["imap_port"],
            is_ssl=config["is_ssl"]
        )
        email_account_service = EmailAccountService(db)
        account = email_account_service.create_email_account(account_data, current_user.id)
        
        return EmailAccountResponse(
            id=account.id,
            user_id=account.user_id,
            email_address=account.email_address,
            smtp_server=account.smtp_server,
            smtp_port=account.smtp_port,
            imap_server=account.imap_server,
            imap_port=account.imap_port,
            is_ssl=account.is_ssl,
            is_active=account.is_active,
            connection_status=account.connection_status,
            last_connection_test=account.last_connection_test,
            created_at=account.created_at,
            updated_at=account.updated_at
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建263邮箱账户失败: {str(e)}"
        )
