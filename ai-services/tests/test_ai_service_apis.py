"""
Tests for AI Service APIs
Comprehensive test suite for all AI service API endpoints
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
import json

from src.main import app

client = TestClient(app)


class TestAIGatewayAPI:
    """Test cases for AI Gateway API"""
    
    def test_process_nlp_request(self):
        """Test NLP request processing through gateway"""
        request_data = {
            "operation": "sentiment",
            "text": "This is a positive regulatory change",
            "parameters": {},
            "metadata": {"source": "test"}
        }
        
        response = client.post("/api/v1/ai/process", json=request_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["operation"] == "sentiment"
        assert "data" in data
        assert "processing_time" in data
    
    def test_process_document_request(self):
        """Test document processing through gateway"""
        request_data = {
            "operation": "classify_document",
            "document_text": "RBI circular on prudential norms for banks",
            "parameters": {"categories": ["rbi_circular", "policy_document"]},
            "metadata": {}
        }
        
        response = client.post("/api/v1/ai/process", json=request_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["operation"] == "classify_document"
    
    def test_batch_processing(self):
        """Test batch processing through gateway"""
        request_data = {
            "requests": [
                {
                    "operation": "sentiment",
                    "text": "First text for analysis",
                    "parameters": {},
                    "metadata": {}
                },
                {
                    "operation": "sentiment", 
                    "text": "Second text for analysis",
                    "parameters": {},
                    "metadata": {}
                }
            ],
            "parallel": True,
            "max_workers": 2
        }
        
        response = client.post("/api/v1/ai/batch", json=request_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "statistics" in data["data"]
        assert len(data["data"]["results"]) == 2
    
    def test_get_capabilities(self):
        """Test getting AI capabilities"""
        response = client.get("/api/v1/ai/capabilities")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "capabilities" in data["data"]
        assert "nlp" in data["data"]["capabilities"]
        assert "document_processing" in data["data"]["capabilities"]
    
    def test_get_status(self):
        """Test getting AI service status"""
        response = client.get("/api/v1/ai/status")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "overall_status" in data["data"]
        assert "services" in data["data"]
    
    def test_invalid_operation(self):
        """Test handling of invalid operations"""
        request_data = {
            "operation": "invalid_operation",
            "text": "Some text",
            "parameters": {},
            "metadata": {}
        }
        
        response = client.post("/api/v1/ai/process", json=request_data)
        assert response.status_code == 200  # Gateway returns 200 but with error in response
        
        data = response.json()
        assert data["success"] is False
        assert "error" in data["data"]


class TestServiceIntegrationAPI:
    """Test cases for Service Integration API"""
    
    @patch('aiohttp.ClientSession.request')
    def test_call_external_service(self, mock_request):
        """Test calling external service"""
        # Mock successful response
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.json.return_value = {"result": "success"}
        mock_response.content_type = "application/json"
        mock_request.return_value.__aenter__.return_value = mock_response
        
        request_data = {
            "service_name": "regulatory-intelligence",
            "endpoint": "analyze",
            "method": "POST",
            "data": {"text": "Sample regulatory text"},
            "timeout": 30
        }
        
        response = client.post("/api/v1/integration/call-service", json=request_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["service_name"] == "regulatory-intelligence"
        assert data["status_code"] == 200
    
    def test_list_services(self):
        """Test listing available services"""
        response = client.get("/api/v1/integration/services")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "services" in data["data"]
        assert "total_services" in data["data"]
    
    def test_register_webhook(self):
        """Test webhook registration"""
        request_data = {
            "event_type": "model_trained",
            "webhook_url": "https://example.com/webhook",
            "secret": "webhook_secret",
            "active": True
        }
        
        response = client.post("/api/v1/integration/webhooks/register", json=request_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "webhook_id" in data["data"]
        assert data["data"]["event_type"] == "model_trained"
    
    def test_list_webhooks(self):
        """Test listing webhooks"""
        response = client.get("/api/v1/integration/webhooks")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "webhooks" in data["data"]
        assert "total_webhooks" in data["data"]
    
    def test_trigger_webhooks(self):
        """Test triggering webhooks"""
        # First register a webhook
        register_data = {
            "event_type": "test_event",
            "webhook_url": "https://example.com/test",
            "active": True
        }
        client.post("/api/v1/integration/webhooks/register", json=register_data)
        
        # Then trigger it
        response = client.post(
            "/api/v1/integration/webhooks/trigger",
            params={"event_type": "test_event"},
            json={"test_data": "value"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["data"]["event_type"] == "test_event"


class TestBatchProcessingAPI:
    """Test cases for Batch Processing API"""
    
    def test_create_batch_job(self):
        """Test creating a batch job"""
        request_data = {
            "job_type": "nlp_analysis",
            "name": "Test NLP Batch",
            "description": "Test batch job for NLP analysis",
            "items": [
                {"text": "First document"},
                {"text": "Second document"}
            ],
            "parameters": {"analysis_type": "sentiment"},
            "priority": 5,
            "max_workers": 2
        }
        
        response = client.post("/api/v1/batch/jobs", json=request_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "job_id" in data["data"]
        assert data["data"]["total_items"] == 2
    
    def test_list_batch_jobs(self):
        """Test listing batch jobs"""
        response = client.get("/api/v1/batch/jobs")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "jobs" in data["data"]
        assert "total_jobs" in data["data"]
    
    def test_get_batch_job(self):
        """Test getting specific batch job"""
        # First create a job
        create_data = {
            "job_type": "document_classification",
            "name": "Test Job",
            "items": [{"text": "test"}],
            "parameters": {}
        }
        create_response = client.post("/api/v1/batch/jobs", json=create_data)
        job_id = create_response.json()["data"]["job_id"]
        
        # Then get it
        response = client.get(f"/api/v1/batch/jobs/{job_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["data"]["job_id"] == job_id
    
    def test_cancel_batch_job(self):
        """Test cancelling a batch job"""
        # First create a job
        create_data = {
            "job_type": "risk_assessment",
            "name": "Test Job to Cancel",
            "items": [{"data": "test"}],
            "parameters": {}
        }
        create_response = client.post("/api/v1/batch/jobs", json=create_data)
        job_id = create_response.json()["data"]["job_id"]
        
        # Then cancel it
        response = client.delete(f"/api/v1/batch/jobs/{job_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["data"]["status"] == "cancelled"
    
    def test_get_queue_status(self):
        """Test getting queue status"""
        response = client.get("/api/v1/batch/queue/status")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "queue_length" in data["data"]
        assert "status_counts" in data["data"]
    
    def test_create_job_from_file(self):
        """Test creating job from uploaded file"""
        # Create a test JSON file
        test_data = [
            {"text": "First item"},
            {"text": "Second item"}
        ]
        
        files = {
            "file": ("test.json", json.dumps(test_data), "application/json")
        }
        
        form_data = {
            "job_type": "nlp_analysis",
            "name": "File Upload Test",
            "parameters": "{}"
        }
        
        response = client.post(
            "/api/v1/batch/jobs/upload",
            files=files,
            data=form_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["data"]["total_items"] == 2


class TestAPIDocumentationAPI:
    """Test cases for API Documentation API"""
    
    def test_get_api_documentation(self):
        """Test getting API documentation"""
        response = client.get("/api/v1/docs/")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]
    
    def test_get_api_examples(self):
        """Test getting API examples"""
        response = client.get("/api/v1/docs/examples")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "examples" in data["data"]
        assert "nlp" in data["data"]["examples"]
        assert "documents" in data["data"]["examples"]
    
    def test_get_api_schemas(self):
        """Test getting API schemas"""
        response = client.get("/api/v1/docs/schemas")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "schemas" in data["data"]
        assert "common" in data["data"]["schemas"]
    
    def test_get_postman_collection(self):
        """Test getting Postman collection"""
        response = client.get("/api/v1/docs/postman")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "info" in data["data"]
        assert "item" in data["data"]
    
    def test_get_extended_openapi_spec(self):
        """Test getting extended OpenAPI specification"""
        response = client.get("/api/v1/docs/openapi-extended")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "openapi" in data["data"]
        assert "info" in data["data"]
        assert "servers" in data["data"]


class TestAPIIntegration:
    """Integration tests for API endpoints"""
    
    def test_end_to_end_nlp_workflow(self):
        """Test complete NLP workflow"""
        # 1. Check capabilities
        capabilities_response = client.get("/api/v1/ai/capabilities")
        assert capabilities_response.status_code == 200
        
        # 2. Process single request
        process_response = client.post("/api/v1/ai/process", json={
            "operation": "sentiment",
            "text": "This regulatory change is positive",
            "parameters": {},
            "metadata": {"workflow": "test"}
        })
        assert process_response.status_code == 200
        
        # 3. Create batch job
        batch_response = client.post("/api/v1/batch/jobs", json={
            "job_type": "nlp_analysis",
            "name": "E2E Test Batch",
            "items": [
                {"text": "First text"},
                {"text": "Second text"}
            ],
            "parameters": {}
        })
        assert batch_response.status_code == 200
        
        job_id = batch_response.json()["data"]["job_id"]
        
        # 4. Check job status
        status_response = client.get(f"/api/v1/batch/jobs/{job_id}")
        assert status_response.status_code == 200
    
    def test_service_health_check(self):
        """Test service health across all endpoints"""
        endpoints = [
            "/api/v1/ai/status",
            "/api/v1/integration/status",
            "/api/v1/batch/queue/status",
            "/api/v1/training/status"
        ]
        
        for endpoint in endpoints:
            response = client.get(endpoint)
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True


if __name__ == "__main__":
    pytest.main([__file__])
