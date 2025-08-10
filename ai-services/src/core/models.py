"""
ML Models Management
Handles loading and initialization of machine learning models
"""

import os
import asyncio
from pathlib import Path
from typing import Dict, Any, Optional

import spacy
import torch
from transformers import AutoTokenizer, AutoModel, pipeline
from sentence_transformers import SentenceTransformer

from src.core.config import settings
from src.core.logging import ml_logger as logger


class ModelManager:
    """Machine learning models manager"""
    
    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.tokenizers: Dict[str, Any] = {}
        self.pipelines: Dict[str, Any] = {}
        self.spacy_nlp = None
        self.sentence_transformer = None
        self._initialized = False
    
    async def init_models(self) -> None:
        """Initialize all ML models"""
        if self._initialized:
            logger.warning("Models already initialized")
            return
        
        try:
            logger.info("🤖 Initializing ML models...")
            
            # Create model directories
            await self._create_model_directories()
            
            # Initialize models in parallel where possible
            await asyncio.gather(
                self._init_spacy_model(),
                self._init_sentence_transformer(),
                self._init_huggingface_models(),
                return_exceptions=True
            )
            
            self._initialized = True
            logger.info("✅ All ML models initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize ML models: {e}")
            raise
    
    async def _create_model_directories(self) -> None:
        """Create necessary model directories"""
        directories = [
            settings.MODEL_CACHE_DIR,
            settings.HUGGINGFACE_CACHE_DIR,
            settings.DOC_PROCESSING_TEMP_DIR,
        ]
        
        for directory in directories:
            Path(directory).mkdir(parents=True, exist_ok=True)
    
    async def _init_spacy_model(self) -> None:
        """Initialize spaCy NLP model"""
        try:
            logger.info(f"Loading spaCy model: {settings.SPACY_MODEL}")
            
            # Load spaCy model in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            self.spacy_nlp = await loop.run_in_executor(
                None, spacy.load, settings.SPACY_MODEL
            )
            
            logger.info("✅ spaCy model loaded successfully")
            
        except OSError as e:
            logger.warning(f"spaCy model {settings.SPACY_MODEL} not found. Downloading...")
            
            # Download model if not available
            import subprocess
            result = subprocess.run([
                "python", "-m", "spacy", "download", settings.SPACY_MODEL
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                loop = asyncio.get_event_loop()
                self.spacy_nlp = await loop.run_in_executor(
                    None, spacy.load, settings.SPACY_MODEL
                )
                logger.info("✅ spaCy model downloaded and loaded successfully")
            else:
                logger.error(f"Failed to download spaCy model: {result.stderr}")
                raise
        
        except Exception as e:
            logger.error(f"Failed to initialize spaCy model: {e}")
            raise
    
    async def _init_sentence_transformer(self) -> None:
        """Initialize Sentence Transformer model"""
        try:
            logger.info(f"Loading Sentence Transformer: {settings.SENTENCE_TRANSFORMER_MODEL}")
            
            # Load model in thread pool
            loop = asyncio.get_event_loop()
            self.sentence_transformer = await loop.run_in_executor(
                None,
                lambda: SentenceTransformer(
                    settings.SENTENCE_TRANSFORMER_MODEL,
                    cache_folder=settings.HUGGINGFACE_CACHE_DIR
                )
            )
            
            logger.info("✅ Sentence Transformer loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Sentence Transformer: {e}")
            raise
    
    async def _init_huggingface_models(self) -> None:
        """Initialize Hugging Face models"""
        try:
            # Define models to load
            models_config = {
                "sentiment": {
                    "model_name": "cardiffnlp/twitter-roberta-base-sentiment-latest",
                    "task": "sentiment-analysis"
                },
                "ner": {
                    "model_name": "dbmdz/bert-large-cased-finetuned-conll03-english",
                    "task": "ner"
                },
                "classification": {
                    "model_name": "microsoft/DialoGPT-medium",
                    "task": "text-classification"
                }
            }
            
            # Load models
            for model_key, config in models_config.items():
                try:
                    logger.info(f"Loading {model_key} model: {config['model_name']}")
                    
                    # Load in thread pool
                    loop = asyncio.get_event_loop()
                    
                    # Load tokenizer and model
                    tokenizer = await loop.run_in_executor(
                        None,
                        lambda: AutoTokenizer.from_pretrained(
                            config['model_name'],
                            cache_dir=settings.HUGGINGFACE_CACHE_DIR
                        )
                    )
                    
                    model = await loop.run_in_executor(
                        None,
                        lambda: AutoModel.from_pretrained(
                            config['model_name'],
                            cache_dir=settings.HUGGINGFACE_CACHE_DIR
                        )
                    )
                    
                    # Create pipeline
                    pipe = await loop.run_in_executor(
                        None,
                        lambda: pipeline(
                            config['task'],
                            model=model,
                            tokenizer=tokenizer,
                            device=0 if settings.NLP_ENABLE_GPU and torch.cuda.is_available() else -1
                        )
                    )
                    
                    self.tokenizers[model_key] = tokenizer
                    self.models[model_key] = model
                    self.pipelines[model_key] = pipe
                    
                    logger.info(f"✅ {model_key} model loaded successfully")
                    
                except Exception as e:
                    logger.warning(f"Failed to load {model_key} model: {e}")
                    # Continue with other models
                    continue
            
        except Exception as e:
            logger.error(f"Failed to initialize Hugging Face models: {e}")
            raise
    
    def get_spacy_nlp(self):
        """Get spaCy NLP model"""
        if not self.spacy_nlp:
            raise RuntimeError("spaCy model not initialized")
        return self.spacy_nlp
    
    def get_sentence_transformer(self):
        """Get Sentence Transformer model"""
        if not self.sentence_transformer:
            raise RuntimeError("Sentence Transformer not initialized")
        return self.sentence_transformer
    
    def get_model(self, model_name: str):
        """Get specific model"""
        if model_name not in self.models:
            raise ValueError(f"Model {model_name} not found")
        return self.models[model_name]
    
    def get_tokenizer(self, model_name: str):
        """Get specific tokenizer"""
        if model_name not in self.tokenizers:
            raise ValueError(f"Tokenizer {model_name} not found")
        return self.tokenizers[model_name]
    
    def get_pipeline(self, pipeline_name: str):
        """Get specific pipeline"""
        if pipeline_name not in self.pipelines:
            raise ValueError(f"Pipeline {pipeline_name} not found")
        return self.pipelines[pipeline_name]
    
    def list_available_models(self) -> Dict[str, Any]:
        """List all available models"""
        return {
            "spacy": self.spacy_nlp is not None,
            "sentence_transformer": self.sentence_transformer is not None,
            "models": list(self.models.keys()),
            "tokenizers": list(self.tokenizers.keys()),
            "pipelines": list(self.pipelines.keys()),
        }
    
    async def reload_model(self, model_name: str) -> bool:
        """Reload a specific model"""
        try:
            if model_name == "spacy":
                await self._init_spacy_model()
            elif model_name == "sentence_transformer":
                await self._init_sentence_transformer()
            else:
                # Reload specific HuggingFace model
                await self._init_huggingface_models()
            
            logger.info(f"✅ Model {model_name} reloaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to reload model {model_name}: {e}")
            return False


# Global model manager instance
model_manager = ModelManager()


async def init_models() -> None:
    """Initialize all models"""
    await model_manager.init_models()


# FastAPI dependency
def get_model_manager() -> ModelManager:
    """FastAPI dependency for model manager"""
    return model_manager


# Convenience functions
def get_spacy_nlp():
    """Get spaCy NLP model"""
    return model_manager.get_spacy_nlp()


def get_sentence_transformer():
    """Get Sentence Transformer model"""
    return model_manager.get_sentence_transformer()


def get_sentiment_pipeline():
    """Get sentiment analysis pipeline"""
    return model_manager.get_pipeline("sentiment")


def get_ner_pipeline():
    """Get NER pipeline"""
    return model_manager.get_pipeline("ner")
