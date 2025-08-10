"""
Document Processing Endpoints
AI-powered document analysis and processing
"""

from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from pydantic import BaseModel, Field

from src.core.models import get_model_manager, ModelManager
from src.core.logging import api_logger as logger

router = APIRouter()


class DocumentAnalysisRequest(BaseModel):
    """Request model for document analysis"""
    document_text: str = Field(..., description="Document text content", max_length=100000)
    document_type: str = Field(default="general", description="Type of document")
    analysis_type: List[str] = Field(default=["summary", "entities", "sentiment"], description="Types of analysis to perform")


class DocumentClassificationRequest(BaseModel):
    """Request model for document classification"""
    document_text: str = Field(..., description="Document text content", max_length=100000)
    categories: List[str] = Field(default=[], description="Possible categories for classification")


@router.post("/analyze")
async def analyze_document(
    request: DocumentAnalysisRequest,
    model_manager: ModelManager = Depends(get_model_manager)
) -> Dict[str, Any]:
    """Comprehensive document analysis"""
    try:
        logger.info(f"Analyzing document of type {request.document_type}")
        
        result = {
            "document_type": request.document_type,
            "document_length": len(request.document_text),
            "word_count": len(request.document_text.split()),
        }
        
        # Document summary
        if "summary" in request.analysis_type:
            try:
                # Mock summarization (in real implementation, use a summarization model)
                sentences = request.document_text.split('.')[:3]  # First 3 sentences as mock summary
                summary = '. '.join(sentences).strip() + '.'
                
                result["summary"] = {
                    "text": summary,
                    "length": len(summary),
                    "compression_ratio": len(summary) / len(request.document_text),
                }
            except Exception as e:
                logger.warning(f"Summarization failed: {e}")
                result["summary"] = {"error": "Summarization unavailable"}
        
        # Entity extraction
        if "entities" in request.analysis_type:
            try:
                nlp = model_manager.get_spacy_nlp()
                doc = nlp(request.document_text)
                
                entities = [
                    {
                        "text": ent.text,
                        "label": ent.label_,
                        "start": ent.start_char,
                        "end": ent.end_char,
                        "confidence": 0.9,  # Mock confidence
                    }
                    for ent in doc.ents
                ]
                
                result["entities"] = {
                    "entities": entities,
                    "entity_count": len(entities),
                    "entity_types": list(set(ent["label"] for ent in entities)),
                }
            except Exception as e:
                logger.warning(f"Entity extraction failed: {e}")
                result["entities"] = {"error": "Entity extraction unavailable"}
        
        # Sentiment analysis
        if "sentiment" in request.analysis_type:
            try:
                sentiment_pipeline = model_manager.get_pipeline("sentiment")
                sentiment_result = sentiment_pipeline(request.document_text[:512])  # Limit text length
                
                result["sentiment"] = {
                    "label": sentiment_result[0]["label"],
                    "score": sentiment_result[0]["score"],
                    "confidence": sentiment_result[0]["score"],
                }
            except Exception as e:
                logger.warning(f"Sentiment analysis failed: {e}")
                result["sentiment"] = {"error": "Sentiment analysis unavailable"}
        
        # Key phrases extraction
        if "keyphrases" in request.analysis_type:
            try:
                nlp = model_manager.get_spacy_nlp()
                doc = nlp(request.document_text)
                
                # Extract noun phrases as key phrases
                keyphrases = [
                    {
                        "text": chunk.text,
                        "start": chunk.start_char,
                        "end": chunk.end_char,
                        "importance": len(chunk.text.split()),  # Mock importance based on length
                    }
                    for chunk in doc.noun_chunks
                    if len(chunk.text.split()) > 1  # Multi-word phrases only
                ]
                
                # Sort by importance and take top 10
                keyphrases = sorted(keyphrases, key=lambda x: x["importance"], reverse=True)[:10]
                
                result["keyphrases"] = {
                    "phrases": keyphrases,
                    "phrase_count": len(keyphrases),
                }
            except Exception as e:
                logger.warning(f"Keyphrase extraction failed: {e}")
                result["keyphrases"] = {"error": "Keyphrase extraction unavailable"}
        
        return {
            "success": True,
            "data": result,
            "message": "Document analysis completed successfully",
        }
        
    except Exception as e:
        logger.error(f"Document analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Document analysis failed: {str(e)}")


@router.post("/classify")
async def classify_document(
    request: DocumentClassificationRequest,
    model_manager: ModelManager = Depends(get_model_manager)
) -> Dict[str, Any]:
    """Document classification"""
    try:
        logger.info("Classifying document")
        
        # Mock classification implementation
        if not request.categories:
            # Default categories for regulatory documents
            categories = [
                "regulatory_circular",
                "policy_document",
                "compliance_guideline",
                "risk_management",
                "operational_procedure",
                "financial_regulation",
            ]
        else:
            categories = request.categories
        
        # Mock classification scores
        classification_results = []
        for i, category in enumerate(categories):
            score = 0.9 - (i * 0.1)  # Mock decreasing scores
            classification_results.append({
                "category": category,
                "score": max(0.1, score),
                "confidence": max(0.1, score),
            })
        
        # Sort by score
        classification_results = sorted(classification_results, key=lambda x: x["score"], reverse=True)
        
        # Determine predicted category
        predicted_category = classification_results[0]["category"]
        predicted_score = classification_results[0]["score"]
        
        return {
            "success": True,
            "data": {
                "predicted_category": predicted_category,
                "predicted_score": predicted_score,
                "confidence": predicted_score,
                "all_scores": classification_results,
                "document_length": len(request.document_text),
                "word_count": len(request.document_text.split()),
            },
            "message": "Document classification completed successfully",
        }
        
    except Exception as e:
        logger.error(f"Document classification failed: {e}")
        raise HTTPException(status_code=500, detail=f"Document classification failed: {str(e)}")


@router.post("/upload")
async def upload_and_analyze_document(
    file: UploadFile = File(...),
    analysis_type: str = "full",
    model_manager: ModelManager = Depends(get_model_manager)
) -> Dict[str, Any]:
    """Upload and analyze document file"""
    try:
        logger.info(f"Processing uploaded file: {file.filename}")
        
        # Check file type
        allowed_types = ["text/plain", "application/pdf", "application/msword"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")
        
        # Read file content
        content = await file.read()
        
        # Extract text based on file type
        if file.content_type == "text/plain":
            document_text = content.decode("utf-8")
        elif file.content_type == "application/pdf":
            # Mock PDF text extraction
            document_text = "Mock extracted text from PDF document. This would contain the actual PDF content in a real implementation."
        else:
            # Mock document text extraction
            document_text = "Mock extracted text from document. This would contain the actual document content in a real implementation."
        
        # Perform analysis
        analysis_request = DocumentAnalysisRequest(
            document_text=document_text,
            document_type="uploaded",
            analysis_type=["summary", "entities", "sentiment", "keyphrases"] if analysis_type == "full" else [analysis_type]
        )
        
        analysis_result = await analyze_document(analysis_request, model_manager)
        
        # Add file metadata
        analysis_result["data"]["file_info"] = {
            "filename": file.filename,
            "content_type": file.content_type,
            "file_size": len(content),
        }
        
        return analysis_result
        
    except Exception as e:
        logger.error(f"File upload and analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"File processing failed: {str(e)}")


@router.post("/extract-text")
async def extract_text_from_file(
    file: UploadFile = File(...)
) -> Dict[str, Any]:
    """Extract text from uploaded file"""
    try:
        logger.info(f"Extracting text from file: {file.filename}")
        
        # Read file content
        content = await file.read()
        
        # Extract text based on file type
        if file.content_type == "text/plain":
            extracted_text = content.decode("utf-8")
        elif file.content_type == "application/pdf":
            # Mock PDF text extraction
            extracted_text = "Mock extracted text from PDF. In a real implementation, this would use libraries like PyPDF2 or pdfplumber."
        elif file.content_type in ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
            # Mock Word document text extraction
            extracted_text = "Mock extracted text from Word document. In a real implementation, this would use libraries like python-docx."
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")
        
        return {
            "success": True,
            "data": {
                "filename": file.filename,
                "content_type": file.content_type,
                "file_size": len(content),
                "extracted_text": extracted_text,
                "text_length": len(extracted_text),
                "word_count": len(extracted_text.split()),
            },
            "message": "Text extraction completed successfully",
        }
        
    except Exception as e:
        logger.error(f"Text extraction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")


@router.get("/supported-formats")
async def get_supported_formats() -> Dict[str, Any]:
    """Get list of supported document formats"""
    formats = [
        {
            "format": "text",
            "mime_type": "text/plain",
            "extensions": [".txt"],
            "description": "Plain text files",
            "max_size": "10MB",
        },
        {
            "format": "pdf",
            "mime_type": "application/pdf",
            "extensions": [".pdf"],
            "description": "Portable Document Format",
            "max_size": "50MB",
        },
        {
            "format": "word",
            "mime_type": "application/msword",
            "extensions": [".doc", ".docx"],
            "description": "Microsoft Word documents",
            "max_size": "25MB",
        },
    ]
    
    return {
        "success": True,
        "data": {
            "supported_formats": formats,
            "total_formats": len(formats),
        },
        "message": "Supported formats retrieved successfully",
    }
