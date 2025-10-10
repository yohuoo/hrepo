from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.routers import overseas_router, hunter_router, contacts_router, email_templates_router, customers_router, email_accounts_router

# Create FastAPI app
app = FastAPI(
    title="HRepo API - 海外客户搜索系统",
    description="""
    ## 系统功能
    
    海外客户搜索系统，专注于代糖产业公司信息获取。
    
    ### 可用接口
    - GET / - 根路径欢迎信息
    - GET /health - 系统健康检查
    - GET /overseas/companies/sugar-free - 获取海外代糖产业公司列表
    - GET /overseas/companies/search - 自定义搜索海外公司
    
    ### 核心功能
    - LLM大模型驱动的联网搜索
    - 海外代糖产业公司信息获取
    - 支持多国家、多规模筛选
    - 结构化公司数据返回
    
    ### 技术特性
    - 基于FastAPI的高性能框架
    - OpenAI GPT-4集成
    - 数据库连接配置
    - CORS中间件支持
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(overseas_router)
app.include_router(hunter_router)
app.include_router(contacts_router)
app.include_router(email_templates_router)
app.include_router(customers_router)
app.include_router(email_accounts_router)


@app.get("/")
def read_root():
    """Root endpoint"""
    return {
        "message": "Welcome to HRepo API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "HRepo API",
        "version": "1.0.0"
    }


@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    print("Starting HRepo API...")
    print(f"Debug mode: {settings.debug}")
    print("海外客户搜索系统启动完成")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    print("Shutting down HRepo API...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
