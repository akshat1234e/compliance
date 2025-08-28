"""
Document Processing Endpoints
AI-powered document analysis and processing with OCR capabilities
"""

from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from pydantic import BaseModel, Field

from src.core.models import get_model_manager, ModelManager
from src.core.logging import api_logger as logger
from src.services.document_intelligence import DocumentIntelligenceService

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


class OCRRequest(BaseModel):
    """Request model for OCR processing"""
    enhance_image: bool = Field(default=True, description="Whether to enhance image for better OCR")
    language: str = Field(default="eng", description="OCR language (eng, hin, etc.)")
    confidence_threshold: float = Field(default=0.6, description="Minimum confidence threshold")


# Initialize document intelligence service
doc_intelligence = DocumentIntelligenceService()


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
    request: DocumentClassificationRequest
) -> Dict[str, Any]:
    """Advanced document classification using pattern matching and ML"""
    try:
        logger.info("Classifying document")

        # Use document intelligence service for classification
        classification_result = await doc_intelligence.classify_document(
            request.document_text,
            request.categories if request.categories else None
        )

        return {
            "success": True,
            "data": {
                "predicted_category": classification_result["predicted_category"],
                "predicted_score": classification_result["confidence"],
                "confidence": classification_result["confidence"],
                "method": classification_result["method"],
                "all_scores": classification_result["all_scores"],
                "document_length": len(request.document_text),
                "word_count": len(request.document_text.split()),
            },
            "message": "Document classification completed successfully",
        }

    except Exception as e:
        logger.error(f"Document classification failed: {e}")
        raise HTTPException(status_code=500, detail=f"Document classification failed: {str(e)}")


@router.post("/ocr")
async def perform_ocr(
    file: UploadFile = File(...),
    ocr_request: OCRRequest = Depends()
) -> Dict[str, Any]:
    """Perform OCR on image files"""
    try:
        logger.info(f"Performing OCR on file: {file.filename}")

        # Check if file is an image
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="OCR is only supported for image files")

        # Read file content
        content = await file.read()

        # Extract text using OCR
        extraction_result = await doc_intelligence.extract_text_from_file(
            content, file.content_type, file.filename
        )

        # Filter by confidence threshold
        if extraction_result["confidence"] < ocr_request.confidence_threshold:
            logger.warning(f"OCR confidence {extraction_result['confidence']} below threshold {ocr_request.confidence_threshold}")

        return {
            "success": True,
            "data": {
                **extraction_result,
                "confidence_threshold": ocr_request.confidence_threshold,
                "meets_threshold": extraction_result["confidence"] >= ocr_request.confidence_threshold,
            },
            "message": "OCR completed successfully",
        }

    except Exception as e:
        logger.error(f"OCR failed: {e}")
        raise HTTPException(status_code=500, detail=f"OCR failed: {str(e)}")


@router.post("/analyze-structure")
async def analyze_document_structure(
    request: DocumentAnalysisRequest
) -> Dict[str, Any]:
    """Analyze document structure and extract metadata"""
    try:
        logger.info("Analyzing document structure")

        structure_result = await doc_intelligence.analyze_document_structure(request.document_text)

        return {
            "success": True,
            "data": structure_result,
            "message": "Document structure analysis completed successfully",
        }

    except Exception as e:
        logger.error(f"Document structure analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Document structure analysis failed: {str(e)}")


@router.post("/upload")
async def upload_and_analyze_document(
    file: UploadFile = File(...),
    analysis_type: str = "full",
    model_manager: ModelManager = Depends(get_model_manager)
) -> Dict[str, Any]:
    """Upload and analyze document file with OCR support"""
    try:
        logger.info(f"Processing uploaded file: {file.filename}")

        # Check file type
        allowed_types = [
            "text/plain",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/jpeg",
            "image/png",
            "image/tiff",
            "image/bmp"
        ]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

        # Read file content
        content = await file.read()

        # Extract text using document intelligence service
        extraction_result = await doc_intelligence.extract_text_from_file(
            content, file.content_type, file.filename
        )

        document_text = extraction_result["extracted_text"]

        # Perform document classification
        classification_result = await doc_intelligence.classify_document(document_text)

        # Analyze document structure
        structure_result = await doc_intelligence.analyze_document_structure(document_text)

        # Perform NLP analysis
        analysis_request = DocumentAnalysisRequest(
            document_text=document_text,
            document_type=classification_result["predicted_category"],
            analysis_type=["summary", "entities", "sentiment", "keyphrases"] if analysis_type == "full" else [analysis_type]
        )

        analysis_result = await analyze_document(analysis_request, model_manager)

        # Enhance result with OCR and classification data
        analysis_result["data"]["file_info"] = {
            "filename": file.filename,
            "content_type": file.content_type,
            "file_size": len(content),
        }
        analysis_result["data"]["extraction_info"] = extraction_result
        analysis_result["data"]["classification"] = classification_result
        analysis_result["data"]["document_structure"] = structure_result

        return analysis_result

    except Exception as e:
        logger.error(f"File upload and analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"File processing failed: {str(e)}")


@router.post("/extract-text")
async def extract_text_from_file(
    file: UploadFile = File(...)
) -> Dict[str, Any]:
    """Extract text from uploaded file with OCR support"""
    try:
        logger.info(f"Extracting text from file: {file.filename}")

        # Read file content
        content = await file.read()

        # Use document intelligence service for extraction
        extraction_result = await doc_intelligence.extract_text_from_file(
            content, file.content_type, file.filename
        )

        return {
            "success": True,
            "data": extraction_result,
            "message": "Text extraction completed successfully",
        }

    except Exception as e:
        logger.error(f"Text extraction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")


@router.get("/supported-formats")
async def get_supported_formats() -> Dict[str, Any]:
    """Get list of supported document formats with OCR capabilities"""
    formats = [
        {
            "format": "text",
            "mime_type": "text/plain",
            "extensions": [".txt"],
            "description": "Plain text files",
            "max_size": "10MB",
            "ocr_required": False,
            "extraction_method": "direct"
        },
        {
            "format": "pdf",
            "mime_type": "application/pdf",
            "extensions": [".pdf"],
            "description": "Portable Document Format",
            "max_size": "50MB",
            "ocr_required": False,
            "extraction_method": "direct_with_ocr_fallback"
        },
        {
            "format": "word",
            "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "extensions": [".docx"],
            "description": "Microsoft Word documents (modern)",
            "max_size": "25MB",
            "ocr_required": False,
            "extraction_method": "direct"
        },
        {
            "format": "word_legacy",
            "mime_type": "application/msword",
            "extensions": [".doc"],
            "description": "Microsoft Word documents (legacy)",
            "max_size": "25MB",
            "ocr_required": False,
            "extraction_method": "direct"
        },
        {
            "format": "jpeg",
            "mime_type": "image/jpeg",
            "extensions": [".jpg", ".jpeg"],
            "description": "JPEG images with OCR",
            "max_size": "20MB",
            "ocr_required": True,
            "extraction_method": "ocr"
        },
        {
            "format": "png",
            "mime_type": "image/png",
            "extensions": [".png"],
            "description": "PNG images with OCR",
            "max_size": "20MB",
            "ocr_required": True,
            "extraction_method": "ocr"
        },
        {
            "format": "tiff",
            "mime_type": "image/tiff",
            "extensions": [".tiff", ".tif"],
            "description": "TIFF images with OCR",
            "max_size": "50MB",
            "ocr_required": True,
            "extraction_method": "ocr"
        },
        {
            "format": "bmp",
            "mime_type": "image/bmp",
            "extensions": [".bmp"],
            "description": "BMP images with OCR",
            "max_size": "20MB",
            "ocr_required": True,
            "extraction_method": "ocr"
        }
    ]

    capabilities = {
        "text_extraction": True,
        "ocr_support": True,
        "document_classification": True,
        "structure_analysis": True,
        "entity_extraction": True,
        "sentiment_analysis": True,
        "supported_languages": ["eng", "hin"],  # English and Hindi
        "max_file_size": "50MB",
        "batch_processing": False  # Future enhancement
    }

    return {
        "success": True,
        "data": {
            "supported_formats": formats,
            "total_formats": len(formats),
            "capabilities": capabilities,
        },
        "message": "Supported formats and capabilities retrieved successfully",
    }
