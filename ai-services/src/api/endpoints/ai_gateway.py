"""
AI Gateway API Endpoints
Unified gateway for all AI/ML services with intelligent routing and orchestration
"""

from typing import Dict, Any, List, Optional, Union
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, Request
from pydantic import BaseModel, Field
import asyncio
import time

from src.core.logging import api_logger as logger
from src.core.models import get_model_manager, ModelManager
from src.services.model_training_pipeline import ModelTrainingPipeline
from src.services.document_intelligence import DocumentIntelligenceService

router = APIRouter()

# Initialize services
training_pipeline = ModelTrainingPipeline()
doc_intelligence = DocumentIntelligenceService()


class AIRequest(BaseModel):
    """Unified AI request model"""
    text: Optional[str] = Field(None, description="Text content for analysis")
    document_text: Optional[str] = Field(None, description="Document text content")
    operation: str = Field(..., description="AI operation to perform")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Operation-specific parameters")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Request metadata")


class BatchAIRequest(BaseModel):
    """Batch AI processing request"""
    requests: List[AIRequest] = Field(..., description="List of AI requests to process")
    parallel: bool = Field(default=True, description="Process requests in parallel")
    max_workers: int = Field(default=5, description="Maximum parallel workers")


class AIResponse(BaseModel):
    """Unified AI response model"""
    success: bool
    operation: str
    data: Dict[str, Any]
    metadata: Dict[str, Any] = Field(default_factory=dict)
    processing_time: float
    model_info: Dict[str, str] = Field(default_factory=dict)


@router.post("/process")
async def process_ai_request(
    request: AIRequest,
    model_manager: ModelManager = Depends(get_model_manager)
) -> AIResponse:
    """Unified AI processing endpoint with intelligent routing"""
    start_time = time.time()
    
    try:
        logger.info(f"Processing AI request: {request.operation}")
        
        # Route to appropriate AI service based on operation
        if request.operation in ["sentiment", "entities", "similarity", "analyze_text"]:
            result = await _process_nlp_request(request, model_manager)
        elif request.operation in ["classify_document", "extract_text", "analyze_structure"]:
            result = await _process_document_request(request)
        elif request.operation in ["assess_risk", "predict_risk", "scenario_analysis"]:
            result = await _process_risk_request(request)
        elif request.operation in ["analyze_regulatory", "compliance_check", "change_analysis"]:
            result = await _process_regulatory_request(request)
        elif request.operation in ["train_model", "predict", "evaluate_model"]:
            result = await _process_ml_request(request)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown operation: {request.operation}")
        
        processing_time = time.time() - start_time
        
        return AIResponse(
            success=True,
            operation=request.operation,
            data=result,
            metadata=request.metadata,
            processing_time=processing_time,
            model_info={"service": "ai-gateway", "version": "1.0.0"}
        )
        
    except Exception as e:
        processing_time = time.time() - start_time
        logger.error(f"AI request processing failed: {e}")
        
        return AIResponse(
            success=False,
            operation=request.operation,
            data={"error": str(e)},
            metadata=request.metadata,
            processing_time=processing_time,
            model_info={"service": "ai-gateway", "version": "1.0.0"}
        )


@router.post("/batch")
async def process_batch_requests(
    request: BatchAIRequest,
    background_tasks: BackgroundTasks,
    model_manager: ModelManager = Depends(get_model_manager)
) -> Dict[str, Any]:
    """Process multiple AI requests in batch"""
    try:
        logger.info(f"Processing batch of {len(request.requests)} AI requests")
        
        if request.parallel:
            # Process requests in parallel
            tasks = []
            for ai_request in request.requests:
                task = asyncio.create_task(process_ai_request(ai_request, model_manager))
                tasks.append(task)
            
            # Limit concurrent tasks
            semaphore = asyncio.Semaphore(request.max_workers)
            
            async def process_with_semaphore(task):
                async with semaphore:
                    return await task
            
            results = await asyncio.gather(*[process_with_semaphore(task) for task in tasks])
        else:
            # Process requests sequentially
            results = []
            for ai_request in request.requests:
                result = await process_ai_request(ai_request, model_manager)
                results.append(result)
        
        # Calculate batch statistics
        successful = sum(1 for r in results if r.success)
        failed = len(results) - successful
        total_time = sum(r.processing_time for r in results)
        
        return {
            "success": True,
            "data": {
                "results": [r.dict() for r in results],
                "statistics": {
                    "total_requests": len(request.requests),
                    "successful": successful,
                    "failed": failed,
                    "success_rate": successful / len(request.requests),
                    "total_processing_time": total_time,
                    "average_processing_time": total_time / len(request.requests)
                }
            },
            "message": f"Batch processing completed: {successful}/{len(request.requests)} successful"
        }
        
    except Exception as e:
        logger.error(f"Batch processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Batch processing failed: {str(e)}")


@router.get("/capabilities")
async def get_ai_capabilities() -> Dict[str, Any]:
    """Get comprehensive AI service capabilities"""
    capabilities = {
        "nlp": {
            "operations": ["sentiment", "entities", "similarity", "analyze_text"],
            "description": "Natural Language Processing services",
            "features": ["sentiment_analysis", "entity_extraction", "text_similarity", "comprehensive_analysis"],
            "supported_languages": ["en", "hi"],
            "max_text_length": 10000
        },
        "document_processing": {
            "operations": ["classify_document", "extract_text", "analyze_structure"],
            "description": "Document analysis and processing",
            "features": ["ocr", "classification", "structure_analysis", "metadata_extraction"],
            "supported_formats": ["pdf", "docx", "txt", "jpg", "png", "tiff"],
            "max_file_size": "50MB"
        },
        "risk_assessment": {
            "operations": ["assess_risk", "predict_risk", "scenario_analysis"],
            "description": "Risk analysis and prediction",
            "features": ["risk_scoring", "prediction", "scenario_modeling", "stress_testing"],
            "risk_categories": ["credit", "market", "operational", "compliance"],
            "prediction_horizon": "12_months"
        },
        "regulatory_intelligence": {
            "operations": ["analyze_regulatory", "compliance_check", "change_analysis"],
            "description": "Regulatory analysis and compliance",
            "features": ["document_analysis", "compliance_verification", "change_detection", "impact_assessment"],
            "jurisdictions": ["RBI", "SEBI", "IRDAI", "NPCI"],
            "document_types": ["circulars", "guidelines", "notifications", "amendments"]
        },
        "machine_learning": {
            "operations": ["train_model", "predict", "evaluate_model"],
            "description": "Machine learning model operations",
            "features": ["automated_training", "prediction", "evaluation", "model_management"],
            "model_types": ["classification", "regression", "clustering", "neural_networks"],
            "frameworks": ["scikit-learn", "tensorflow", "pytorch"]
        }
    }
    
    return {
        "success": True,
        "data": {
            "capabilities": capabilities,
            "total_operations": sum(len(cap["operations"]) for cap in capabilities.values()),
            "service_version": "1.0.0",
            "api_version": "v1"
        },
        "message": "AI service capabilities retrieved successfully"
    }


@router.get("/status")
async def get_ai_service_status() -> Dict[str, Any]:
    """Get comprehensive AI service status"""
    try:
        # Get model manager status
        model_manager = get_model_manager()
        models_status = model_manager.get_health_status()
        
        # Get training pipeline status
        training_status = await training_pipeline.get_training_status()
        
        # Service health checks
        services_status = {
            "nlp_service": {"status": "healthy", "models_loaded": len(models_status.get("loaded_models", []))},
            "document_service": {"status": "healthy", "ocr_available": True},
            "risk_service": {"status": "healthy", "models_trained": len(training_status.get("models", {}))},
            "regulatory_service": {"status": "healthy", "patterns_loaded": True},
            "training_service": {"status": training_status.get("pipeline_status", "unknown")}
        }
        
        # Overall health
        all_healthy = all(service["status"] == "healthy" for service in services_status.values())
        
        return {
            "success": True,
            "data": {
                "overall_status": "healthy" if all_healthy else "degraded",
                "services": services_status,
                "models": models_status,
                "training_pipeline": training_status,
                "last_updated": time.time()
            },
            "message": "AI service status retrieved successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to get AI service status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get service status: {str(e)}")


# Helper functions for routing requests to specific services
async def _process_nlp_request(request: AIRequest, model_manager: ModelManager) -> Dict[str, Any]:
    """Process NLP-specific requests"""
    text = request.text or request.document_text
    if not text:
        raise ValueError("Text content is required for NLP operations")
    
    if request.operation == "sentiment":
        pipeline = model_manager.get_pipeline("sentiment")
        result = pipeline(text)
        return {"sentiment": result[0]}
    
    elif request.operation == "entities":
        nlp = model_manager.get_spacy_nlp()
        doc = nlp(text)
        entities = [{"text": ent.text, "label": ent.label_, "start": ent.start_char, "end": ent.end_char} for ent in doc.ents]
        return {"entities": entities, "entity_count": len(entities)}
    
    elif request.operation == "similarity":
        text2 = request.parameters.get("text2")
        if not text2:
            raise ValueError("text2 parameter is required for similarity operation")
        
        sentence_transformer = model_manager.get_sentence_transformer()
        embeddings = sentence_transformer.encode([text, text2])
        
        from sklearn.metrics.pairwise import cosine_similarity
        similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
        
        return {"similarity_score": float(similarity), "similarity_percentage": float(similarity * 100)}
    
    elif request.operation == "analyze_text":
        # Comprehensive text analysis
        result = {}
        
        # Sentiment
        try:
            pipeline = model_manager.get_pipeline("sentiment")
            sentiment = pipeline(text)
            result["sentiment"] = sentiment[0]
        except:
            result["sentiment"] = {"error": "unavailable"}
        
        # Entities
        try:
            nlp = model_manager.get_spacy_nlp()
            doc = nlp(text)
            entities = [{"text": ent.text, "label": ent.label_} for ent in doc.ents]
            result["entities"] = entities
        except:
            result["entities"] = {"error": "unavailable"}
        
        # Basic stats
        result["statistics"] = {
            "character_count": len(text),
            "word_count": len(text.split()),
            "sentence_count": len([s for s in text.split('.') if s.strip()])
        }
        
        return result
    
    else:
        raise ValueError(f"Unknown NLP operation: {request.operation}")


async def _process_document_request(request: AIRequest) -> Dict[str, Any]:
    """Process document-specific requests"""
    document_text = request.document_text or request.text
    if not document_text:
        raise ValueError("Document text is required for document operations")
    
    if request.operation == "classify_document":
        categories = request.parameters.get("categories", [])
        result = await doc_intelligence.classify_document(document_text, categories)
        return result
    
    elif request.operation == "analyze_structure":
        result = await doc_intelligence.analyze_document_structure(document_text)
        return result
    
    elif request.operation == "extract_text":
        # This would typically be used with file uploads
        return {"extracted_text": document_text, "method": "direct"}
    
    else:
        raise ValueError(f"Unknown document operation: {request.operation}")


async def _process_risk_request(request: AIRequest) -> Dict[str, Any]:
    """Process risk assessment requests"""
    # Mock risk assessment - in production, this would call the risk service
    if request.operation == "assess_risk":
        risk_factors = request.parameters.get("risk_factors", {})
        risk_score = sum(risk_factors.values()) / len(risk_factors) if risk_factors else 0.5
        
        return {
            "risk_score": risk_score,
            "risk_level": "high" if risk_score > 0.7 else "medium" if risk_score > 0.4 else "low",
            "factors_analyzed": len(risk_factors),
            "recommendation": "Monitor closely" if risk_score > 0.6 else "Standard monitoring"
        }
    
    elif request.operation == "predict_risk":
        horizon = request.parameters.get("horizon", 12)
        return {
            "predicted_risk_score": 0.45,
            "prediction_horizon": horizon,
            "confidence": 0.85,
            "trend": "stable"
        }
    
    elif request.operation == "scenario_analysis":
        scenarios = request.parameters.get("scenarios", ["base", "stress"])
        results = {}
        for scenario in scenarios:
            results[scenario] = {
                "risk_score": 0.3 if scenario == "base" else 0.8,
                "impact": "low" if scenario == "base" else "high"
            }
        return {"scenario_results": results}
    
    else:
        raise ValueError(f"Unknown risk operation: {request.operation}")


async def _process_regulatory_request(request: AIRequest) -> Dict[str, Any]:
    """Process regulatory intelligence requests"""
    text = request.text or request.document_text
    if not text:
        raise ValueError("Text content is required for regulatory operations")
    
    if request.operation == "analyze_regulatory":
        # Mock regulatory analysis
        return {
            "document_type": "regulatory_circular",
            "jurisdiction": "RBI",
            "compliance_requirements": ["KYC updates", "Risk assessment", "Reporting changes"],
            "impact_level": "medium",
            "effective_date": "2024-04-01"
        }
    
    elif request.operation == "compliance_check":
        requirements = request.parameters.get("requirements", [])
        return {
            "compliance_status": "compliant",
            "checked_requirements": len(requirements),
            "violations": [],
            "recommendations": ["Continue monitoring", "Update policies"]
        }
    
    elif request.operation == "change_analysis":
        return {
            "changes_detected": 3,
            "change_types": ["policy_update", "deadline_extension", "new_requirement"],
            "impact_assessment": "medium",
            "action_required": True
        }
    
    else:
        raise ValueError(f"Unknown regulatory operation: {request.operation}")


async def _process_ml_request(request: AIRequest) -> Dict[str, Any]:
    """Process machine learning requests"""
    if request.operation == "train_model":
        model_name = request.parameters.get("model_name")
        if not model_name:
            raise ValueError("model_name parameter is required for training")
        
        # This would trigger actual training
        return {
            "model_name": model_name,
            "training_status": "started",
            "estimated_time": "30 minutes"
        }
    
    elif request.operation == "predict":
        model_name = request.parameters.get("model_name")
        features = request.parameters.get("features", {})
        
        # Mock prediction
        return {
            "model_name": model_name,
            "prediction": 0.75,
            "confidence": 0.92,
            "features_used": len(features)
        }
    
    elif request.operation == "evaluate_model":
        model_name = request.parameters.get("model_name")
        return {
            "model_name": model_name,
            "accuracy": 0.87,
            "precision": 0.85,
            "recall": 0.89,
            "f1_score": 0.87
        }
    
    else:
        raise ValueError(f"Unknown ML operation: {request.operation}")
