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
