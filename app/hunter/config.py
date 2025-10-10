"""
Hunter API配置模块
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings


class HunterConfig(BaseSettings):
    """Hunter API配置类"""
    
    # Hunter API配置
    hunter_api_key: Optional[str] = None
    hunter_base_url: str = "https://api.hunter.io/v2"
    
    # 请求配置
    request_timeout: int = 30
    max_retries: int = 3
    retry_delay: float = 1.0
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # 确保从环境变量获取Hunter API Key
        if not self.hunter_api_key:
            self.hunter_api_key = os.getenv("HUNTER_API_KEY")
            print(f"🔍 从环境变量读取HUNTER_API_KEY: {'已设置' if self.hunter_api_key else '未设置'}")


# 全局配置实例
hunter_config = HunterConfig()
