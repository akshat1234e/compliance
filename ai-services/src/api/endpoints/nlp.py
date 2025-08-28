"""
NLP Endpoints
Natural Language Processing services
"""

from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from src.core.models import get_model_manager, ModelManager
from src.core.logging import nlp_logger as logger

router = APIRouter()


class TextAnalysisRequest(BaseModel):
    """Request model for text analysis"""
    text: str = Field(..., description="Text to analyze", max_length=10000)
    include_sentiment: bool = Field(default=True, description="Include sentiment analysis")
    include_entities: bool = Field(default=True, description="Include named entity recognition")
    include_keywords: bool = Field(default=True, description="Include keyword extraction")
    include_embeddings: bool = Field(default=False, description="Include text embeddings")


class SentimentAnalysisRequest(BaseModel):
    """Request model for sentiment analysis"""
    text: str = Field(..., description="Text to analyze", max_length=10000)


class EntityExtractionRequest(BaseModel):
    """Request model for entity extraction"""
    text: str = Field(..., description="Text to analyze", max_length=10000)


class TextSimilarityRequest(BaseModel):
    """Request model for text similarity"""
    text1: str = Field(..., description="First text", max_length=10000)
    text2: str = Field(..., description="Second text", max_length=10000)


class BatchTextRequest(BaseModel):
    """Request model for batch text processing"""
    texts: List[str] = Field(..., description="List of texts to process", max_items=100)
    operation: str = Field(..., description="Operation to perform", regex="^(sentiment|entities|keywords)$")


@router.post("/analyze")
async def analyze_text(
    request: TextAnalysisRequest,
    model_manager: ModelManager = Depends(get_model_manager)
) -> Dict[str, Any]:
    """Comprehensive text analysis"""
    try:
        logger.info(f"Analyzing text of length {len(request.text)}")
        
        result = {
            "text_length": len(request.text),
            "language": "en",  # Default for now
        }
        
        # Sentiment analysis
        if request.include_sentiment:
            try:
                sentiment_pipeline = model_manager.get_pipeline("sentiment")
                sentiment_result = sentiment_pipeline(request.text)
                result["sentiment"] = {
                    "label": sentiment_result[0]["label"],
                    "score": sentiment_result[0]["score"],
                }
            except Exception as e:
                logger.warning(f"Sentiment analysis failed: {e}")
                result["sentiment"] = {"error": "Sentiment analysis unavailable"}
        
        # Named Entity Recognition
        if request.include_entities:
            try:
                nlp = model_manager.get_spacy_nlp()
                doc = nlp(request.text)
                entities = [
                    {
                        "text": ent.text,
                        "label": ent.label_,
                        "start": ent.start_char,
                        "end": ent.end_char,
                        "description": spacy.explain(ent.label_),
                    }
                    for ent in doc.ents
                ]
                result["entities"] = entities
            except Exception as e:
                logger.warning(f"Entity extraction failed: {e}")
                result["entities"] = {"error": "Entity extraction unavailable"}
        
        # Keyword extraction
        if request.include_keywords:
            try:
                nlp = model_manager.get_spacy_nlp()
                doc = nlp(request.text)
                keywords = [
                    {
                        "text": token.text,
                        "lemma": token.lemma_,
                        "pos": token.pos_,
                        "importance": token.rank if hasattr(token, 'rank') else 0.5,
                    }
                    for token in doc
                    if not token.is_stop and not token.is_punct and len(token.text) > 2
                ]
                # Sort by importance (mock ranking for now)
                keywords = sorted(keywords, key=lambda x: len(x["text"]), reverse=True)[:10]
                result["keywords"] = keywords
            except Exception as e:
                logger.warning(f"Keyword extraction failed: {e}")
                result["keywords"] = {"error": "Keyword extraction unavailable"}
        
        # Text embeddings
        if request.include_embeddings:
            try:
                sentence_transformer = model_manager.get_sentence_transformer()
                embeddings = sentence_transformer.encode(request.text)
                result["embeddings"] = {
                    "vector": embeddings.tolist(),
                    "dimension": len(embeddings),
                }
            except Exception as e:
                logger.warning(f"Embedding generation failed: {e}")
                result["embeddings"] = {"error": "Embedding generation unavailable"}
        
        return {
            "success": True,
            "data": result,
            "message": "Text analysis completed successfully",
        }
        
    except Exception as e:
        logger.error(f"Text analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Text analysis failed: {str(e)}")


@router.post("/sentiment")
async def analyze_sentiment(
    request: SentimentAnalysisRequest,
    model_manager: ModelManager = Depends(get_model_manager)
) -> Dict[str, Any]:
    """Sentiment analysis only"""
    try:
        sentiment_pipeline = model_manager.get_pipeline("sentiment")
        result = sentiment_pipeline(request.text)
        
        return {
            "success": True,
            "data": {
                "text": request.text,
                "sentiment": {
                    "label": result[0]["label"],
                    "score": result[0]["score"],
                    "confidence": result[0]["score"],
                }
            },
            "message": "Sentiment analysis completed successfully",
        }
        
    except Exception as e:
        logger.error(f"Sentiment analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Sentiment analysis failed: {str(e)}")


@router.post("/entities")
async def extract_entities(
    request: EntityExtractionRequest,
    model_manager: ModelManager = Depends(get_model_manager)
) -> Dict[str, Any]:
    """Named entity recognition"""
    try:
        nlp = model_manager.get_spacy_nlp()
        doc = nlp(request.text)
        
        entities = [
            {
                "text": ent.text,
                "label": ent.label_,
                "start": ent.start_char,
                "end": ent.end_char,
                "confidence": 0.9,  # Mock confidence for now
            }
            for ent in doc.ents
        ]
        
        return {
            "success": True,
            "data": {
                "text": request.text,
                "entities": entities,
                "entity_count": len(entities),
            },
            "message": "Entity extraction completed successfully",
        }
        
    except Exception as e:
        logger.error(f"Entity extraction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Entity extraction failed: {str(e)}")


@router.post("/similarity")
async def calculate_similarity(
    request: TextSimilarityRequest,
    model_manager: ModelManager = Depends(get_model_manager)
) -> Dict[str, Any]:
    """Calculate text similarity"""
    try:
        sentence_transformer = model_manager.get_sentence_transformer()
        
        # Generate embeddings
        embeddings = sentence_transformer.encode([request.text1, request.text2])
        
        # Calculate cosine similarity
        from sklearn.metrics.pairwise import cosine_similarity
        similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
        
        return {
            "success": True,
            "data": {
                "text1": request.text1,
                "text2": request.text2,
                "similarity_score": float(similarity),
                "similarity_percentage": float(similarity * 100),
            },
            "message": "Text similarity calculated successfully",
        }
        
    except Exception as e:
        logger.error(f"Similarity calculation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Similarity calculation failed: {str(e)}")


@router.post("/batch")
async def batch_process(
    request: BatchTextRequest,
    model_manager: ModelManager = Depends(get_model_manager)
) -> Dict[str, Any]:
    """Batch text processing"""
    try:
        results = []
        
        for i, text in enumerate(request.texts):
            try:
                if request.operation == "sentiment":
                    pipeline = model_manager.get_pipeline("sentiment")
                    result = pipeline(text)
                    results.append({
                        "index": i,
                        "text": text,
                        "result": result[0],
                        "success": True,
                    })
                elif request.operation == "entities":
                    nlp = model_manager.get_spacy_nlp()
                    doc = nlp(text)
                    entities = [{"text": ent.text, "label": ent.label_} for ent in doc.ents]
                    results.append({
                        "index": i,
                        "text": text,
                        "result": {"entities": entities},
                        "success": True,
                    })
                else:
                    results.append({
                        "index": i,
                        "text": text,
                        "result": None,
                        "success": False,
                        "error": f"Unsupported operation: {request.operation}",
                    })
                    
            except Exception as e:
                results.append({
                    "index": i,
                    "text": text,
                    "result": None,
                    "success": False,
                    "error": str(e),
                })
        
        successful_count = sum(1 for r in results if r["success"])
        
        return {
            "success": True,
            "data": {
                "results": results,
                "total_processed": len(request.texts),
                "successful": successful_count,
                "failed": len(request.texts) - successful_count,
            },
            "message": f"Batch processing completed: {successful_count}/{len(request.texts)} successful",
        }
        
    except Exception as e:
        logger.error(f"Batch processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Batch processing failed: {str(e)}")
