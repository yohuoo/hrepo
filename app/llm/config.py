"""
LLM配置模块
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings


class LLMConfig(BaseSettings):
    """LLM配置类"""
    
    # OpenAI配置
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4"
    openai_temperature: float = 0.7
    openai_max_tokens: int = 8000  # 增加token限制以支持function_call
    openai_base_url: str = "https://api.openai.com/v1"
    
    # 搜索配置
    search_timeout: int = 120  # 增加到120秒
    max_retries: int = 3
    retry_delay: float = 1.0
    
    # 公司搜索特定配置
    max_companies_per_search: int = 20
    search_language: str = "zh-CN"
    
    class Config:
        env_file = ".env"
        # 不使用前缀，直接读取环境变量
        case_sensitive = False
        extra = "ignore"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # 确保从环境变量获取OpenAI API Key
        if not self.openai_api_key:
            self.openai_api_key = os.getenv("OPENAI_API_KEY")


# 全局配置实例
llm_config = LLMConfig()
