"""
Database Management
Handles connections to PostgreSQL, MongoDB, and Elasticsearch
"""

import asyncio
from typing import Optional, Dict, Any

import asyncpg
from motor.motor_asyncio import AsyncIOMotorClient
from elasticsearch import AsyncElasticsearch
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from src.core.config import settings
from src.core.logging import db_logger as logger


class DatabaseManager:
    """Database connection manager"""
    
    def __init__(self):
        self.postgres_engine = None
        self.postgres_session_factory = None
        self.mongodb_client = None
        self.mongodb_db = None
        self.elasticsearch_client = None
        self._postgres_pool = None
    
    async def init_postgres(self) -> None:
        """Initialize PostgreSQL connection"""
        try:
            # Create async engine
            self.postgres_engine = create_async_engine(
                settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
                pool_size=settings.POSTGRES_MAX_CONNECTIONS,
                max_overflow=0,
                echo=settings.DEBUG,
            )
            
            # Create session factory
            self.postgres_session_factory = sessionmaker(
                self.postgres_engine,
                class_=AsyncSession,
                expire_on_commit=False,
            )
            
            # Create connection pool
            self._postgres_pool = await asyncpg.create_pool(
                settings.DATABASE_URL,
                min_size=1,
                max_size=settings.POSTGRES_MAX_CONNECTIONS,
            )
            
            logger.info("✅ PostgreSQL connection initialized")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize PostgreSQL: {e}")
            raise
    
    async def init_mongodb(self) -> None:
        """Initialize MongoDB connection"""
        try:
            self.mongodb_client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                maxPoolSize=settings.MONGODB_MAX_POOL_SIZE,
                serverSelectionTimeoutMS=5000,
            )
            
            # Test connection
            await self.mongodb_client.admin.command('ping')
            
            self.mongodb_db = self.mongodb_client[settings.MONGODB_DB]
            
            logger.info("✅ MongoDB connection initialized")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize MongoDB: {e}")
            raise
    
    async def init_elasticsearch(self) -> None:
        """Initialize Elasticsearch connection"""
        try:
            auth = None
            if settings.ELASTICSEARCH_USERNAME and settings.ELASTICSEARCH_PASSWORD:
                auth = (settings.ELASTICSEARCH_USERNAME, settings.ELASTICSEARCH_PASSWORD)
            
            self.elasticsearch_client = AsyncElasticsearch(
                [settings.ELASTICSEARCH_URL],
                http_auth=auth,
                verify_certs=False,
                ssl_show_warn=False,
            )
            
            # Test connection
            await self.elasticsearch_client.ping()
            
            logger.info("✅ Elasticsearch connection initialized")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Elasticsearch: {e}")
            raise
    
    async def close_postgres(self) -> None:
        """Close PostgreSQL connections"""
        try:
            if self._postgres_pool:
                await self._postgres_pool.close()
            
            if self.postgres_engine:
                await self.postgres_engine.dispose()
            
            logger.info("✅ PostgreSQL connections closed")
            
        except Exception as e:
            logger.error(f"❌ Error closing PostgreSQL: {e}")
    
    async def close_mongodb(self) -> None:
        """Close MongoDB connection"""
        try:
            if self.mongodb_client:
                self.mongodb_client.close()
            
            logger.info("✅ MongoDB connection closed")
            
        except Exception as e:
            logger.error(f"❌ Error closing MongoDB: {e}")
    
    async def close_elasticsearch(self) -> None:
        """Close Elasticsearch connection"""
        try:
            if self.elasticsearch_client:
                await self.elasticsearch_client.close()
            
            logger.info("✅ Elasticsearch connection closed")
            
        except Exception as e:
            logger.error(f"❌ Error closing Elasticsearch: {e}")
    
    async def get_postgres_session(self) -> AsyncSession:
        """Get PostgreSQL session"""
        if not self.postgres_session_factory:
            raise RuntimeError("PostgreSQL not initialized")
        return self.postgres_session_factory()
    
    async def execute_postgres_query(self, query: str, *args) -> Any:
        """Execute raw PostgreSQL query"""
        if not self._postgres_pool:
            raise RuntimeError("PostgreSQL pool not initialized")
        
        async with self._postgres_pool.acquire() as connection:
            return await connection.fetch(query, *args)
    
    def get_mongodb_collection(self, collection_name: str):
        """Get MongoDB collection"""
        if not self.mongodb_db:
            raise RuntimeError("MongoDB not initialized")
        return self.mongodb_db[collection_name]
    
    async def search_elasticsearch(self, index: str, query: Dict[str, Any]) -> Dict[str, Any]:
        """Search Elasticsearch"""
        if not self.elasticsearch_client:
            raise RuntimeError("Elasticsearch not initialized")
        
        return await self.elasticsearch_client.search(index=index, body=query)
    
    async def index_elasticsearch_document(self, index: str, doc_id: str, document: Dict[str, Any]) -> Dict[str, Any]:
        """Index document in Elasticsearch"""
        if not self.elasticsearch_client:
            raise RuntimeError("Elasticsearch not initialized")
        
        return await self.elasticsearch_client.index(
            index=index,
            id=doc_id,
            body=document
        )


# Global database manager instance
db_manager = DatabaseManager()


async def init_databases() -> None:
    """Initialize all databases"""
    await asyncio.gather(
        db_manager.init_postgres(),
        db_manager.init_mongodb(),
        db_manager.init_elasticsearch(),
    )


async def close_databases() -> None:
    """Close all database connections"""
    await asyncio.gather(
        db_manager.close_postgres(),
        db_manager.close_mongodb(),
        db_manager.close_elasticsearch(),
    )


# Dependency functions for FastAPI
async def get_postgres_session() -> AsyncSession:
    """FastAPI dependency for PostgreSQL session"""
    async with db_manager.get_postgres_session() as session:
        yield session


def get_mongodb_collection(collection_name: str):
    """FastAPI dependency for MongoDB collection"""
    return db_manager.get_mongodb_collection(collection_name)


def get_elasticsearch_client():
    """FastAPI dependency for Elasticsearch client"""
    return db_manager.elasticsearch_client
