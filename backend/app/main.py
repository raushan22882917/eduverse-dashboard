"""Main FastAPI application"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.routers import health, rag, doubt, homework, microplan, exam, videos, hots, admin, progress, analytics, translation, ai_tutoring, teacher_tools, wellbeing
from app.utils.exceptions import (
    APIException,
    api_exception_handler,
    validation_exception_handler,
    generic_exception_handler
)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Create FastAPI app
app = FastAPI(
    title="Class 12 Learning Platform API",
    description="Backend API for intelligent Class 12 learning platform with RAG, LLM, and adaptive learning",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add exception handlers
app.add_exception_handler(APIException, api_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(rag.router, prefix="/api", tags=["rag"])
app.include_router(doubt.router, prefix="/api", tags=["doubt"])
app.include_router(homework.router, prefix="/api", tags=["homework"])
app.include_router(microplan.router, prefix="/api", tags=["microplan"])
app.include_router(exam.router, prefix="/api", tags=["exam"])
app.include_router(videos.router, prefix="/api/videos", tags=["videos"])
app.include_router(hots.router, prefix="/api/hots", tags=["hots"])
app.include_router(admin.router, prefix="/api", tags=["admin"])
app.include_router(progress.router, prefix="/api", tags=["progress"])
app.include_router(analytics.router, prefix="/api", tags=["analytics"])
app.include_router(translation.router, prefix="/api", tags=["translation"])
app.include_router(ai_tutoring.router, prefix="/api", tags=["ai-tutoring"])
app.include_router(teacher_tools.router, prefix="/api", tags=["teacher-tools"])
app.include_router(wellbeing.router, prefix="/api", tags=["wellbeing"])

# Placeholder routers for future implementation
# app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
# app.include_router(packs.router, prefix="/api/packs", tags=["packs"])


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    print(f"Starting Class 12 Learning Platform API in {settings.app_env} mode")
    print(f"CORS enabled for origins: {settings.cors_origins_list}")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("Shutting down Class 12 Learning Platform API")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=settings.app_env == "development"
    )
