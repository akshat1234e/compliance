"""
API Routes
Main router for AI/ML services endpoints
"""

from fastapi import APIRouter

from src.api.endpoints import (
    nlp,
    regulatory_intelligence,
    risk_assessment,
    document_processing,
    models,
    model_training,
    ai_gateway,
    service_integration,
    batch_processing,
    api_docs,
    health,
)

# Create main API router
api_router = APIRouter()

# Include endpoint routers
api_router.include_router(
    health.router,
    prefix="/health",
    tags=["health"]
)

api_router.include_router(
    nlp.router,
    prefix="/nlp",
    tags=["nlp"]
)

api_router.include_router(
    regulatory_intelligence.router,
    prefix="/regulatory",
    tags=["regulatory-intelligence"]
)

api_router.include_router(
    risk_assessment.router,
    prefix="/risk",
    tags=["risk-assessment"]
)

api_router.include_router(
    document_processing.router,
    prefix="/documents",
    tags=["document-processing"]
)

api_router.include_router(
    models.router,
    prefix="/models",
    tags=["models"]
)

api_router.include_router(
    model_training.router,
    prefix="/training",
    tags=["model-training"]
)

api_router.include_router(
    ai_gateway.router,
    prefix="/ai",
    tags=["ai-gateway"]
)

api_router.include_router(
    service_integration.router,
    prefix="/integration",
    tags=["service-integration"]
)

api_router.include_router(
    batch_processing.router,
    prefix="/batch",
    tags=["batch-processing"]
)

api_router.include_router(
    api_docs.router,
    prefix="/docs",
    tags=["api-documentation"]
)
