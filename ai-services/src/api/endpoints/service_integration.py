"""
Service Integration API Endpoints
APIs for integrating with external services and microservices
"""

import asyncio
import aiohttp
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel, Field
import time

from src.core.logging import api_logger as logger
from src.core.config import settings

router = APIRouter()


class ServiceRequest(BaseModel):
    """Request model for external service calls"""
    service_name: str = Field(..., description="Name of the target service")
    endpoint: str = Field(..., description="Service endpoint to call")
    method: str = Field(default="POST", description="HTTP method")
    data: Dict[str, Any] = Field(default_factory=dict, description="Request payload")
    headers: Dict[str, str] = Field(default_factory=dict, description="Additional headers")
    timeout: int = Field(default=30, description="Request timeout in seconds")


class WebhookRequest(BaseModel):
    """Request model for webhook registration"""
    event_type: str = Field(..., description="Type of event to subscribe to")
    webhook_url: str = Field(..., description="URL to receive webhook notifications")
    secret: Optional[str] = Field(None, description="Secret for webhook verification")
    active: bool = Field(default=True, description="Whether webhook is active")


class ServiceResponse(BaseModel):
    """Response model for service calls"""
    success: bool
    service_name: str
    endpoint: str
    data: Dict[str, Any]
    response_time: float
    status_code: int


# Service configuration
SERVICE_CONFIGS = {
    "regulatory-intelligence": {
        "base_url": getattr(settings, "REGULATORY_INTELLIGENCE_URL", "http://localhost:3001"),
        "api_key": getattr(settings, "REGULATORY_INTELLIGENCE_API_KEY", ""),
        "timeout": getattr(settings, "REGULATORY_INTELLIGENCE_TIMEOUT", 30)
    },
    "compliance-orchestration": {
        "base_url": getattr(settings, "COMPLIANCE_ORCHESTRATION_URL", "http://localhost:3002"),
        "api_key": getattr(settings, "COMPLIANCE_ORCHESTRATION_API_KEY", ""),
        "timeout": getattr(settings, "COMPLIANCE_ORCHESTRATION_TIMEOUT", 30)
    },
    "document-management": {
        "base_url": getattr(settings, "DOCUMENT_MANAGEMENT_URL", "http://localhost:3004"),
        "api_key": getattr(settings, "DOCUMENT_MANAGEMENT_API_KEY", ""),
        "timeout": getattr(settings, "DOCUMENT_MANAGEMENT_TIMEOUT", 30)
    },
    "risk-assessment": {
        "base_url": getattr(settings, "RISK_ASSESSMENT_URL", "http://localhost:3006"),
        "api_key": getattr(settings, "RISK_ASSESSMENT_API_KEY", ""),
        "timeout": getattr(settings, "RISK_ASSESSMENT_TIMEOUT", 30)
    }
}

# Webhook storage (in production, this would be in a database)
REGISTERED_WEBHOOKS = {}


@router.post("/call-service")
async def call_external_service(request: ServiceRequest) -> ServiceResponse:
    """Call an external microservice"""
    start_time = time.time()
    
    try:
        logger.info(f"Calling service: {request.service_name}/{request.endpoint}")
        
        # Get service configuration
        if request.service_name not in SERVICE_CONFIGS:
            raise HTTPException(
                status_code=400, 
                detail=f"Unknown service: {request.service_name}"
            )
        
        config = SERVICE_CONFIGS[request.service_name]
        url = f"{config['base_url']}/api/v1/{request.endpoint.lstrip('/')}"
        
        # Prepare headers
        headers = {
            "Content-Type": "application/json",
            **request.headers
        }
        
        if config["api_key"]:
            headers["Authorization"] = f"Bearer {config['api_key']}"
        
        # Make the request
        async with aiohttp.ClientSession() as session:
            async with session.request(
                method=request.method,
                url=url,
                json=request.data if request.method.upper() != "GET" else None,
                params=request.data if request.method.upper() == "GET" else None,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=request.timeout)
            ) as response:
                response_data = await response.json() if response.content_type == "application/json" else {"text": await response.text()}
                response_time = time.time() - start_time
                
                return ServiceResponse(
                    success=response.status < 400,
                    service_name=request.service_name,
                    endpoint=request.endpoint,
                    data=response_data,
                    response_time=response_time,
                    status_code=response.status
                )
                
    except asyncio.TimeoutError:
        response_time = time.time() - start_time
        logger.error(f"Service call timeout: {request.service_name}/{request.endpoint}")
        
        return ServiceResponse(
            success=False,
            service_name=request.service_name,
            endpoint=request.endpoint,
            data={"error": "Request timeout"},
            response_time=response_time,
            status_code=408
        )
        
    except Exception as e:
        response_time = time.time() - start_time
        logger.error(f"Service call failed: {e}")
        
        return ServiceResponse(
            success=False,
            service_name=request.service_name,
            endpoint=request.endpoint,
            data={"error": str(e)},
            response_time=response_time,
            status_code=500
        )


@router.get("/services")
async def list_available_services() -> Dict[str, Any]:
    """List all available external services"""
    services = {}
    
    for service_name, config in SERVICE_CONFIGS.items():
        # Test service connectivity
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{config['base_url']}/health",
                    timeout=aiohttp.ClientTimeout(total=5)
                ) as response:
                    status = "healthy" if response.status == 200 else "unhealthy"
        except:
            status = "unreachable"
        
        services[service_name] = {
            "base_url": config["base_url"],
            "status": status,
            "timeout": config["timeout"],
            "has_api_key": bool(config["api_key"])
        }
    
    return {
        "success": True,
        "data": {
            "services": services,
            "total_services": len(services)
        },
        "message": "Available services retrieved successfully"
    }


@router.post("/services/{service_name}/health")
async def check_service_health(service_name: str) -> Dict[str, Any]:
    """Check health of a specific service"""
    if service_name not in SERVICE_CONFIGS:
        raise HTTPException(status_code=404, detail=f"Service {service_name} not found")
    
    config = SERVICE_CONFIGS[service_name]
    start_time = time.time()
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{config['base_url']}/health",
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                response_data = await response.json() if response.content_type == "application/json" else {}
                response_time = time.time() - start_time
                
                return {
                    "success": True,
                    "data": {
                        "service_name": service_name,
                        "status": "healthy" if response.status == 200 else "unhealthy",
                        "response_time": response_time,
                        "status_code": response.status,
                        "health_data": response_data
                    },
                    "message": f"Health check completed for {service_name}"
                }
                
    except Exception as e:
        response_time = time.time() - start_time
        
        return {
            "success": False,
            "data": {
                "service_name": service_name,
                "status": "unreachable",
                "response_time": response_time,
                "error": str(e)
            },
            "message": f"Health check failed for {service_name}"
        }


@router.post("/webhooks/register")
async def register_webhook(request: WebhookRequest) -> Dict[str, Any]:
    """Register a webhook for event notifications"""
    try:
        webhook_id = f"{request.event_type}_{int(time.time())}"
        
        REGISTERED_WEBHOOKS[webhook_id] = {
            "id": webhook_id,
            "event_type": request.event_type,
            "webhook_url": request.webhook_url,
            "secret": request.secret,
            "active": request.active,
            "created_at": time.time(),
            "last_triggered": None,
            "trigger_count": 0
        }
        
        logger.info(f"Webhook registered: {webhook_id} for event {request.event_type}")
        
        return {
            "success": True,
            "data": {
                "webhook_id": webhook_id,
                "event_type": request.event_type,
                "webhook_url": request.webhook_url,
                "active": request.active
            },
            "message": "Webhook registered successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to register webhook: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to register webhook: {str(e)}")


@router.get("/webhooks")
async def list_webhooks() -> Dict[str, Any]:
    """List all registered webhooks"""
    return {
        "success": True,
        "data": {
            "webhooks": list(REGISTERED_WEBHOOKS.values()),
            "total_webhooks": len(REGISTERED_WEBHOOKS)
        },
        "message": "Webhooks retrieved successfully"
    }


@router.delete("/webhooks/{webhook_id}")
async def unregister_webhook(webhook_id: str) -> Dict[str, Any]:
    """Unregister a webhook"""
    if webhook_id not in REGISTERED_WEBHOOKS:
        raise HTTPException(status_code=404, detail=f"Webhook {webhook_id} not found")
    
    webhook = REGISTERED_WEBHOOKS.pop(webhook_id)
    
    return {
        "success": True,
        "data": {
            "webhook_id": webhook_id,
            "event_type": webhook["event_type"]
        },
        "message": "Webhook unregistered successfully"
    }


@router.post("/webhooks/trigger")
async def trigger_webhooks(
    event_type: str,
    event_data: Dict[str, Any],
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """Trigger webhooks for a specific event type"""
    try:
        # Find matching webhooks
        matching_webhooks = [
            webhook for webhook in REGISTERED_WEBHOOKS.values()
            if webhook["event_type"] == event_type and webhook["active"]
        ]
        
        if not matching_webhooks:
            return {
                "success": True,
                "data": {
                    "event_type": event_type,
                    "webhooks_triggered": 0
                },
                "message": f"No active webhooks found for event type: {event_type}"
            }
        
        # Trigger webhooks in background
        for webhook in matching_webhooks:
            background_tasks.add_task(_trigger_webhook, webhook, event_data)
        
        return {
            "success": True,
            "data": {
                "event_type": event_type,
                "webhooks_triggered": len(matching_webhooks),
                "webhook_ids": [w["id"] for w in matching_webhooks]
            },
            "message": f"Triggered {len(matching_webhooks)} webhooks for event: {event_type}"
        }
        
    except Exception as e:
        logger.error(f"Failed to trigger webhooks: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to trigger webhooks: {str(e)}")


async def _trigger_webhook(webhook: Dict[str, Any], event_data: Dict[str, Any]):
    """Background task to trigger a single webhook"""
    try:
        payload = {
            "event_type": webhook["event_type"],
            "webhook_id": webhook["id"],
            "timestamp": time.time(),
            "data": event_data
        }
        
        headers = {"Content-Type": "application/json"}
        if webhook["secret"]:
            # In production, you would add HMAC signature here
            headers["X-Webhook-Secret"] = webhook["secret"]
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                webhook["webhook_url"],
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                if response.status == 200:
                    # Update webhook statistics
                    webhook["last_triggered"] = time.time()
                    webhook["trigger_count"] += 1
                    logger.info(f"Webhook {webhook['id']} triggered successfully")
                else:
                    logger.warning(f"Webhook {webhook['id']} returned status {response.status}")
                    
    except Exception as e:
        logger.error(f"Failed to trigger webhook {webhook['id']}: {e}")


@router.get("/integration/status")
async def get_integration_status() -> Dict[str, Any]:
    """Get overall integration status"""
    try:
        # Check all services
        service_statuses = {}
        for service_name in SERVICE_CONFIGS:
            try:
                config = SERVICE_CONFIGS[service_name]
                async with aiohttp.ClientSession() as session:
                    async with session.get(
                        f"{config['base_url']}/health",
                        timeout=aiohttp.ClientTimeout(total=5)
                    ) as response:
                        service_statuses[service_name] = {
                            "status": "healthy" if response.status == 200 else "unhealthy",
                            "response_time": 0.1  # Mock response time
                        }
            except:
                service_statuses[service_name] = {
                    "status": "unreachable",
                    "response_time": None
                }
        
        # Calculate overall health
        healthy_services = sum(1 for s in service_statuses.values() if s["status"] == "healthy")
        total_services = len(service_statuses)
        
        return {
            "success": True,
            "data": {
                "overall_status": "healthy" if healthy_services == total_services else "degraded",
                "services": service_statuses,
                "webhooks": {
                    "total_registered": len(REGISTERED_WEBHOOKS),
                    "active_webhooks": sum(1 for w in REGISTERED_WEBHOOKS.values() if w["active"])
                },
                "statistics": {
                    "healthy_services": healthy_services,
                    "total_services": total_services,
                    "health_percentage": (healthy_services / total_services) * 100 if total_services > 0 else 0
                }
            },
            "message": "Integration status retrieved successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to get integration status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get integration status: {str(e)}")
