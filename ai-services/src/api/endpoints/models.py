"""
Models Management Endpoints
ML model management and information
"""

from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from src.core.models import get_model_manager, ModelManager
from src.core.logging import api_logger as logger

router = APIRouter()


class ModelReloadRequest(BaseModel):
    """Request model for reloading models"""
    model_name: str = Field(..., description="Name of model to reload")


@router.get("/")
async def list_models(
    model_manager: ModelManager = Depends(get_model_manager)
) -> Dict[str, Any]:
    """List all available models"""
    try:
        models_info = model_manager.list_available_models()
        
        detailed_info = {
            "spacy": {
                "name": "spaCy NLP",
                "type": "nlp",
                "status": "loaded" if models_info["spacy"] else "not_loaded",
                "description": "Natural language processing model for entity recognition and text analysis",
                "capabilities": ["tokenization", "pos_tagging", "ner", "dependency_parsing"],
            },
            "sentence_transformer": {
                "name": "Sentence Transformer",
                "type": "embedding",
                "status": "loaded" if models_info["sentence_transformer"] else "not_loaded",
                "description": "Sentence embedding model for semantic similarity",
                "capabilities": ["text_embeddings", "semantic_similarity", "clustering"],
            },
        }
        
        # Add HuggingFace models
        for model_name in models_info["models"]:
            detailed_info[model_name] = {
                "name": model_name.replace("_", " ").title(),
                "type": "transformer",
                "status": "loaded",
                "description": f"HuggingFace transformer model for {model_name}",
                "capabilities": ["text_classification", "feature_extraction"],
            }
        
        return {
            "success": True,
            "data": {
                "models": detailed_info,
                "summary": {
                    "total_models": len(detailed_info),
                    "loaded_models": sum(1 for m in detailed_info.values() if m["status"] == "loaded"),
                    "model_types": list(set(m["type"] for m in detailed_info.values())),
                },
                "status": models_info,
            },
            "message": "Models information retrieved successfully",
        }
        
    except Exception as e:
        logger.error(f"Failed to list models: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list models: {str(e)}")


@router.get("/{model_name}")
async def get_model_info(
    model_name: str,
    model_manager: ModelManager = Depends(get_model_manager)
) -> Dict[str, Any]:
    """Get detailed information about a specific model"""
    try:
        models_info = model_manager.list_available_models()
        
        if model_name == "spacy":
            if not models_info["spacy"]:
                raise HTTPException(status_code=404, detail="spaCy model not loaded")
            
            nlp = model_manager.get_spacy_nlp()
            return {
                "success": True,
                "data": {
                    "name": "spaCy NLP",
                    "type": "nlp",
                    "status": "loaded",
                    "model_name": nlp.meta["name"],
                    "version": nlp.meta["version"],
                    "language": nlp.meta["lang"],
                    "pipeline": nlp.pipe_names,
                    "capabilities": ["tokenization", "pos_tagging", "ner", "dependency_parsing"],
                    "memory_usage": "~500MB",  # Mock value
                },
                "message": "spaCy model information retrieved successfully",
            }
        
        elif model_name == "sentence_transformer":
            if not models_info["sentence_transformer"]:
                raise HTTPException(status_code=404, detail="Sentence Transformer model not loaded")
            
            return {
                "success": True,
                "data": {
                    "name": "Sentence Transformer",
                    "type": "embedding",
                    "status": "loaded",
                    "model_name": "all-MiniLM-L6-v2",  # From config
                    "embedding_dimension": 384,
                    "max_sequence_length": 256,
                    "capabilities": ["text_embeddings", "semantic_similarity", "clustering"],
                    "memory_usage": "~90MB",  # Mock value
                },
                "message": "Sentence Transformer model information retrieved successfully",
            }
        
        elif model_name in models_info["models"]:
            return {
                "success": True,
                "data": {
                    "name": model_name.replace("_", " ").title(),
                    "type": "transformer",
                    "status": "loaded",
                    "model_name": model_name,
                    "capabilities": ["text_classification", "feature_extraction"],
                    "memory_usage": "~1GB",  # Mock value
                },
                "message": f"{model_name} model information retrieved successfully",
            }
        
        else:
            raise HTTPException(status_code=404, detail=f"Model {model_name} not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get model info for {model_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get model info: {str(e)}")


@router.post("/reload")
async def reload_model(
    request: ModelReloadRequest,
    model_manager: ModelManager = Depends(get_model_manager)
) -> Dict[str, Any]:
    """Reload a specific model"""
    try:
        logger.info(f"Reloading model: {request.model_name}")
        
        success = await model_manager.reload_model(request.model_name)
        
        if success:
            return {
                "success": True,
                "data": {
                    "model_name": request.model_name,
                    "status": "reloaded",
                    "timestamp": "2024-01-15T10:00:00Z",
                },
                "message": f"Model {request.model_name} reloaded successfully",
            }
        else:
            raise HTTPException(status_code=500, detail=f"Failed to reload model {request.model_name}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to reload model {request.model_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reload model: {str(e)}")


@router.get("/health/check")
async def check_models_health(
    model_manager: ModelManager = Depends(get_model_manager)
) -> Dict[str, Any]:
    """Check health status of all models"""
    try:
        models_info = model_manager.list_available_models()
        
        health_status = {}
        overall_healthy = True
        
        # Check spaCy model
        try:
            if models_info["spacy"]:
                nlp = model_manager.get_spacy_nlp()
                # Test with a simple sentence
                doc = nlp("Test sentence for health check.")
                health_status["spacy"] = {
                    "status": "healthy",
                    "response_time": "~50ms",  # Mock value
                    "last_check": "2024-01-15T10:00:00Z",
                }
            else:
                health_status["spacy"] = {
                    "status": "not_loaded",
                    "last_check": "2024-01-15T10:00:00Z",
                }
                overall_healthy = False
        except Exception as e:
            health_status["spacy"] = {
                "status": "unhealthy",
                "error": str(e),
                "last_check": "2024-01-15T10:00:00Z",
            }
            overall_healthy = False
        
        # Check Sentence Transformer
        try:
            if models_info["sentence_transformer"]:
                st = model_manager.get_sentence_transformer()
                # Test with a simple sentence
                embedding = st.encode("Test sentence for health check.")
                health_status["sentence_transformer"] = {
                    "status": "healthy",
                    "response_time": "~100ms",  # Mock value
                    "embedding_dimension": len(embedding),
                    "last_check": "2024-01-15T10:00:00Z",
                }
            else:
                health_status["sentence_transformer"] = {
                    "status": "not_loaded",
                    "last_check": "2024-01-15T10:00:00Z",
                }
                overall_healthy = False
        except Exception as e:
            health_status["sentence_transformer"] = {
                "status": "unhealthy",
                "error": str(e),
                "last_check": "2024-01-15T10:00:00Z",
            }
            overall_healthy = False
        
        # Check HuggingFace models
        for model_name in models_info["models"]:
            try:
                model = model_manager.get_model(model_name)
                health_status[model_name] = {
                    "status": "healthy",
                    "response_time": "~200ms",  # Mock value
                    "last_check": "2024-01-15T10:00:00Z",
                }
            except Exception as e:
                health_status[model_name] = {
                    "status": "unhealthy",
                    "error": str(e),
                    "last_check": "2024-01-15T10:00:00Z",
                }
                overall_healthy = False
        
        return {
            "success": True,
            "data": {
                "overall_status": "healthy" if overall_healthy else "degraded",
                "models": health_status,
                "summary": {
                    "total_models": len(health_status),
                    "healthy_models": sum(1 for m in health_status.values() if m["status"] == "healthy"),
                    "unhealthy_models": sum(1 for m in health_status.values() if m["status"] == "unhealthy"),
                    "not_loaded_models": sum(1 for m in health_status.values() if m["status"] == "not_loaded"),
                },
                "timestamp": "2024-01-15T10:00:00Z",
            },
            "message": "Models health check completed",
        }
        
    except Exception as e:
        logger.error(f"Models health check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")


@router.get("/capabilities")
async def get_model_capabilities() -> Dict[str, Any]:
    """Get available model capabilities"""
    capabilities = {
        "nlp": {
            "description": "Natural Language Processing",
            "features": [
                "tokenization",
                "part_of_speech_tagging",
                "named_entity_recognition",
                "dependency_parsing",
                "sentiment_analysis",
                "text_classification",
            ],
            "models": ["spacy", "sentiment", "ner", "classification"],
        },
        "embeddings": {
            "description": "Text Embeddings and Similarity",
            "features": [
                "text_embeddings",
                "semantic_similarity",
                "document_clustering",
                "text_search",
            ],
            "models": ["sentence_transformer"],
        },
        "document_processing": {
            "description": "Document Analysis and Processing",
            "features": [
                "text_extraction",
                "document_classification",
                "summarization",
                "key_phrase_extraction",
            ],
            "models": ["spacy", "sentence_transformer"],
        },
        "regulatory_intelligence": {
            "description": "Regulatory Analysis and Compliance",
            "features": [
                "regulatory_document_analysis",
                "compliance_checking",
                "regulatory_change_detection",
                "impact_assessment",
            ],
            "models": ["spacy", "sentence_transformer", "classification"],
        },
        "risk_assessment": {
            "description": "Risk Analysis and Prediction",
            "features": [
                "risk_scoring",
                "risk_prediction",
                "scenario_analysis",
                "stress_testing",
            ],
            "models": ["custom_risk_models"],
        },
    }
    
    return {
        "success": True,
        "data": {
            "capabilities": capabilities,
            "total_capabilities": len(capabilities),
            "total_features": sum(len(cap["features"]) for cap in capabilities.values()),
        },
        "message": "Model capabilities retrieved successfully",
    }
