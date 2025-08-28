"""
AI/ML Services Main Application
FastAPI-based microservice for regulatory intelligence and risk assessment
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from src.core.config import settings
from src.core.logging import setup_logging
from src.core.database import init_databases, close_databases
from src.core.cache import init_cache, close_cache
from src.core.models import init_models
from src.api.routes import api_router
from src.api.middleware import (
    RequestLoggingMiddleware,
    ErrorHandlingMiddleware,
    RateLimitMiddleware,
)
from src.services.scheduled_training_service import scheduled_training_service

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("🚀 Starting AI/ML Services...")

    try:
        # Initialize databases
        await init_databases()
        logger.info("✅ Databases initialized")

        # Initialize cache
        await init_cache()
        logger.info("✅ Cache initialized")

        # Initialize ML models
        await init_models()
        logger.info("✅ ML models initialized")

        # Start scheduled training service
        scheduled_training_service.start()
        logger.info("✅ Scheduled training service started")

        logger.info("🎯 AI/ML Services startup completed")

    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise

    yield

    # Shutdown
    logger.info("🛑 Shutting down AI/ML Services...")

    try:
        # Stop scheduled training service
        scheduled_training_service.stop()
        logger.info("✅ Scheduled training service stopped")

        await close_cache()
        await close_databases()
        logger.info("✅ Cleanup completed")

    except Exception as e:
        logger.error(f"❌ Shutdown error: {e}")


# Create FastAPI application
app = FastAPI(
    title="AI/ML Services",
    description="AI-powered regulatory intelligence and risk assessment services",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan,
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(ErrorHandlingMiddleware)

if settings.ENABLE_RATE_LIMITING:
    app.add_middleware(RateLimitMiddleware)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root() -> Dict[str, Any]:
    """Root endpoint"""
    return {
        "service": "AI/ML Services",
        "version": "1.0.0",
        "description": "AI-powered regulatory intelligence and risk assessment",
        "status": "healthy",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "api": "/api/v1",
        },
        "features": {
            "regulatory_intelligence": True,
            "risk_assessment": True,
            "document_processing": True,
            "nlp_analysis": True,
            "machine_learning": True,
        },
    }


@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ai-services",
        "version": "1.0.0",
        "timestamp": "2024-01-15T10:00:00Z",
        "environment": settings.ENVIRONMENT,
        "components": {
            "api": "healthy",
            "database": "healthy",
            "cache": "healthy",
            "models": "healthy",
        },
    }


@app.get("/metrics")
async def metrics() -> Dict[str, Any]:
    """Metrics endpoint for monitoring"""
    return {
        "requests_total": 0,
        "requests_duration_seconds": 0.0,
        "model_predictions_total": 0,
        "model_accuracy": 0.0,
        "cache_hit_rate": 0.0,
        "memory_usage_bytes": 0,
        "cpu_usage_percent": 0.0,
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)

    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred",
            "request_id": getattr(request.state, "request_id", None),
        },
    )


if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        workers=settings.API_WORKERS if not settings.DEBUG else 1,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
        access_log=True,
    )
