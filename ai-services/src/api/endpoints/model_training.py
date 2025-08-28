"""
Model Training API Endpoints
RESTful API for model training pipeline management
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, UploadFile, File
from pydantic import BaseModel, Field
import pandas as pd
import io

from src.core.logging import api_logger as logger
from src.services.model_training_pipeline import ModelTrainingPipeline

router = APIRouter()

# Initialize training pipeline
training_pipeline = ModelTrainingPipeline()


class TrainingRequest(BaseModel):
    """Request model for training a specific model"""
    model_name: str = Field(..., description="Name of the model to train")
    force_retrain: bool = Field(default=False, description="Force retraining even if not needed")
    training_data_source: str = Field(default="synthetic", description="Source of training data")


class BatchTrainingRequest(BaseModel):
    """Request model for batch training multiple models"""
    models: List[str] = Field(..., description="List of model names to train")
    force_retrain: bool = Field(default=False, description="Force retraining for all models")


class ModelDeploymentRequest(BaseModel):
    """Request model for deploying a trained model"""
    model_name: str = Field(..., description="Name of the model to deploy")
    deployment_target: str = Field(default="production", description="Deployment target environment")
    auto_rollback: bool = Field(default=True, description="Enable automatic rollback on failure")


@router.get("/status")
async def get_training_status() -> Dict[str, Any]:
    """Get status of all models in the training pipeline"""
    try:
        logger.info("Getting training pipeline status")
        status = await training_pipeline.get_training_status()
        
        return {
            "success": True,
            "data": status,
            "message": "Training status retrieved successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to get training status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get training status: {str(e)}")


@router.get("/models")
async def list_available_models() -> Dict[str, Any]:
    """List all available models and their configurations"""
    try:
        models = {}
        for model_name, config in training_pipeline.model_configs.items():
            model_info = await training_pipeline._get_model_info(model_name)
            models[model_name] = {
                "config": config,
                "status": model_info,
                "needs_retrain": await training_pipeline._should_retrain(model_name)
            }
        
        return {
            "success": True,
            "data": {
                "models": models,
                "total_models": len(models)
            },
            "message": "Available models retrieved successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to list models: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list models: {str(e)}")


@router.get("/models/{model_name}")
async def get_model_info(model_name: str) -> Dict[str, Any]:
    """Get detailed information about a specific model"""
    try:
        if model_name not in training_pipeline.model_configs:
            raise HTTPException(status_code=404, detail=f"Model {model_name} not found")
        
        model_info = await training_pipeline._get_model_info(model_name)
        needs_retrain = await training_pipeline._should_retrain(model_name)
        config = training_pipeline.model_configs[model_name]
        
        return {
            "success": True,
            "data": {
                "model_name": model_name,
                "config": config,
                "status": model_info,
                "needs_retrain": needs_retrain
            },
            "message": f"Model {model_name} information retrieved successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get model info for {model_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get model info: {str(e)}")


@router.post("/train/{model_name}")
async def train_model(
    model_name: str,
    request: TrainingRequest,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """Train a specific model"""
    try:
        if model_name not in training_pipeline.model_configs:
            raise HTTPException(status_code=404, detail=f"Model {model_name} not found")
        
        logger.info(f"Starting training for model: {model_name}")
        
        # Generate synthetic training data for demonstration
        training_data = _generate_synthetic_training_data(model_name)
        
        # Start training in background
        background_tasks.add_task(
            _train_model_background,
            model_name,
            training_data,
            request.force_retrain
        )
        
        return {
            "success": True,
            "data": {
                "model_name": model_name,
                "status": "training_started",
                "force_retrain": request.force_retrain
            },
            "message": f"Training started for model {model_name}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to start training for {model_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start training: {str(e)}")


@router.post("/train/batch")
async def train_multiple_models(
    request: BatchTrainingRequest,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """Train multiple models in batch"""
    try:
        logger.info(f"Starting batch training for models: {request.models}")
        
        # Validate all models exist
        invalid_models = [m for m in request.models if m not in training_pipeline.model_configs]
        if invalid_models:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid models: {invalid_models}"
            )
        
        # Generate training data for all models
        training_data = {}
        for model_name in request.models:
            training_data[model_name] = _generate_synthetic_training_data(model_name)
        
        # Start batch training in background
        background_tasks.add_task(
            _train_batch_background,
            training_data,
            request.force_retrain
        )
        
        return {
            "success": True,
            "data": {
                "models": request.models,
                "status": "batch_training_started",
                "force_retrain": request.force_retrain
            },
            "message": f"Batch training started for {len(request.models)} models"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to start batch training: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start batch training: {str(e)}")


@router.post("/upload-training-data/{model_name}")
async def upload_training_data(
    model_name: str,
    file: UploadFile = File(...),
    auto_train: bool = False
) -> Dict[str, Any]:
    """Upload training data for a specific model"""
    try:
        if model_name not in training_pipeline.model_configs:
            raise HTTPException(status_code=404, detail=f"Model {model_name} not found")
        
        # Validate file type
        if not file.filename.endswith(('.csv', '.xlsx', '.json')):
            raise HTTPException(
                status_code=400, 
                detail="Only CSV, Excel, and JSON files are supported"
            )
        
        # Read file content
        content = await file.read()
        
        # Parse data based on file type
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        elif file.filename.endswith('.xlsx'):
            df = pd.read_excel(io.BytesIO(content))
        elif file.filename.endswith('.json'):
            df = pd.read_json(io.StringIO(content.decode('utf-8')))
        
        # Validate data
        if df.empty:
            raise HTTPException(status_code=400, detail="Uploaded file contains no data")
        
        # Save training data (in production, this would go to a database)
        data_path = training_pipeline.models_dir / model_name / "training_data.csv"
        data_path.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(data_path, index=False)
        
        result = {
            "model_name": model_name,
            "filename": file.filename,
            "rows": len(df),
            "columns": len(df.columns),
            "data_path": str(data_path)
        }
        
        # Auto-train if requested
        if auto_train:
            await training_pipeline.train_model(model_name, df)
            result["training_status"] = "completed"
        
        return {
            "success": True,
            "data": result,
            "message": f"Training data uploaded successfully for {model_name}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to upload training data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload training data: {str(e)}")


@router.post("/deploy/{model_name}")
async def deploy_model(
    model_name: str,
    request: ModelDeploymentRequest
) -> Dict[str, Any]:
    """Deploy a trained model to production"""
    try:
        if model_name not in training_pipeline.model_configs:
            raise HTTPException(status_code=404, detail=f"Model {model_name} not found")
        
        # Check if model exists and is trained
        model_info = await training_pipeline._get_model_info(model_name)
        if model_info['status'] == 'not_found':
            raise HTTPException(
                status_code=400, 
                detail=f"Model {model_name} is not trained yet"
            )
        
        # Load model to verify it works
        model = await training_pipeline.load_model(model_name)
        if model is None:
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to load model {model_name}"
            )
        
        # In production, this would deploy to the specified environment
        deployment_info = {
            "model_name": model_name,
            "deployment_target": request.deployment_target,
            "deployment_time": pd.Timestamp.now().isoformat(),
            "model_version": model_info.get('last_trained', 'unknown'),
            "auto_rollback": request.auto_rollback,
            "status": "deployed"
        }
        
        logger.info(f"Model {model_name} deployed to {request.deployment_target}")
        
        return {
            "success": True,
            "data": deployment_info,
            "message": f"Model {model_name} deployed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to deploy model {model_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to deploy model: {str(e)}")


@router.delete("/models/{model_name}")
async def delete_model(model_name: str) -> Dict[str, Any]:
    """Delete a trained model"""
    try:
        if model_name not in training_pipeline.model_configs:
            raise HTTPException(status_code=404, detail=f"Model {model_name} not found")
        
        # Remove model directory
        model_dir = training_pipeline.models_dir / model_name
        if model_dir.exists():
            import shutil
            shutil.rmtree(model_dir)
            logger.info(f"Model {model_name} deleted successfully")
        
        # Remove from training history
        if model_name in training_pipeline.training_history:
            del training_pipeline.training_history[model_name]
        
        return {
            "success": True,
            "data": {"model_name": model_name, "status": "deleted"},
            "message": f"Model {model_name} deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete model {model_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete model: {str(e)}")


# Background task functions
async def _train_model_background(model_name: str, training_data: pd.DataFrame, force_retrain: bool):
    """Background task for training a single model"""
    try:
        result = await training_pipeline.train_model(model_name, training_data, force_retrain)
        logger.info(f"Background training completed for {model_name}: {result}")
    except Exception as e:
        logger.error(f"Background training failed for {model_name}: {e}")


async def _train_batch_background(training_data: Dict[str, pd.DataFrame], force_retrain: bool):
    """Background task for batch training"""
    try:
        results = await training_pipeline.retrain_all_models(training_data)
        logger.info(f"Background batch training completed: {results}")
    except Exception as e:
        logger.error(f"Background batch training failed: {e}")


def _generate_synthetic_training_data(model_name: str) -> pd.DataFrame:
    """Generate synthetic training data for demonstration"""
    import numpy as np
    
    np.random.seed(42)
    n_samples = 1000
    
    if model_name == 'regulatory_classifier':
        # Generate document classification data
        data = {
            'text_length': np.random.randint(100, 5000, n_samples),
            'paragraph_count': np.random.randint(1, 50, n_samples),
            'header_count': np.random.randint(0, 10, n_samples),
            'document_category': np.random.choice(
                ['rbi_circular', 'compliance_guideline', 'risk_management', 'policy_document'], 
                n_samples
            )
        }
    elif model_name == 'risk_scorer':
        # Generate risk scoring data
        data = {
            'revenue': np.random.lognormal(10, 1, n_samples),
            'profit_margin': np.random.beta(2, 5, n_samples),
            'debt_ratio': np.random.beta(2, 3, n_samples),
            'past_violations': np.random.poisson(2, n_samples),
            'compliance_score': np.random.beta(5, 2, n_samples),
            'risk_score': np.random.beta(2, 5, n_samples)
        }
    else:
        # Generate compliance prediction data
        data = {
            'recent_changes': np.random.poisson(3, n_samples),
            'impact_score': np.random.beta(3, 3, n_samples),
            'compliance_trend': np.random.beta(4, 2, n_samples),
            'compliance_status': np.random.choice(['compliant', 'non_compliant'], n_samples)
        }
    
    return pd.DataFrame(data)
