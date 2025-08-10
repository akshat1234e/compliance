"""
API Middleware
Custom middleware for the AI/ML services
"""

import time
import uuid
from typing import Callable, Dict, Any
from collections import defaultdict

from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from src.core.config import settings
from src.core.logging import api_logger as logger


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for request/response logging"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Log request
        start_time = time.time()
        logger.info(
            "Request started",
            extra={
                "request_id": request_id,
                "method": request.method,
                "url": str(request.url),
                "client_ip": request.client.host if request.client else None,
                "user_agent": request.headers.get("user-agent"),
            }
        )
        
        # Process request
        response = await call_next(request)
        
        # Log response
        process_time = time.time() - start_time
        logger.info(
            "Request completed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "url": str(request.url),
                "status_code": response.status_code,
                "process_time": f"{process_time:.4f}s",
            }
        )
        
        # Add headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = f"{process_time:.4f}"
        
        return response


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Middleware for global error handling"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            response = await call_next(request)
            return response
            
        except HTTPException:
            # Re-raise HTTP exceptions
            raise
            
        except Exception as e:
            # Log unexpected errors
            request_id = getattr(request.state, "request_id", "unknown")
            logger.error(
                "Unhandled exception",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "url": str(request.url),
                    "error": str(e),
                },
                exc_info=True
            )
            
            # Return generic error response
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Internal server error",
                    "message": "An unexpected error occurred",
                    "request_id": request_id,
                }
            )


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiting middleware"""
    
    def __init__(self, app, requests_per_minute: int = None):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute or settings.RATE_LIMIT_REQUESTS_PER_MINUTE
        self.requests: Dict[str, list] = defaultdict(list)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        
        # Clean old requests
        current_time = time.time()
        minute_ago = current_time - 60
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if req_time > minute_ago
        ]
        
        # Check rate limit
        if len(self.requests[client_ip]) >= self.requests_per_minute:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "message": f"Maximum {self.requests_per_minute} requests per minute allowed",
                    "retry_after": 60,
                }
            )
        
        # Add current request
        self.requests[client_ip].append(current_time)
        
        # Process request
        response = await call_next(request)
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware for adding security headers"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        if not settings.DEBUG:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response


class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware for collecting metrics"""
    
    def __init__(self, app):
        super().__init__(app)
        self.request_count = defaultdict(int)
        self.request_duration = defaultdict(list)
        self.error_count = defaultdict(int)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        try:
            response = await call_next(request)
            
            # Record metrics
            endpoint = f"{request.method} {request.url.path}"
            duration = time.time() - start_time
            
            self.request_count[endpoint] += 1
            self.request_duration[endpoint].append(duration)
            
            if response.status_code >= 400:
                self.error_count[endpoint] += 1
            
            return response
            
        except Exception as e:
            # Record error
            endpoint = f"{request.method} {request.url.path}"
            self.error_count[endpoint] += 1
            raise
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get collected metrics"""
        metrics = {
            "requests_total": dict(self.request_count),
            "errors_total": dict(self.error_count),
            "request_duration_avg": {},
        }
        
        for endpoint, durations in self.request_duration.items():
            if durations:
                metrics["request_duration_avg"][endpoint] = sum(durations) / len(durations)
        
        return metrics


# Global metrics instance
metrics_middleware = MetricsMiddleware(None)
