from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database Configuration
    database_url: str = "postgresql://user:password@localhost:5432/hrepo_db"
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "hrepo_db"
    db_user: str = "user"
    db_password: str = "password"
    
    # FastAPI Configuration
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # 263 Email Configuration
    email_263_imap_host: str = "imap.263.net"
    email_263_imap_port: int = 993
    email_263_smtp_host: str = "smtp.263.net"
    email_263_smtp_port: int = 587
    email_263_pop3_host: str = "pop.263.net"
    email_263_pop3_port: int = 995
    
    # Email Authentication Configuration
    email_auth_enabled: bool = True
    email_auth_timeout: int = 30
    email_ssl_verify: bool = True
    
    # Hunter.io API Configuration
    hunter_api_key: str = "your-hunter-api-key"
    hunter_base_url: str = "https://api.hunter.io/v2"
    hunter_proxy_url: Optional[str] = None
    
    # Redis Configuration
    redis_url: str = "redis://localhost:6379/0"
    
    # Cloudflare Configuration
    cloudflare_api_token: str = "your-cloudflare-api-token"
    cloudflare_zone_id: str = "your-zone-id"
    
    # LLM API Configuration
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4"
    openai_max_tokens: int = 2000
    openai_temperature: float = 0.7
    claude_api_key: Optional[str] = None
    llm_provider: str = "openai"  # openai, claude, mock
    
    # OSS/MinIO Configuration
    oss_endpoint_url: str = "http://localhost:9000"
    oss_access_key: str = "minioadmin"
    oss_secret_key: str = "minioadmin"
    oss_bucket_name: str = "hrepo-uploads"

    # Application Configuration
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8000

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # 忽略额外的环境变量


settings = Settings()
