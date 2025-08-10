"""
Health Check Endpoints
System health and status monitoring
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends

from src.core.database import db_manager
from src.core.cache import cache_manager
from src.core.models import model_manager
from src.api.middleware import metrics_middleware

router = APIRouter()


@router.get("/")
async def health_check() -> Dict[str, Any]:
    """Basic health check"""
    return {
        "status": "healthy",
        "service": "ai-services",
        "version": "1.0.0",
        "timestamp": "2024-01-15T10:00:00Z",
    }


@router.get("/detailed")
async def detailed_health_check() -> Dict[str, Any]:
    """Detailed health check with component status"""
    
    # Check database connections
    postgres_status = "healthy" if db_manager.postgres_engine else "unhealthy"
    mongodb_status = "healthy" if db_manager.mongodb_client else "unhealthy"
    elasticsearch_status = "healthy" if db_manager.elasticsearch_client else "unhealthy"
    
    # Check cache
    cache_status = "healthy" if cache_manager.redis_client else "unhealthy"
    
    # Check models
    models_status = "healthy" if model_manager._initialized else "unhealthy"
    
    return {
        "status": "healthy",
        "service": "ai-services",
        "version": "1.0.0",
        "timestamp": "2024-01-15T10:00:00Z",
        "components": {
            "database": {
                "postgres": postgres_status,
                "mongodb": mongodb_status,
                "elasticsearch": elasticsearch_status,
            },
            "cache": {
                "redis": cache_status,
            },
            "models": {
                "status": models_status,
                "available": model_manager.list_available_models(),
            },
        },
    }


@router.get("/metrics")
async def get_metrics() -> Dict[str, Any]:
    """Get system metrics"""
    return {
        "service": "ai-services",
        "metrics": metrics_middleware.get_metrics(),
        "timestamp": "2024-01-15T10:00:00Z",
    }


@router.get("/ready")
async def readiness_check() -> Dict[str, Any]:
    """Kubernetes readiness probe"""
    # Check if all critical components are ready
    ready = (
        db_manager.postgres_engine is not None and
        cache_manager.redis_client is not None and
        model_manager._initialized
    )
    
    status_code = 200 if ready else 503
    
    return {
        "status": "ready" if ready else "not ready",
        "service": "ai-services",
        "timestamp": "2024-01-15T10:00:00Z",
    }


@router.get("/live")
async def liveness_check() -> Dict[str, Any]:
    """Kubernetes liveness probe"""
    return {
        "status": "alive",
        "service": "ai-services",
        "timestamp": "2024-01-15T10:00:00Z",
    }
