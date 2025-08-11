"""
API Documentation Endpoints
Comprehensive API documentation and OpenAPI specifications
"""

from typing import Dict, Any, List
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, JSONResponse
import json

from src.core.logging import api_logger as logger

router = APIRouter()


@router.get("/", response_class=HTMLResponse)
async def get_api_documentation() -> str:
    """Get comprehensive API documentation"""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>AI/ML Services API Documentation</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .header { background: #2c3e50; color: white; padding: 20px; border-radius: 5px; }
            .section { margin: 30px 0; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            .endpoint { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 3px; }
            .method { padding: 3px 8px; border-radius: 3px; color: white; font-weight: bold; }
            .get { background: #28a745; }
            .post { background: #007bff; }
            .put { background: #ffc107; color: black; }
            .delete { background: #dc3545; }
            code { background: #f1f1f1; padding: 2px 4px; border-radius: 3px; }
            .example { background: #e9ecef; padding: 10px; border-radius: 3px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🤖 AI/ML Services API Documentation</h1>
            <p>Comprehensive API for AI-powered regulatory intelligence and compliance</p>
        </div>

        <div class="section">
            <h2>📋 Overview</h2>
            <p>The AI/ML Services API provides a unified interface for:</p>
            <ul>
                <li><strong>Natural Language Processing</strong> - Sentiment analysis, entity extraction, text similarity</li>
                <li><strong>Document Intelligence</strong> - OCR, classification, structure analysis</li>
                <li><strong>Risk Assessment</strong> - Risk scoring, prediction, scenario analysis</li>
                <li><strong>Regulatory Intelligence</strong> - Compliance checking, regulatory analysis</li>
                <li><strong>Model Training</strong> - Automated ML model training and deployment</li>
                <li><strong>Batch Processing</strong> - High-throughput batch operations</li>
                <li><strong>Service Integration</strong> - External service communication and webhooks</li>
            </ul>
        </div>

        <div class="section">
            <h2>🚀 Quick Start</h2>
            <p>Base URL: <code>http://localhost:8000/api/v1</code></p>
            <p>All endpoints return JSON responses with the following structure:</p>
            <div class="example">
                <pre>{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}</pre>
            </div>
        </div>

        <div class="section">
            <h2>🔗 Core Endpoints</h2>
            
            <h3>AI Gateway</h3>
            <div class="endpoint">
                <span class="method post">POST</span> <code>/ai/process</code>
                <p>Unified AI processing with intelligent routing</p>
            </div>
            <div class="endpoint">
                <span class="method post">POST</span> <code>/ai/batch</code>
                <p>Process multiple AI requests in batch</p>
            </div>
            <div class="endpoint">
                <span class="method get">GET</span> <code>/ai/capabilities</code>
                <p>Get comprehensive AI service capabilities</p>
            </div>

            <h3>Natural Language Processing</h3>
            <div class="endpoint">
                <span class="method post">POST</span> <code>/nlp/sentiment</code>
                <p>Analyze sentiment of text</p>
            </div>
            <div class="endpoint">
                <span class="method post">POST</span> <code>/nlp/entities</code>
                <p>Extract named entities from text</p>
            </div>
            <div class="endpoint">
                <span class="method post">POST</span> <code>/nlp/similarity</code>
                <p>Calculate text similarity</p>
            </div>

            <h3>Document Processing</h3>
            <div class="endpoint">
                <span class="method post">POST</span> <code>/documents/upload</code>
                <p>Upload and analyze documents with OCR</p>
            </div>
            <div class="endpoint">
                <span class="method post">POST</span> <code>/documents/classify</code>
                <p>Classify documents by type</p>
            </div>
            <div class="endpoint">
                <span class="method post">POST</span> <code>/documents/extract-text</code>
                <p>Extract text from documents</p>
            </div>

            <h3>Model Training</h3>
            <div class="endpoint">
                <span class="method get">GET</span> <code>/training/status</code>
                <p>Get training pipeline status</p>
            </div>
            <div class="endpoint">
                <span class="method post">POST</span> <code>/training/train/{model_name}</code>
                <p>Train a specific model</p>
            </div>
            <div class="endpoint">
                <span class="method post">POST</span> <code>/training/deploy/{model_name}</code>
                <p>Deploy a trained model</p>
            </div>

            <h3>Batch Processing</h3>
            <div class="endpoint">
                <span class="method post">POST</span> <code>/batch/jobs</code>
                <p>Create a new batch processing job</p>
            </div>
            <div class="endpoint">
                <span class="method get">GET</span> <code>/batch/jobs</code>
                <p>List batch jobs</p>
            </div>
            <div class="endpoint">
                <span class="method get">GET</span> <code>/batch/jobs/{job_id}</code>
                <p>Get batch job details</p>
            </div>

            <h3>Service Integration</h3>
            <div class="endpoint">
                <span class="method post">POST</span> <code>/integration/call-service</code>
                <p>Call external microservices</p>
            </div>
            <div class="endpoint">
                <span class="method post">POST</span> <code>/integration/webhooks/register</code>
                <p>Register webhook for events</p>
            </div>
            <div class="endpoint">
                <span class="method get">GET</span> <code>/integration/services</code>
                <p>List available services</p>
            </div>
        </div>

        <div class="section">
            <h2>📝 Example Usage</h2>
            
            <h3>Sentiment Analysis</h3>
            <div class="example">
                <pre>curl -X POST "http://localhost:8000/api/v1/nlp/sentiment" \\
     -H "Content-Type: application/json" \\
     -d '{"text": "This regulatory change is very positive for our business"}'</pre>
            </div>

            <h3>Document Classification</h3>
            <div class="example">
                <pre>curl -X POST "http://localhost:8000/api/v1/documents/classify" \\
     -H "Content-Type: application/json" \\
     -d '{"document_text": "Reserve Bank of India circular on prudential norms..."}'</pre>
            </div>

            <h3>Batch Processing</h3>
            <div class="example">
                <pre>curl -X POST "http://localhost:8000/api/v1/batch/jobs" \\
     -H "Content-Type: application/json" \\
     -d '{
       "job_type": "nlp_analysis",
       "name": "Sentiment Analysis Batch",
       "items": [
         {"text": "First document text"},
         {"text": "Second document text"}
       ]
     }'</pre>
            </div>
        </div>

        <div class="section">
            <h2>🔐 Authentication</h2>
            <p>API authentication is handled via Bearer tokens:</p>
            <div class="example">
                <pre>Authorization: Bearer YOUR_API_TOKEN</pre>
            </div>
        </div>

        <div class="section">
            <h2>📊 Rate Limiting</h2>
            <p>API requests are rate limited to ensure fair usage:</p>
            <ul>
                <li>Standard endpoints: 100 requests per minute</li>
                <li>Batch processing: 10 jobs per hour</li>
                <li>Model training: 5 training requests per day</li>
            </ul>
        </div>

        <div class="section">
            <h2>🔗 Additional Resources</h2>
            <ul>
                <li><a href="/api/v1/docs">Interactive API Documentation (Swagger)</a></li>
                <li><a href="/api/v1/redoc">ReDoc Documentation</a></li>
                <li><a href="/api/v1/openapi.json">OpenAPI Specification</a></li>
                <li><a href="/api/v1/docs/examples">API Examples</a></li>
                <li><a href="/api/v1/docs/schemas">Data Schemas</a></li>
            </ul>
        </div>

        <div class="section">
            <h2>📞 Support</h2>
            <p>For API support and questions:</p>
            <ul>
                <li>Email: api-support@company.com</li>
                <li>Documentation: <a href="/api/v1/docs">Interactive Docs</a></li>
                <li>Status Page: <a href="/health">Service Health</a></li>
            </ul>
        </div>
    </body>
    </html>
    """
    return html_content


@router.get("/examples")
async def get_api_examples() -> Dict[str, Any]:
    """Get comprehensive API usage examples"""
    examples = {
        "nlp": {
            "sentiment_analysis": {
                "endpoint": "/nlp/sentiment",
                "method": "POST",
                "request": {
                    "text": "This new regulatory framework is excellent for compliance"
                },
                "response": {
                    "success": True,
                    "data": {
                        "sentiment": {
                            "label": "POSITIVE",
                            "score": 0.9234
                        }
                    }
                }
            },
            "entity_extraction": {
                "endpoint": "/nlp/entities",
                "method": "POST",
                "request": {
                    "text": "Reserve Bank of India issued new guidelines on January 15, 2024"
                },
                "response": {
                    "success": True,
                    "data": {
                        "entities": [
                            {"text": "Reserve Bank of India", "label": "ORG", "start": 0, "end": 21},
                            {"text": "January 15, 2024", "label": "DATE", "start": 50, "end": 66}
                        ]
                    }
                }
            }
        },
        "documents": {
            "classification": {
                "endpoint": "/documents/classify",
                "method": "POST",
                "request": {
                    "document_text": "RBI/2024-25/001 Master Circular on Prudential Norms...",
                    "categories": ["rbi_circular", "compliance_guideline", "policy_document"]
                },
                "response": {
                    "success": True,
                    "data": {
                        "predicted_category": "rbi_circular",
                        "confidence": 0.95,
                        "all_scores": [
                            {"category": "rbi_circular", "score": 0.95},
                            {"category": "compliance_guideline", "score": 0.03},
                            {"category": "policy_document", "score": 0.02}
                        ]
                    }
                }
            }
        },
        "batch_processing": {
            "create_job": {
                "endpoint": "/batch/jobs",
                "method": "POST",
                "request": {
                    "job_type": "nlp_analysis",
                    "name": "Quarterly Document Analysis",
                    "description": "Analyze sentiment of Q4 regulatory documents",
                    "items": [
                        {"text": "Document 1 content..."},
                        {"text": "Document 2 content..."}
                    ],
                    "parameters": {
                        "analysis_type": "sentiment"
                    }
                },
                "response": {
                    "success": True,
                    "data": {
                        "job_id": "550e8400-e29b-41d4-a716-446655440000",
                        "status": "pending",
                        "total_items": 2,
                        "queue_position": 1
                    }
                }
            }
        },
        "ai_gateway": {
            "unified_processing": {
                "endpoint": "/ai/process",
                "method": "POST",
                "request": {
                    "operation": "analyze_text",
                    "text": "This regulatory change will impact our compliance procedures",
                    "parameters": {
                        "include_sentiment": True,
                        "include_entities": True
                    }
                },
                "response": {
                    "success": True,
                    "operation": "analyze_text",
                    "data": {
                        "sentiment": {"label": "NEUTRAL", "score": 0.52},
                        "entities": [
                            {"text": "compliance procedures", "label": "PROCEDURE"}
                        ],
                        "statistics": {
                            "character_count": 59,
                            "word_count": 9,
                            "sentence_count": 1
                        }
                    },
                    "processing_time": 0.234
                }
            }
        }
    }
    
    return {
        "success": True,
        "data": {
            "examples": examples,
            "total_examples": sum(len(category) for category in examples.values())
        },
        "message": "API examples retrieved successfully"
    }


@router.get("/schemas")
async def get_api_schemas() -> Dict[str, Any]:
    """Get comprehensive API data schemas"""
    schemas = {
        "common": {
            "APIResponse": {
                "type": "object",
                "properties": {
                    "success": {"type": "boolean", "description": "Whether the request was successful"},
                    "data": {"type": "object", "description": "Response data"},
                    "message": {"type": "string", "description": "Human-readable message"}
                },
                "required": ["success", "data", "message"]
            },
            "ErrorResponse": {
                "type": "object",
                "properties": {
                    "success": {"type": "boolean", "enum": [False]},
                    "error": {"type": "string", "description": "Error message"},
                    "error_code": {"type": "string", "description": "Error code"},
                    "details": {"type": "object", "description": "Additional error details"}
                }
            }
        },
        "nlp": {
            "SentimentRequest": {
                "type": "object",
                "properties": {
                    "text": {"type": "string", "maxLength": 10000, "description": "Text to analyze"}
                },
                "required": ["text"]
            },
            "SentimentResponse": {
                "type": "object",
                "properties": {
                    "sentiment": {
                        "type": "object",
                        "properties": {
                            "label": {"type": "string", "enum": ["POSITIVE", "NEGATIVE", "NEUTRAL"]},
                            "score": {"type": "number", "minimum": 0, "maximum": 1}
                        }
                    }
                }
            }
        },
        "documents": {
            "DocumentClassificationRequest": {
                "type": "object",
                "properties": {
                    "document_text": {"type": "string", "maxLength": 100000},
                    "categories": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Optional list of categories to classify into"
                    }
                },
                "required": ["document_text"]
            }
        },
        "batch": {
            "BatchJobRequest": {
                "type": "object",
                "properties": {
                    "job_type": {
                        "type": "string",
                        "enum": ["nlp_analysis", "document_classification", "risk_assessment"]
                    },
                    "name": {"type": "string", "maxLength": 255},
                    "items": {
                        "type": "array",
                        "items": {"type": "object"},
                        "maxItems": 10000
                    },
                    "parameters": {"type": "object"},
                    "priority": {"type": "integer", "minimum": 1, "maximum": 10}
                },
                "required": ["job_type", "name", "items"]
            }
        }
    }
    
    return {
        "success": True,
        "data": {
            "schemas": schemas,
            "total_schemas": sum(len(category) for category in schemas.values())
        },
        "message": "API schemas retrieved successfully"
    }


@router.get("/postman")
async def get_postman_collection() -> Dict[str, Any]:
    """Get Postman collection for API testing"""
    collection = {
        "info": {
            "name": "AI/ML Services API",
            "description": "Comprehensive API for AI-powered regulatory intelligence",
            "version": "1.0.0",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        "variable": [
            {
                "key": "baseUrl",
                "value": "http://localhost:8000/api/v1",
                "type": "string"
            }
        ],
        "item": [
            {
                "name": "NLP Services",
                "item": [
                    {
                        "name": "Sentiment Analysis",
                        "request": {
                            "method": "POST",
                            "header": [
                                {"key": "Content-Type", "value": "application/json"}
                            ],
                            "body": {
                                "mode": "raw",
                                "raw": json.dumps({
                                    "text": "This regulatory change is very positive"
                                })
                            },
                            "url": {
                                "raw": "{{baseUrl}}/nlp/sentiment",
                                "host": ["{{baseUrl}}"],
                                "path": ["nlp", "sentiment"]
                            }
                        }
                    }
                ]
            },
            {
                "name": "Document Processing",
                "item": [
                    {
                        "name": "Document Classification",
                        "request": {
                            "method": "POST",
                            "header": [
                                {"key": "Content-Type", "value": "application/json"}
                            ],
                            "body": {
                                "mode": "raw",
                                "raw": json.dumps({
                                    "document_text": "RBI circular on prudential norms..."
                                })
                            },
                            "url": {
                                "raw": "{{baseUrl}}/documents/classify",
                                "host": ["{{baseUrl}}"],
                                "path": ["documents", "classify"]
                            }
                        }
                    }
                ]
            },
            {
                "name": "Batch Processing",
                "item": [
                    {
                        "name": "Create Batch Job",
                        "request": {
                            "method": "POST",
                            "header": [
                                {"key": "Content-Type", "value": "application/json"}
                            ],
                            "body": {
                                "mode": "raw",
                                "raw": json.dumps({
                                    "job_type": "nlp_analysis",
                                    "name": "Test Batch Job",
                                    "items": [
                                        {"text": "Sample text 1"},
                                        {"text": "Sample text 2"}
                                    ]
                                })
                            },
                            "url": {
                                "raw": "{{baseUrl}}/batch/jobs",
                                "host": ["{{baseUrl}}"],
                                "path": ["batch", "jobs"]
                            }
                        }
                    }
                ]
            }
        ]
    }
    
    return {
        "success": True,
        "data": collection,
        "message": "Postman collection generated successfully"
    }


@router.get("/openapi-extended")
async def get_extended_openapi_spec() -> Dict[str, Any]:
    """Get extended OpenAPI specification with additional metadata"""
    spec = {
        "openapi": "3.0.0",
        "info": {
            "title": "AI/ML Services API",
            "description": "Comprehensive API for AI-powered regulatory intelligence and compliance",
            "version": "1.0.0",
            "contact": {
                "name": "API Support",
                "email": "api-support@company.com"
            },
            "license": {
                "name": "MIT",
                "url": "https://opensource.org/licenses/MIT"
            }
        },
        "servers": [
            {
                "url": "http://localhost:8000/api/v1",
                "description": "Development server"
            },
            {
                "url": "https://api.company.com/ai/v1",
                "description": "Production server"
            }
        ],
        "tags": [
            {"name": "nlp", "description": "Natural Language Processing operations"},
            {"name": "documents", "description": "Document processing and analysis"},
            {"name": "training", "description": "Model training and management"},
            {"name": "batch", "description": "Batch processing operations"},
            {"name": "integration", "description": "Service integration and webhooks"},
            {"name": "ai-gateway", "description": "Unified AI processing gateway"}
        ],
        "components": {
            "securitySchemes": {
                "bearerAuth": {
                    "type": "http",
                    "scheme": "bearer",
                    "bearerFormat": "JWT"
                }
            }
        },
        "security": [
            {"bearerAuth": []}
        ]
    }
    
    return {
        "success": True,
        "data": spec,
        "message": "Extended OpenAPI specification retrieved successfully"
    }
