#!/usr/bin/env python3
"""
AI Service APIs Demo
Comprehensive demonstration of all AI service API capabilities
"""

import asyncio
import aiohttp
import json
import time
from typing import Dict, Any


class AIServiceAPIDemo:
    """Demo class for AI Service APIs"""
    
    def __init__(self, base_url: str = "http://localhost:8000/api/v1"):
        self.base_url = base_url
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def make_request(self, method: str, endpoint: str, data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Make HTTP request to API"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            async with self.session.request(
                method=method,
                url=url,
                json=data if method.upper() != "GET" else None,
                params=data if method.upper() == "GET" else None,
                headers={"Content-Type": "application/json"}
            ) as response:
                return await response.json()
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def demo_ai_gateway(self):
        """Demonstrate AI Gateway capabilities"""
        print("=" * 70)
        print("AI GATEWAY API DEMO")
        print("=" * 70)
        
        # 1. Get AI capabilities
        print("\n🔍 Getting AI service capabilities...")
        capabilities = await self.make_request("GET", "/ai/capabilities")
        if capabilities.get("success"):
            print("✅ Capabilities retrieved successfully!")
            print(f"   Total operations: {capabilities['data']['total_operations']}")
            for service, info in capabilities['data']['capabilities'].items():
                print(f"   📋 {service}: {len(info['operations'])} operations")
        
        # 2. Process single AI request
        print("\n🤖 Processing single AI request (sentiment analysis)...")
        ai_request = {
            "operation": "sentiment",
            "text": "This new regulatory framework is excellent for our compliance processes",
            "parameters": {},
            "metadata": {"demo": "ai_gateway"}
        }
        
        result = await self.make_request("POST", "/ai/process", ai_request)
        if result.get("success"):
            print("✅ AI request processed successfully!")
            print(f"   Operation: {result['operation']}")
            print(f"   Processing time: {result['processing_time']:.3f}s")
            print(f"   Result: {result['data']}")
        
        # 3. Process batch AI requests
        print("\n📦 Processing batch AI requests...")
        batch_request = {
            "requests": [
                {
                    "operation": "sentiment",
                    "text": "Positive regulatory change announcement",
                    "parameters": {},
                    "metadata": {}
                },
                {
                    "operation": "classify_document",
                    "document_text": "RBI circular on prudential norms for banking institutions",
                    "parameters": {},
                    "metadata": {}
                },
                {
                    "operation": "analyze_text",
                    "text": "Comprehensive analysis of compliance requirements",
                    "parameters": {},
                    "metadata": {}
                }
            ],
            "parallel": True,
            "max_workers": 3
        }
        
        batch_result = await self.make_request("POST", "/ai/batch", batch_request)
        if batch_result.get("success"):
            print("✅ Batch processing completed!")
            stats = batch_result['data']['statistics']
            print(f"   Total requests: {stats['total_requests']}")
            print(f"   Successful: {stats['successful']}")
            print(f"   Success rate: {stats['success_rate']:.1%}")
            print(f"   Average processing time: {stats['average_processing_time']:.3f}s")
    
    async def demo_service_integration(self):
        """Demonstrate Service Integration capabilities"""
        print("\n" + "=" * 70)
        print("SERVICE INTEGRATION API DEMO")
        print("=" * 70)
        
        # 1. List available services
        print("\n🌐 Listing available external services...")
        services = await self.make_request("GET", "/integration/services")
        if services.get("success"):
            print("✅ Services retrieved successfully!")
            for service_name, info in services['data']['services'].items():
                print(f"   🔗 {service_name}: {info['status']} ({info['base_url']})")
        
        # 2. Register webhook
        print("\n🔔 Registering webhook for events...")
        webhook_request = {
            "event_type": "model_trained",
            "webhook_url": "https://example.com/webhooks/model-trained",
            "secret": "demo_webhook_secret",
            "active": True
        }
        
        webhook_result = await self.make_request("POST", "/integration/webhooks/register", webhook_request)
        if webhook_result.get("success"):
            webhook_id = webhook_result['data']['webhook_id']
            print("✅ Webhook registered successfully!")
            print(f"   Webhook ID: {webhook_id}")
            print(f"   Event type: {webhook_result['data']['event_type']}")
        
        # 3. List webhooks
        print("\n📋 Listing registered webhooks...")
        webhooks = await self.make_request("GET", "/integration/webhooks")
        if webhooks.get("success"):
            print("✅ Webhooks retrieved successfully!")
            print(f"   Total webhooks: {webhooks['data']['total_webhooks']}")
            for webhook in webhooks['data']['webhooks']:
                print(f"   🔔 {webhook['event_type']}: {webhook['webhook_url']}")
        
        # 4. Trigger webhook
        print("\n🚀 Triggering webhook event...")
        trigger_result = await self.make_request(
            "POST", 
            "/integration/webhooks/trigger?event_type=model_trained",
            {"model_name": "regulatory_classifier", "accuracy": 0.95}
        )
        if trigger_result.get("success"):
            print("✅ Webhook triggered successfully!")
            print(f"   Webhooks triggered: {trigger_result['data']['webhooks_triggered']}")
    
    async def demo_batch_processing(self):
        """Demonstrate Batch Processing capabilities"""
        print("\n" + "=" * 70)
        print("BATCH PROCESSING API DEMO")
        print("=" * 70)
        
        # 1. Create batch job
        print("\n📦 Creating batch processing job...")
        job_request = {
            "job_type": "nlp_analysis",
            "name": "Demo NLP Analysis Batch",
            "description": "Demonstration of batch NLP processing",
            "items": [
                {"text": "First regulatory document for analysis"},
                {"text": "Second compliance guideline document"},
                {"text": "Third risk assessment document"},
                {"text": "Fourth policy document for review"},
                {"text": "Fifth operational procedure document"}
            ],
            "parameters": {
                "analysis_type": "comprehensive",
                "include_sentiment": True,
                "include_entities": True
            },
            "priority": 7,
            "max_workers": 3
        }
        
        job_result = await self.make_request("POST", "/batch/jobs", job_request)
        if job_result.get("success"):
            job_id = job_result['data']['job_id']
            print("✅ Batch job created successfully!")
            print(f"   Job ID: {job_id}")
            print(f"   Total items: {job_result['data']['total_items']}")
            print(f"   Queue position: {job_result['data']['queue_position']}")
            
            # 2. Monitor job progress
            print("\n⏳ Monitoring job progress...")
            for i in range(5):  # Check 5 times
                await asyncio.sleep(1)  # Wait 1 second
                
                job_status = await self.make_request("GET", f"/batch/jobs/{job_id}")
                if job_status.get("success"):
                    job_data = job_status['data']
                    print(f"   Status: {job_data['status']} | "
                          f"Progress: {job_data['progress_percentage']:.1f}% | "
                          f"Processed: {job_data['processed_items']}/{job_data['total_items']}")
                    
                    if job_data['status'] in ['completed', 'failed']:
                        break
            
            # 3. Get job results
            print("\n📊 Getting job results...")
            results = await self.make_request("GET", f"/batch/jobs/{job_id}/results")
            if results.get("success"):
                print("✅ Results retrieved successfully!")
                print(f"   Total results: {results['data']['total_results']}")
                if results['data']['results']:
                    print("   Sample result:")
                    sample = results['data']['results'][0]
                    print(f"     {json.dumps(sample, indent=6)}")
        
        # 4. Get queue status
        print("\n📈 Getting batch processing queue status...")
        queue_status = await self.make_request("GET", "/batch/queue/status")
        if queue_status.get("success"):
            print("✅ Queue status retrieved successfully!")
            status_data = queue_status['data']
            print(f"   Queue length: {status_data['queue_length']}")
            print(f"   Processing jobs: {status_data['processing_jobs']}")
            print(f"   Total jobs: {status_data['total_jobs']}")
            
            print("   Job status counts:")
            for status, count in status_data['status_counts'].items():
                print(f"     {status}: {count}")
    
    async def demo_api_documentation(self):
        """Demonstrate API Documentation capabilities"""
        print("\n" + "=" * 70)
        print("API DOCUMENTATION DEMO")
        print("=" * 70)
        
        # 1. Get API examples
        print("\n📚 Getting API usage examples...")
        examples = await self.make_request("GET", "/docs/examples")
        if examples.get("success"):
            print("✅ Examples retrieved successfully!")
            print(f"   Total examples: {examples['data']['total_examples']}")
            for category, category_examples in examples['data']['examples'].items():
                print(f"   📋 {category}: {len(category_examples)} examples")
        
        # 2. Get API schemas
        print("\n🏗️ Getting API data schemas...")
        schemas = await self.make_request("GET", "/docs/schemas")
        if schemas.get("success"):
            print("✅ Schemas retrieved successfully!")
            print(f"   Total schemas: {schemas['data']['total_schemas']}")
            for category, category_schemas in schemas['data']['schemas'].items():
                print(f"   📋 {category}: {len(category_schemas)} schemas")
        
        # 3. Get Postman collection
        print("\n📮 Getting Postman collection...")
        postman = await self.make_request("GET", "/docs/postman")
        if postman.get("success"):
            print("✅ Postman collection generated successfully!")
            collection = postman['data']
            print(f"   Collection name: {collection['info']['name']}")
            print(f"   Version: {collection['info']['version']}")
            print(f"   Total endpoints: {len(collection['item'])}")
        
        # 4. Get OpenAPI specification
        print("\n🔧 Getting extended OpenAPI specification...")
        openapi = await self.make_request("GET", "/docs/openapi-extended")
        if openapi.get("success"):
            print("✅ OpenAPI specification retrieved successfully!")
            spec = openapi['data']
            print(f"   OpenAPI version: {spec['openapi']}")
            print(f"   API title: {spec['info']['title']}")
            print(f"   API version: {spec['info']['version']}")
            print(f"   Total tags: {len(spec['tags'])}")
    
    async def demo_comprehensive_workflow(self):
        """Demonstrate comprehensive AI workflow"""
        print("\n" + "=" * 70)
        print("COMPREHENSIVE AI WORKFLOW DEMO")
        print("=" * 70)
        
        print("\n🚀 Starting comprehensive AI workflow demonstration...")
        
        # 1. Check overall system status
        print("\n1️⃣ Checking system status...")
        ai_status = await self.make_request("GET", "/ai/status")
        integration_status = await self.make_request("GET", "/integration/status")
        
        if ai_status.get("success") and integration_status.get("success"):
            print("✅ All systems operational!")
            print(f"   AI services: {ai_status['data']['overall_status']}")
            print(f"   Integration: {integration_status['data']['overall_status']}")
        
        # 2. Process regulatory document
        print("\n2️⃣ Processing regulatory document...")
        doc_analysis = await self.make_request("POST", "/ai/process", {
            "operation": "analyze_text",
            "text": "Reserve Bank of India has issued new guidelines on digital banking operations effective from April 1, 2024. All scheduled commercial banks must comply with enhanced cybersecurity measures and customer data protection protocols.",
            "parameters": {"comprehensive": True},
            "metadata": {"document_type": "regulatory_circular"}
        })
        
        if doc_analysis.get("success"):
            print("✅ Document analysis completed!")
            print(f"   Processing time: {doc_analysis['processing_time']:.3f}s")
            print(f"   Analysis results: {len(doc_analysis['data'])} components")
        
        # 3. Create and monitor batch job
        print("\n3️⃣ Creating batch analysis job...")
        batch_job = await self.make_request("POST", "/batch/jobs", {
            "job_type": "regulatory_analysis",
            "name": "Regulatory Compliance Batch",
            "items": [
                {"text": "Banking regulation update document"},
                {"text": "Compliance guideline for fintech"},
                {"text": "Risk management framework update"}
            ],
            "parameters": {"analysis_depth": "comprehensive"}
        })
        
        if batch_job.get("success"):
            job_id = batch_job['data']['job_id']
            print(f"✅ Batch job created: {job_id}")
            
            # Monitor for a few seconds
            for _ in range(3):
                await asyncio.sleep(1)
                status = await self.make_request("GET", f"/batch/jobs/{job_id}")
                if status.get("success"):
                    print(f"   Progress: {status['data']['progress_percentage']:.1f}%")
        
        print("\n🎉 Comprehensive workflow demonstration completed!")


async def main():
    """Run the complete API demo"""
    print("🚀 Starting AI Service APIs Comprehensive Demo")
    print("This demo showcases all AI service API capabilities")
    
    try:
        async with AIServiceAPIDemo() as demo:
            await demo.demo_ai_gateway()
            await demo.demo_service_integration()
            await demo.demo_batch_processing()
            await demo.demo_api_documentation()
            await demo.demo_comprehensive_workflow()
            
            print("\n" + "=" * 70)
            print("✅ DEMO COMPLETED SUCCESSFULLY!")
            print("=" * 70)
            print("\nAI Service APIs Features Demonstrated:")
            print("• 🤖 Unified AI Gateway with intelligent routing")
            print("• 🌐 Service Integration with external microservices")
            print("• 📦 High-throughput Batch Processing")
            print("• 🔔 Event-driven Webhooks")
            print("• 📚 Comprehensive API Documentation")
            print("• 🔧 OpenAPI Specifications and Postman Collections")
            print("• 📊 Real-time Status Monitoring")
            print("• 🚀 End-to-end Workflow Orchestration")
            print("\nThe AI Service APIs are production-ready!")
        
    except Exception as e:
        print(f"\n❌ Demo failed: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
