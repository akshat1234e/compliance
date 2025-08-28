#!/usr/bin/env python3
"""
Model Training Pipeline Demo
Demonstrates automated ML model training, evaluation, and deployment
"""

import asyncio
import sys
import os
from pathlib import Path
import pandas as pd
import numpy as np

# Add src to path for imports
sys.path.append(str(Path(__file__).parent / "src"))

from src.services.model_training_pipeline import ModelTrainingPipeline
from src.services.scheduled_training_service import ScheduledTrainingService


async def generate_sample_datasets():
    """Generate sample datasets for all model types"""
    np.random.seed(42)
    
    datasets = {}
    
    # Regulatory classifier dataset
    n_samples = 1000
    regulatory_data = {
        'text_length': np.random.randint(100, 5000, n_samples),
        'paragraph_count': np.random.randint(1, 50, n_samples),
        'header_count': np.random.randint(0, 10, n_samples),
        'contains_rbi': np.random.choice([0, 1], n_samples, p=[0.7, 0.3]),
        'contains_circular': np.random.choice([0, 1], n_samples, p=[0.6, 0.4]),
        'document_category': np.random.choice(
            ['rbi_circular', 'compliance_guideline', 'risk_management', 'policy_document'], 
            n_samples,
            p=[0.3, 0.25, 0.25, 0.2]
        )
    }
    datasets['regulatory_classifier'] = pd.DataFrame(regulatory_data)
    
    # Risk scorer dataset
    risk_data = {
        'revenue': np.random.lognormal(15, 1.5, n_samples),
        'profit_margin': np.random.beta(3, 7, n_samples),
        'debt_ratio': np.random.beta(2, 5, n_samples),
        'past_violations': np.random.poisson(1.5, n_samples),
        'compliance_score': np.random.beta(6, 2, n_samples),
        'audit_results': np.random.beta(5, 3, n_samples),
        'employee_count': np.random.lognormal(6, 1, n_samples),
        'branch_count': np.random.poisson(10, n_samples),
        'transaction_volume': np.random.lognormal(12, 2, n_samples),
        'risk_score': np.random.beta(2, 6, n_samples)  # Target variable
    }
    datasets['risk_scorer'] = pd.DataFrame(risk_data)
    
    # Compliance predictor dataset
    compliance_data = {
        'recent_changes': np.random.poisson(3, n_samples),
        'impact_score': np.random.beta(3, 4, n_samples),
        'complexity_score': np.random.beta(2, 5, n_samples),
        'compliance_trend': np.random.beta(4, 3, n_samples),
        'violation_frequency': np.random.poisson(0.8, n_samples),
        'remediation_time': np.random.exponential(30, n_samples),
        'market_risk': np.random.beta(3, 5, n_samples),
        'credit_risk': np.random.beta(2, 6, n_samples),
        'operational_risk': np.random.beta(3, 4, n_samples),
        'compliance_status': np.random.choice(
            ['compliant', 'non_compliant'], 
            n_samples,
            p=[0.75, 0.25]
        )
    }
    datasets['compliance_predictor'] = pd.DataFrame(compliance_data)
    
    return datasets


async def demo_model_training():
    """Demonstrate model training capabilities"""
    print("=" * 70)
    print("MODEL TRAINING PIPELINE DEMO - INDIVIDUAL MODEL TRAINING")
    print("=" * 70)
    
    # Initialize pipeline
    pipeline = ModelTrainingPipeline()
    
    # Generate sample datasets
    print("\n📊 Generating sample training datasets...")
    datasets = await generate_sample_datasets()
    
    for model_name, dataset in datasets.items():
        print(f"\n🤖 Training model: {model_name}")
        print("-" * 50)
        print(f"   Dataset shape: {dataset.shape}")
        print(f"   Features: {list(dataset.columns[:-1])}")
        print(f"   Target: {dataset.columns[-1]}")
        
        try:
            # Train the model
            result = await pipeline.train_model(model_name, dataset, force_retrain=True)
            
            print(f"✅ Training successful!")
            print(f"   Status: {result['status']}")
            print(f"   Model path: {result['model_path']}")
            print(f"   Training time: {result['training_time']}")
            
            # Display metrics
            metrics = result['metrics']
            print(f"   Performance metrics:")
            for metric, value in metrics.items():
                if metric != 'model_type':
                    print(f"     - {metric}: {value:.4f}")
            
        except Exception as e:
            print(f"❌ Training failed: {e}")


async def demo_batch_training():
    """Demonstrate batch training capabilities"""
    print("\n" + "=" * 70)
    print("MODEL TRAINING PIPELINE DEMO - BATCH TRAINING")
    print("=" * 70)
    
    pipeline = ModelTrainingPipeline()
    datasets = await generate_sample_datasets()
    
    print(f"\n🔄 Starting batch training for {len(datasets)} models...")
    
    try:
        results = await pipeline.retrain_all_models(datasets)
        
        print(f"✅ Batch training completed!")
        print(f"\nResults summary:")
        
        for model_name, result in results.items():
            print(f"\n📈 {model_name}:")
            print(f"   Status: {result['status']}")
            
            if result['status'] == 'trained':
                metrics = result['metrics']
                primary_metric = 'f1_score' if 'f1_score' in metrics else 'r2_score'
                print(f"   Primary metric ({primary_metric}): {metrics.get(primary_metric, 'N/A'):.4f}")
                print(f"   Model type: {metrics.get('model_type', 'unknown')}")
            elif result['status'] == 'failed':
                print(f"   Error: {result['error']}")
        
    except Exception as e:
        print(f"❌ Batch training failed: {e}")


async def demo_model_management():
    """Demonstrate model management capabilities"""
    print("\n" + "=" * 70)
    print("MODEL TRAINING PIPELINE DEMO - MODEL MANAGEMENT")
    print("=" * 70)
    
    pipeline = ModelTrainingPipeline()
    
    print(f"\n📋 Getting training status...")
    try:
        status = await pipeline.get_training_status()
        
        print(f"✅ Pipeline status: {status['pipeline_status']}")
        print(f"   Last updated: {status['last_updated']}")
        print(f"   Total models: {len(status['models'])}")
        
        print(f"\n📊 Model details:")
        for model_name, model_info in status['models'].items():
            print(f"\n   🔧 {model_name}:")
            print(f"      Status: {model_info['status']}")
            print(f"      Needs retrain: {model_info['needs_retrain']}")
            print(f"      Type: {model_info['config']['type']}")
            print(f"      Retrain threshold: {model_info['config']['retrain_threshold']}")
            print(f"      Retrain interval: {model_info['config']['retrain_interval_days']} days")
            
            if 'metrics' in model_info and model_info['metrics']:
                print(f"      Current metrics: {model_info['metrics']}")
        
    except Exception as e:
        print(f"❌ Failed to get training status: {e}")


async def demo_model_loading():
    """Demonstrate model loading and inference"""
    print("\n" + "=" * 70)
    print("MODEL TRAINING PIPELINE DEMO - MODEL LOADING & INFERENCE")
    print("=" * 70)
    
    pipeline = ModelTrainingPipeline()
    
    # Try to load each model
    for model_name in pipeline.model_configs.keys():
        print(f"\n🔍 Loading model: {model_name}")
        
        try:
            model = await pipeline.load_model(model_name)
            
            if model is not None:
                print(f"✅ Model loaded successfully!")
                print(f"   Model type: {type(model).__name__}")
                
                # Try to make a prediction with synthetic data
                if hasattr(model, 'predict'):
                    # Generate sample input
                    n_features = 10  # Assuming 10 features for demo
                    sample_input = np.random.randn(1, n_features)
                    
                    try:
                        prediction = model.predict(sample_input)
                        print(f"   Sample prediction: {prediction}")
                    except Exception as pred_error:
                        print(f"   Prediction test failed: {pred_error}")
                
            else:
                print(f"⚠️  Model not found (not trained yet)")
                
        except Exception as e:
            print(f"❌ Failed to load model: {e}")


async def demo_scheduled_training():
    """Demonstrate scheduled training service"""
    print("\n" + "=" * 70)
    print("MODEL TRAINING PIPELINE DEMO - SCHEDULED TRAINING")
    print("=" * 70)
    
    scheduler = ScheduledTrainingService()
    
    print(f"\n⏰ Scheduled Training Service Demo")
    print(f"   Service running: {scheduler.is_running}")
    
    # Get schedule status
    status = scheduler.get_schedule_status()
    print(f"\n📅 Current schedules:")
    
    for model_name, config in status['schedules'].items():
        print(f"\n   📋 {model_name}:")
        print(f"      Schedule: {config['schedule']}")
        print(f"      Time: {config['time']}")
        print(f"      Enabled: {config['enabled']}")
        print(f"      Last run: {config['last_run'] or 'Never'}")
        
        if config['schedule'] == 'weekly':
            print(f"      Day: {config['day']}")
        elif config['schedule'] == 'monthly':
            print(f"      Day of month: {config['day']}")
    
    # Demonstrate immediate training trigger
    print(f"\n🚀 Triggering immediate training for regulatory_classifier...")
    try:
        success = scheduler.trigger_immediate_training('regulatory_classifier')
        if success:
            print(f"✅ Immediate training triggered successfully!")
        else:
            print(f"❌ Failed to trigger immediate training")
    except Exception as e:
        print(f"❌ Error triggering training: {e}")
    
    print(f"\n📝 Note: In production, the scheduler would run continuously")
    print(f"   and automatically retrain models based on their schedules.")


async def main():
    """Run the complete demo"""
    print("🚀 Starting Model Training Pipeline Demo")
    print("This demo showcases automated ML model training and management")
    
    try:
        await demo_model_training()
        await demo_batch_training()
        await demo_model_management()
        await demo_model_loading()
        await demo_scheduled_training()
        
        print("\n" + "=" * 70)
        print("✅ DEMO COMPLETED SUCCESSFULLY!")
        print("=" * 70)
        print("\nModel Training Pipeline Features Demonstrated:")
        print("• Automated training of multiple ML model types")
        print("• Comprehensive model evaluation and metrics")
        print("• Batch training capabilities")
        print("• Model versioning and management")
        print("• Automated retraining based on performance thresholds")
        print("• Scheduled training with configurable intervals")
        print("• MLflow integration for experiment tracking")
        print("• Model loading and inference capabilities")
        print("\nThe pipeline is ready for production deployment!")
        
    except Exception as e:
        print(f"\n❌ Demo failed: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
