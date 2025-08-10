"""
Cache Management
Redis-based caching for AI/ML services
"""

import json
import pickle
from typing import Any, Optional, Union
import aioredis
from src.core.config import settings
from src.core.logging import cache_logger as logger


class CacheManager:
    """Redis cache manager"""
    
    def __init__(self):
        self.redis_client: Optional[aioredis.Redis] = None
    
    async def init_cache(self) -> None:
        """Initialize Redis connection"""
        try:
            self.redis_client = aioredis.from_url(
                settings.REDIS_URL,
                max_connections=settings.REDIS_MAX_CONNECTIONS,
                decode_responses=False,  # We'll handle encoding ourselves
            )
            
            # Test connection
            await self.redis_client.ping()
            
            logger.info("✅ Redis cache initialized")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Redis cache: {e}")
            raise
    
    async def close_cache(self) -> None:
        """Close Redis connection"""
        try:
            if self.redis_client:
                await self.redis_client.close()
            
            logger.info("✅ Redis cache closed")
            
        except Exception as e:
            logger.error(f"❌ Error closing Redis cache: {e}")
    
    def _make_key(self, key: str) -> str:
        """Create cache key with prefix"""
        return f"{settings.CACHE_KEY_PREFIX}{key}"
    
    async def get(self, key: str, default: Any = None) -> Any:
        """Get value from cache"""
        try:
            if not self.redis_client:
                return default
            
            cache_key = self._make_key(key)
            value = await self.redis_client.get(cache_key)
            
            if value is None:
                return default
            
            # Try to deserialize as JSON first, then pickle
            try:
                return json.loads(value.decode('utf-8'))
            except (json.JSONDecodeError, UnicodeDecodeError):
                return pickle.loads(value)
                
        except Exception as e:
            logger.warning(f"Cache get error for key {key}: {e}")
            return default
    
    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
        serialize_method: str = "json"
    ) -> bool:
        """Set value in cache"""
        try:
            if not self.redis_client:
                return False
            
            cache_key = self._make_key(key)
            ttl = ttl or settings.CACHE_TTL_DEFAULT
            
            # Serialize value
            if serialize_method == "json":
                try:
                    serialized_value = json.dumps(value).encode('utf-8')
                except (TypeError, ValueError):
                    # Fall back to pickle for non-JSON serializable objects
                    serialized_value = pickle.dumps(value)
            else:
                serialized_value = pickle.dumps(value)
            
            await self.redis_client.setex(cache_key, ttl, serialized_value)
            return True
            
        except Exception as e:
            logger.warning(f"Cache set error for key {key}: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete value from cache"""
        try:
            if not self.redis_client:
                return False
            
            cache_key = self._make_key(key)
            result = await self.redis_client.delete(cache_key)
            return result > 0
            
        except Exception as e:
            logger.warning(f"Cache delete error for key {key}: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        try:
            if not self.redis_client:
                return False
            
            cache_key = self._make_key(key)
            result = await self.redis_client.exists(cache_key)
            return result > 0
            
        except Exception as e:
            logger.warning(f"Cache exists error for key {key}: {e}")
            return False
    
    async def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """Increment counter in cache"""
        try:
            if not self.redis_client:
                return None
            
            cache_key = self._make_key(key)
            result = await self.redis_client.incrby(cache_key, amount)
            return result
            
        except Exception as e:
            logger.warning(f"Cache increment error for key {key}: {e}")
            return None
    
    async def set_hash(self, key: str, field: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set hash field in cache"""
        try:
            if not self.redis_client:
                return False
            
            cache_key = self._make_key(key)
            
            # Serialize value
            try:
                serialized_value = json.dumps(value)
            except (TypeError, ValueError):
                serialized_value = pickle.dumps(value).decode('latin1')
            
            await self.redis_client.hset(cache_key, field, serialized_value)
            
            if ttl:
                await self.redis_client.expire(cache_key, ttl)
            
            return True
            
        except Exception as e:
            logger.warning(f"Cache hash set error for key {key}, field {field}: {e}")
            return False
    
    async def get_hash(self, key: str, field: str, default: Any = None) -> Any:
        """Get hash field from cache"""
        try:
            if not self.redis_client:
                return default
            
            cache_key = self._make_key(key)
            value = await self.redis_client.hget(cache_key, field)
            
            if value is None:
                return default
            
            # Try to deserialize as JSON first, then pickle
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return pickle.loads(value.encode('latin1'))
                
        except Exception as e:
            logger.warning(f"Cache hash get error for key {key}, field {field}: {e}")
            return default
    
    async def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching pattern"""
        try:
            if not self.redis_client:
                return 0
            
            pattern_key = self._make_key(pattern)
            keys = await self.redis_client.keys(pattern_key)
            
            if keys:
                result = await self.redis_client.delete(*keys)
                return result
            
            return 0
            
        except Exception as e:
            logger.warning(f"Cache clear pattern error for pattern {pattern}: {e}")
            return 0


# Global cache manager instance
cache_manager = CacheManager()


async def init_cache() -> None:
    """Initialize cache"""
    await cache_manager.init_cache()


async def close_cache() -> None:
    """Close cache connection"""
    await cache_manager.close_cache()


# Convenience functions
async def cache_get(key: str, default: Any = None) -> Any:
    """Get value from cache"""
    return await cache_manager.get(key, default)


async def cache_set(key: str, value: Any, ttl: Optional[int] = None) -> bool:
    """Set value in cache"""
    return await cache_manager.set(key, value, ttl)


async def cache_delete(key: str) -> bool:
    """Delete value from cache"""
    return await cache_manager.delete(key)


# FastAPI dependency
def get_cache_manager() -> CacheManager:
    """FastAPI dependency for cache manager"""
    return cache_manager
