"""
Configuration Management
Centralized configuration using Pydantic settings
"""

import os
from typing import List, Optional, Union
from pydantic import BaseSettings, Field, validator


class Settings(BaseSettings):
    """Application settings"""
    
    # Application Configuration
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=False, env="DEBUG")
    LOG_LEVEL: str = Field(default="info", env="LOG_LEVEL")
    API_HOST: str = Field(default="0.0.0.0", env="API_HOST")
    API_PORT: int = Field(default=8000, env="API_PORT")
    API_WORKERS: int = Field(default=4, env="API_WORKERS")
    
    # Security Configuration
    SECRET_KEY: str = Field(env="SECRET_KEY")
    JWT_SECRET: str = Field(env="JWT_SECRET")
    JWT_ALGORITHM: str = Field(default="HS256", env="JWT_ALGORITHM")
    JWT_EXPIRE_MINUTES: int = Field(default=1440, env="JWT_EXPIRE_MINUTES")
    
    # Database Configuration
    POSTGRES_HOST: str = Field(default="localhost", env="POSTGRES_HOST")
    POSTGRES_PORT: int = Field(default=5432, env="POSTGRES_PORT")
    POSTGRES_DB: str = Field(default="ai_services", env="POSTGRES_DB")
    POSTGRES_USER: str = Field(default="postgres", env="POSTGRES_USER")
    POSTGRES_PASSWORD: str = Field(env="POSTGRES_PASSWORD")
    POSTGRES_MAX_CONNECTIONS: int = Field(default=20, env="POSTGRES_MAX_CONNECTIONS")
    
    MONGODB_URI: str = Field(default="mongodb://localhost:27017", env="MONGODB_URI")
    MONGODB_DB: str = Field(default="ai_services", env="MONGODB_DB")
    MONGODB_MAX_POOL_SIZE: int = Field(default=10, env="MONGODB_MAX_POOL_SIZE")
    
    REDIS_HOST: str = Field(default="localhost", env="REDIS_HOST")
    REDIS_PORT: int = Field(default=6379, env="REDIS_PORT")
    REDIS_PASSWORD: Optional[str] = Field(default=None, env="REDIS_PASSWORD")
    REDIS_DB: int = Field(default=0, env="REDIS_DB")
    REDIS_MAX_CONNECTIONS: int = Field(default=10, env="REDIS_MAX_CONNECTIONS")
    
    ELASTICSEARCH_HOST: str = Field(default="localhost", env="ELASTICSEARCH_HOST")
    ELASTICSEARCH_PORT: int = Field(default=9200, env="ELASTICSEARCH_PORT")
    ELASTICSEARCH_USERNAME: Optional[str] = Field(default=None, env="ELASTICSEARCH_USERNAME")
    ELASTICSEARCH_PASSWORD: Optional[str] = Field(default=None, env="ELASTICSEARCH_PASSWORD")
    
    # ML Model Configuration
    MODEL_CACHE_DIR: str = Field(default="./models/cache", env="MODEL_CACHE_DIR")
    MODEL_DOWNLOAD_TIMEOUT: int = Field(default=300, env="MODEL_DOWNLOAD_TIMEOUT")
    HUGGINGFACE_CACHE_DIR: str = Field(default="./models/huggingface", env="HUGGINGFACE_CACHE_DIR")
    SPACY_MODEL: str = Field(default="en_core_web_sm", env="SPACY_MODEL")
    SENTENCE_TRANSFORMER_MODEL: str = Field(default="all-MiniLM-L6-v2", env="SENTENCE_TRANSFORMER_MODEL")
    
    # NLP Configuration
    NLP_MAX_TEXT_LENGTH: int = Field(default=10000, env="NLP_MAX_TEXT_LENGTH")
    NLP_BATCH_SIZE: int = Field(default=32, env="NLP_BATCH_SIZE")
    NLP_ENABLE_GPU: bool = Field(default=False, env="NLP_ENABLE_GPU")
    NLP_LANGUAGE: str = Field(default="en", env="NLP_LANGUAGE")
    NLP_SENTIMENT_THRESHOLD: float = Field(default=0.5, env="NLP_SENTIMENT_THRESHOLD")
    
    # Document Processing Configuration
    DOC_PROCESSING_TEMP_DIR: str = Field(default="./temp", env="DOC_PROCESSING_TEMP_DIR")
    DOC_PROCESSING_MAX_FILE_SIZE: str = Field(default="50MB", env="DOC_PROCESSING_MAX_FILE_SIZE")
    DOC_PROCESSING_SUPPORTED_FORMATS: str = Field(default="pdf,docx,txt,html", env="DOC_PROCESSING_SUPPORTED_FORMATS")
    DOC_PROCESSING_OCR_ENABLED: bool = Field(default=True, env="DOC_PROCESSING_OCR_ENABLED")
    DOC_PROCESSING_OCR_LANGUAGE: str = Field(default="eng", env="DOC_PROCESSING_OCR_LANGUAGE")
    
    # External Services Configuration
    REGULATORY_INTELLIGENCE_URL: str = Field(default="http://localhost:3001", env="REGULATORY_INTELLIGENCE_URL")
    REGULATORY_INTELLIGENCE_API_KEY: Optional[str] = Field(default=None, env="REGULATORY_INTELLIGENCE_API_KEY")
    REGULATORY_INTELLIGENCE_TIMEOUT: int = Field(default=30, env="REGULATORY_INTELLIGENCE_TIMEOUT")
    
    COMPLIANCE_ORCHESTRATION_URL: str = Field(default="http://localhost:3002", env="COMPLIANCE_ORCHESTRATION_URL")
    COMPLIANCE_ORCHESTRATION_API_KEY: Optional[str] = Field(default=None, env="COMPLIANCE_ORCHESTRATION_API_KEY")
    COMPLIANCE_ORCHESTRATION_TIMEOUT: int = Field(default=30, env="COMPLIANCE_ORCHESTRATION_TIMEOUT")
    
    DOCUMENT_MANAGEMENT_URL: str = Field(default="http://localhost:3004", env="DOCUMENT_MANAGEMENT_URL")
    DOCUMENT_MANAGEMENT_API_KEY: Optional[str] = Field(default=None, env="DOCUMENT_MANAGEMENT_API_KEY")
    DOCUMENT_MANAGEMENT_TIMEOUT: int = Field(default=30, env="DOCUMENT_MANAGEMENT_TIMEOUT")
    
    RISK_ASSESSMENT_URL: str = Field(default="http://localhost:3006", env="RISK_ASSESSMENT_URL")
    RISK_ASSESSMENT_API_KEY: Optional[str] = Field(default=None, env="RISK_ASSESSMENT_API_KEY")
    RISK_ASSESSMENT_TIMEOUT: int = Field(default=30, env="RISK_ASSESSMENT_TIMEOUT")
    
    # Caching Configuration
    CACHE_TTL_DEFAULT: int = Field(default=3600, env="CACHE_TTL_DEFAULT")
    CACHE_TTL_MODELS: int = Field(default=86400, env="CACHE_TTL_MODELS")
    CACHE_TTL_PREDICTIONS: int = Field(default=1800, env="CACHE_TTL_PREDICTIONS")
    CACHE_TTL_FEATURES: int = Field(default=7200, env="CACHE_TTL_FEATURES")
    CACHE_KEY_PREFIX: str = Field(default="ai_services:", env="CACHE_KEY_PREFIX")
    
    # Performance Configuration
    MAX_WORKERS: int = Field(default=4, env="MAX_WORKERS")
    WORKER_TIMEOUT: int = Field(default=300, env="WORKER_TIMEOUT")
    WORKER_MEMORY_LIMIT: str = Field(default="2GB", env="WORKER_MEMORY_LIMIT")
    ENABLE_ASYNC_PROCESSING: bool = Field(default=True, env="ENABLE_ASYNC_PROCESSING")
    ASYNC_QUEUE_SIZE: int = Field(default=1000, env="ASYNC_QUEUE_SIZE")
    
    # Monitoring Configuration
    ENABLE_METRICS: bool = Field(default=True, env="ENABLE_METRICS")
    METRICS_PORT: int = Field(default=9090, env="METRICS_PORT")
    ENABLE_HEALTH_CHECKS: bool = Field(default=True, env="ENABLE_HEALTH_CHECKS")
    HEALTH_CHECK_INTERVAL: int = Field(default=30, env="HEALTH_CHECK_INTERVAL")
    ENABLE_PERFORMANCE_MONITORING: bool = Field(default=True, env="ENABLE_PERFORMANCE_MONITORING")
    
    # Security Configuration
    ENABLE_RATE_LIMITING: bool = Field(default=True, env="ENABLE_RATE_LIMITING")
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = Field(default=100, env="RATE_LIMIT_REQUESTS_PER_MINUTE")
    ENABLE_CORS: bool = Field(default=True, env="ENABLE_CORS")
    CORS_ORIGINS: List[str] = Field(default=["http://localhost:3000"], env="CORS_ORIGINS")
    ENABLE_API_KEY_AUTH: bool = Field(default=False, env="ENABLE_API_KEY_AUTH")
    API_KEY_HEADER: str = Field(default="X-API-Key", env="API_KEY_HEADER")
    
    # Feature Flags
    FEATURE_ADVANCED_NLP: bool = Field(default=True, env="FEATURE_ADVANCED_NLP")
    FEATURE_DEEP_LEARNING: bool = Field(default=True, env="FEATURE_DEEP_LEARNING")
    FEATURE_REAL_TIME_PROCESSING: bool = Field(default=True, env="FEATURE_REAL_TIME_PROCESSING")
    FEATURE_BATCH_PROCESSING: bool = Field(default=True, env="FEATURE_BATCH_PROCESSING")
    FEATURE_MODEL_VERSIONING: bool = Field(default=True, env="FEATURE_MODEL_VERSIONING")
    FEATURE_A_B_TESTING: bool = Field(default=False, env="FEATURE_A_B_TESTING")
    FEATURE_EXPLAINABLE_AI: bool = Field(default=True, env="FEATURE_EXPLAINABLE_AI")
    FEATURE_AUTOMATED_RETRAINING: bool = Field(default=False, env="FEATURE_AUTOMATED_RETRAINING")
    
    @validator("CORS_ORIGINS", pre=True)
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @validator("DOC_PROCESSING_SUPPORTED_FORMATS", pre=True)
    def parse_supported_formats(cls, v: str) -> List[str]:
        return [fmt.strip() for fmt in v.split(",")]
    
    @property
    def DATABASE_URL(self) -> str:
        """PostgreSQL database URL"""
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )
    
    @property
    def REDIS_URL(self) -> str:
        """Redis connection URL"""
        auth = f":{self.REDIS_PASSWORD}@" if self.REDIS_PASSWORD else ""
        return f"redis://{auth}{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
    
    @property
    def ELASTICSEARCH_URL(self) -> str:
        """Elasticsearch connection URL"""
        auth = ""
        if self.ELASTICSEARCH_USERNAME and self.ELASTICSEARCH_PASSWORD:
            auth = f"{self.ELASTICSEARCH_USERNAME}:{self.ELASTICSEARCH_PASSWORD}@"
        return f"http://{auth}{self.ELASTICSEARCH_HOST}:{self.ELASTICSEARCH_PORT}"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create global settings instance
settings = Settings()
