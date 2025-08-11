"""
Batch Processing API Endpoints
High-throughput batch processing for AI/ML operations
"""

import asyncio
import uuid
from typing import Dict, Any, List, Optional, Union
from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File
from pydantic import BaseModel, Field
import time
import json
from enum import Enum

from src.core.logging import api_logger as logger

router = APIRouter()


class BatchStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class BatchJobType(str, Enum):
    NLP_ANALYSIS = "nlp_analysis"
    DOCUMENT_CLASSIFICATION = "document_classification"
    RISK_ASSESSMENT = "risk_assessment"
    REGULATORY_ANALYSIS = "regulatory_analysis"
    MODEL_TRAINING = "model_training"
    BULK_PREDICTION = "bulk_prediction"


class BatchJobRequest(BaseModel):
    """Request model for batch job creation"""
    job_type: BatchJobType = Field(..., description="Type of batch job")
    name: str = Field(..., description="Human-readable job name")
    description: Optional[str] = Field(None, description="Job description")
    items: List[Dict[str, Any]] = Field(..., description="List of items to process")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Job-specific parameters")
    priority: int = Field(default=5, description="Job priority (1-10, higher is more priority)")
    max_workers: int = Field(default=5, description="Maximum parallel workers")
    timeout_per_item: int = Field(default=60, description="Timeout per item in seconds")


class BatchJob(BaseModel):
    """Batch job model"""
    job_id: str
    job_type: BatchJobType
    name: str
    description: Optional[str]
    status: BatchStatus
    created_at: float
    started_at: Optional[float]
    completed_at: Optional[float]
    total_items: int
    processed_items: int
    successful_items: int
    failed_items: int
    progress_percentage: float
    results: List[Dict[str, Any]]
    errors: List[Dict[str, Any]]
    parameters: Dict[str, Any]
    priority: int
    max_workers: int


# In-memory job storage (in production, this would be in a database)
BATCH_JOBS: Dict[str, BatchJob] = {}
JOB_QUEUE: List[str] = []
PROCESSING_JOBS: Dict[str, asyncio.Task] = {}


@router.post("/jobs")
async def create_batch_job(
    request: BatchJobRequest,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """Create a new batch processing job"""
    try:
        job_id = str(uuid.uuid4())
        
        # Create job
        job = BatchJob(
            job_id=job_id,
            job_type=request.job_type,
            name=request.name,
            description=request.description,
            status=BatchStatus.PENDING,
            created_at=time.time(),
            started_at=None,
            completed_at=None,
            total_items=len(request.items),
            processed_items=0,
            successful_items=0,
            failed_items=0,
            progress_percentage=0.0,
            results=[],
            errors=[],
            parameters=request.parameters,
            priority=request.priority,
            max_workers=request.max_workers
        )
        
        BATCH_JOBS[job_id] = job
        
        # Add to queue (sort by priority)
        JOB_QUEUE.append(job_id)
        JOB_QUEUE.sort(key=lambda jid: BATCH_JOBS[jid].priority, reverse=True)
        
        # Start processing in background
        background_tasks.add_task(_process_job_queue)
        
        logger.info(f"Created batch job {job_id}: {request.name}")
        
        return {
            "success": True,
            "data": {
                "job_id": job_id,
                "status": job.status,
                "total_items": job.total_items,
                "queue_position": JOB_QUEUE.index(job_id) + 1
            },
            "message": f"Batch job created successfully: {request.name}"
        }
        
    except Exception as e:
        logger.error(f"Failed to create batch job: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create batch job: {str(e)}")


@router.get("/jobs")
async def list_batch_jobs(
    status: Optional[BatchStatus] = None,
    job_type: Optional[BatchJobType] = None,
    limit: int = 50,
    offset: int = 0
) -> Dict[str, Any]:
    """List batch jobs with optional filtering"""
    try:
        jobs = list(BATCH_JOBS.values())
        
        # Apply filters
        if status:
            jobs = [job for job in jobs if job.status == status]
        if job_type:
            jobs = [job for job in jobs if job.job_type == job_type]
        
        # Sort by creation time (newest first)
        jobs.sort(key=lambda j: j.created_at, reverse=True)
        
        # Apply pagination
        total_jobs = len(jobs)
        jobs = jobs[offset:offset + limit]
        
        return {
            "success": True,
            "data": {
                "jobs": [job.dict() for job in jobs],
                "total_jobs": total_jobs,
                "limit": limit,
                "offset": offset,
                "has_more": offset + limit < total_jobs
            },
            "message": f"Retrieved {len(jobs)} batch jobs"
        }
        
    except Exception as e:
        logger.error(f"Failed to list batch jobs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list batch jobs: {str(e)}")


@router.get("/jobs/{job_id}")
async def get_batch_job(job_id: str) -> Dict[str, Any]:
    """Get details of a specific batch job"""
    if job_id not in BATCH_JOBS:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    
    job = BATCH_JOBS[job_id]
    
    return {
        "success": True,
        "data": job.dict(),
        "message": f"Job details retrieved for {job_id}"
    }


@router.delete("/jobs/{job_id}")
async def cancel_batch_job(job_id: str) -> Dict[str, Any]:
    """Cancel a batch job"""
    if job_id not in BATCH_JOBS:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    
    job = BATCH_JOBS[job_id]
    
    if job.status == BatchStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Cannot cancel completed job")
    
    if job.status == BatchStatus.PROCESSING:
        # Cancel running task
        if job_id in PROCESSING_JOBS:
            PROCESSING_JOBS[job_id].cancel()
            del PROCESSING_JOBS[job_id]
    
    if job_id in JOB_QUEUE:
        JOB_QUEUE.remove(job_id)
    
    job.status = BatchStatus.CANCELLED
    job.completed_at = time.time()
    
    logger.info(f"Cancelled batch job {job_id}")
    
    return {
        "success": True,
        "data": {
            "job_id": job_id,
            "status": job.status
        },
        "message": f"Job {job_id} cancelled successfully"
    }


@router.get("/jobs/{job_id}/results")
async def get_job_results(
    job_id: str,
    limit: int = 100,
    offset: int = 0,
    include_errors: bool = False
) -> Dict[str, Any]:
    """Get results from a batch job"""
    if job_id not in BATCH_JOBS:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    
    job = BATCH_JOBS[job_id]
    
    # Get results
    results = job.results[offset:offset + limit]
    
    response_data = {
        "job_id": job_id,
        "status": job.status,
        "results": results,
        "total_results": len(job.results),
        "limit": limit,
        "offset": offset,
        "has_more": offset + limit < len(job.results)
    }
    
    if include_errors:
        response_data["errors"] = job.errors
    
    return {
        "success": True,
        "data": response_data,
        "message": f"Retrieved {len(results)} results for job {job_id}"
    }


@router.post("/jobs/upload")
async def create_job_from_file(
    file: UploadFile = File(...),
    job_type: BatchJobType = BatchJobType.NLP_ANALYSIS,
    name: str = "Uploaded Batch Job",
    description: Optional[str] = None,
    parameters: str = "{}",
    background_tasks: BackgroundTasks = None
) -> Dict[str, Any]:
    """Create batch job from uploaded file"""
    try:
        # Read file content
        content = await file.read()
        
        # Parse based on file type
        if file.filename.endswith('.json'):
            items = json.loads(content.decode('utf-8'))
        elif file.filename.endswith('.csv'):
            import pandas as pd
            import io
            df = pd.read_csv(io.StringIO(content.decode('utf-8')))
            items = df.to_dict('records')
        else:
            raise HTTPException(
                status_code=400, 
                detail="Unsupported file format. Use JSON or CSV."
            )
        
        # Parse parameters
        try:
            parsed_parameters = json.loads(parameters)
        except:
            parsed_parameters = {}
        
        # Create job request
        request = BatchJobRequest(
            job_type=job_type,
            name=name,
            description=description or f"Batch job from {file.filename}",
            items=items,
            parameters=parsed_parameters
        )
        
        return await create_batch_job(request, background_tasks)
        
    except Exception as e:
        logger.error(f"Failed to create job from file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create job from file: {str(e)}")


@router.get("/queue/status")
async def get_queue_status() -> Dict[str, Any]:
    """Get batch processing queue status"""
    try:
        # Count jobs by status
        status_counts = {}
        for status in BatchStatus:
            status_counts[status.value] = sum(1 for job in BATCH_JOBS.values() if job.status == status)
        
        # Get queue information
        queue_info = []
        for i, job_id in enumerate(JOB_QUEUE[:10]):  # Show first 10 in queue
            job = BATCH_JOBS[job_id]
            queue_info.append({
                "position": i + 1,
                "job_id": job_id,
                "name": job.name,
                "job_type": job.job_type,
                "priority": job.priority,
                "total_items": job.total_items
            })
        
        return {
            "success": True,
            "data": {
                "queue_length": len(JOB_QUEUE),
                "processing_jobs": len(PROCESSING_JOBS),
                "status_counts": status_counts,
                "queue_preview": queue_info,
                "total_jobs": len(BATCH_JOBS)
            },
            "message": "Queue status retrieved successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to get queue status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get queue status: {str(e)}")


# Background processing functions
async def _process_job_queue():
    """Process jobs from the queue"""
    while JOB_QUEUE and len(PROCESSING_JOBS) < 3:  # Max 3 concurrent jobs
        job_id = JOB_QUEUE.pop(0)
        
        if job_id in BATCH_JOBS and BATCH_JOBS[job_id].status == BatchStatus.PENDING:
            task = asyncio.create_task(_process_batch_job(job_id))
            PROCESSING_JOBS[job_id] = task


async def _process_batch_job(job_id: str):
    """Process a single batch job"""
    try:
        job = BATCH_JOBS[job_id]
        job.status = BatchStatus.PROCESSING
        job.started_at = time.time()
        
        logger.info(f"Starting batch job {job_id}: {job.name}")
        
        # Process items based on job type
        if job.job_type == BatchJobType.NLP_ANALYSIS:
            await _process_nlp_batch(job)
        elif job.job_type == BatchJobType.DOCUMENT_CLASSIFICATION:
            await _process_document_batch(job)
        elif job.job_type == BatchJobType.RISK_ASSESSMENT:
            await _process_risk_batch(job)
        elif job.job_type == BatchJobType.REGULATORY_ANALYSIS:
            await _process_regulatory_batch(job)
        elif job.job_type == BatchJobType.BULK_PREDICTION:
            await _process_prediction_batch(job)
        else:
            raise ValueError(f"Unknown job type: {job.job_type}")
        
        job.status = BatchStatus.COMPLETED
        job.completed_at = time.time()
        job.progress_percentage = 100.0
        
        logger.info(f"Completed batch job {job_id}: {job.successful_items}/{job.total_items} successful")
        
    except Exception as e:
        job.status = BatchStatus.FAILED
        job.completed_at = time.time()
        job.errors.append({
            "error": str(e),
            "timestamp": time.time(),
            "type": "job_failure"
        })
        logger.error(f"Batch job {job_id} failed: {e}")
        
    finally:
        if job_id in PROCESSING_JOBS:
            del PROCESSING_JOBS[job_id]


async def _process_nlp_batch(job: BatchJob):
    """Process NLP analysis batch"""
    semaphore = asyncio.Semaphore(job.max_workers)
    
    async def process_item(item, index):
        async with semaphore:
            try:
                # Mock NLP processing
                await asyncio.sleep(0.1)  # Simulate processing time
                
                result = {
                    "index": index,
                    "input": item,
                    "sentiment": {"label": "POSITIVE", "score": 0.85},
                    "entities": [{"text": "example", "label": "ORG"}],
                    "processed_at": time.time()
                }
                
                job.results.append(result)
                job.successful_items += 1
                
            except Exception as e:
                job.errors.append({
                    "index": index,
                    "input": item,
                    "error": str(e),
                    "timestamp": time.time()
                })
                job.failed_items += 1
            
            finally:
                job.processed_items += 1
                job.progress_percentage = (job.processed_items / job.total_items) * 100
    
    # Process all items
    tasks = [process_item(item, i) for i, item in enumerate(job.parameters.get("items", []))]
    await asyncio.gather(*tasks)


async def _process_document_batch(job: BatchJob):
    """Process document classification batch"""
    # Similar to NLP batch but for document classification
    for i, item in enumerate(job.parameters.get("items", [])):
        try:
            # Mock document classification
            result = {
                "index": i,
                "input": item,
                "classification": {"category": "regulatory_circular", "confidence": 0.92},
                "processed_at": time.time()
            }
            job.results.append(result)
            job.successful_items += 1
        except Exception as e:
            job.errors.append({"index": i, "error": str(e), "timestamp": time.time()})
            job.failed_items += 1
        
        job.processed_items += 1
        job.progress_percentage = (job.processed_items / job.total_items) * 100


async def _process_risk_batch(job: BatchJob):
    """Process risk assessment batch"""
    # Mock risk assessment processing
    for i, item in enumerate(job.parameters.get("items", [])):
        try:
            result = {
                "index": i,
                "input": item,
                "risk_score": 0.65,
                "risk_level": "medium",
                "processed_at": time.time()
            }
            job.results.append(result)
            job.successful_items += 1
        except Exception as e:
            job.errors.append({"index": i, "error": str(e), "timestamp": time.time()})
            job.failed_items += 1
        
        job.processed_items += 1
        job.progress_percentage = (job.processed_items / job.total_items) * 100


async def _process_regulatory_batch(job: BatchJob):
    """Process regulatory analysis batch"""
    # Mock regulatory analysis processing
    for i, item in enumerate(job.parameters.get("items", [])):
        try:
            result = {
                "index": i,
                "input": item,
                "regulatory_type": "compliance_guideline",
                "impact_level": "medium",
                "processed_at": time.time()
            }
            job.results.append(result)
            job.successful_items += 1
        except Exception as e:
            job.errors.append({"index": i, "error": str(e), "timestamp": time.time()})
            job.failed_items += 1
        
        job.processed_items += 1
        job.progress_percentage = (job.processed_items / job.total_items) * 100


async def _process_prediction_batch(job: BatchJob):
    """Process bulk prediction batch"""
    # Mock prediction processing
    for i, item in enumerate(job.parameters.get("items", [])):
        try:
            result = {
                "index": i,
                "input": item,
                "prediction": 0.78,
                "confidence": 0.91,
                "processed_at": time.time()
            }
            job.results.append(result)
            job.successful_items += 1
        except Exception as e:
            job.errors.append({"index": i, "error": str(e), "timestamp": time.time()})
            job.failed_items += 1
        
        job.processed_items += 1
        job.progress_percentage = (job.processed_items / job.total_items) * 100
