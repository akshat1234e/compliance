"""
Scheduled Training Service
Automated model retraining based on schedules and performance thresholds
"""

import asyncio
import schedule
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List
import pandas as pd
from threading import Thread

from src.core.logging import api_logger as logger
from src.services.model_training_pipeline import ModelTrainingPipeline


class ScheduledTrainingService:
    """Service for automated model retraining"""
    
    def __init__(self):
        self.training_pipeline = ModelTrainingPipeline()
        self.is_running = False
        self.scheduler_thread = None
        self.training_schedules = {
            'regulatory_classifier': {
                'schedule': 'daily',
                'time': '02:00',
                'enabled': True,
                'last_run': None
            },
            'risk_scorer': {
                'schedule': 'weekly',
                'day': 'sunday',
                'time': '03:00',
                'enabled': True,
                'last_run': None
            },
            'compliance_predictor': {
                'schedule': 'monthly',
                'day': 1,
                'time': '04:00',
                'enabled': True,
                'last_run': None
            }
        }
        
        logger.info("Scheduled Training Service initialized")
    
    def start(self):
        """Start the scheduled training service"""
        if self.is_running:
            logger.warning("Scheduled training service is already running")
            return
        
        logger.info("Starting scheduled training service")
        self.is_running = True
        
        # Set up schedules
        self._setup_schedules()
        
        # Start scheduler in background thread
        self.scheduler_thread = Thread(target=self._run_scheduler, daemon=True)
        self.scheduler_thread.start()
        
        logger.info("Scheduled training service started successfully")
    
    def stop(self):
        """Stop the scheduled training service"""
        if not self.is_running:
            logger.warning("Scheduled training service is not running")
            return
        
        logger.info("Stopping scheduled training service")
        self.is_running = False
        
        # Clear all scheduled jobs
        schedule.clear()
        
        if self.scheduler_thread and self.scheduler_thread.is_alive():
            self.scheduler_thread.join(timeout=5)
        
        logger.info("Scheduled training service stopped")
    
    def _setup_schedules(self):
        """Set up training schedules for all models"""
        for model_name, config in self.training_schedules.items():
            if not config['enabled']:
                continue
            
            if config['schedule'] == 'daily':
                schedule.every().day.at(config['time']).do(
                    self._schedule_model_training, model_name
                )
                logger.info(f"Scheduled daily training for {model_name} at {config['time']}")
            
            elif config['schedule'] == 'weekly':
                day = config['day'].lower()
                if day == 'monday':
                    schedule.every().monday.at(config['time']).do(
                        self._schedule_model_training, model_name
                    )
                elif day == 'tuesday':
                    schedule.every().tuesday.at(config['time']).do(
                        self._schedule_model_training, model_name
                    )
                elif day == 'wednesday':
                    schedule.every().wednesday.at(config['time']).do(
                        self._schedule_model_training, model_name
                    )
                elif day == 'thursday':
                    schedule.every().thursday.at(config['time']).do(
                        self._schedule_model_training, model_name
                    )
                elif day == 'friday':
                    schedule.every().friday.at(config['time']).do(
                        self._schedule_model_training, model_name
                    )
                elif day == 'saturday':
                    schedule.every().saturday.at(config['time']).do(
                        self._schedule_model_training, model_name
                    )
                elif day == 'sunday':
                    schedule.every().sunday.at(config['time']).do(
                        self._schedule_model_training, model_name
                    )
                
                logger.info(f"Scheduled weekly training for {model_name} on {day} at {config['time']}")
            
            elif config['schedule'] == 'monthly':
                # For monthly, we'll check daily and run on the specified day
                schedule.every().day.at(config['time']).do(
                    self._check_monthly_training, model_name, config['day']
                )
                logger.info(f"Scheduled monthly training for {model_name} on day {config['day']} at {config['time']}")
    
    def _run_scheduler(self):
        """Run the scheduler in a background thread"""
        while self.is_running:
            try:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
            except Exception as e:
                logger.error(f"Error in scheduler thread: {e}")
                time.sleep(60)
    
    def _schedule_model_training(self, model_name: str):
        """Schedule training for a specific model"""
        try:
            logger.info(f"Scheduled training triggered for {model_name}")
            
            # Run training in asyncio event loop
            asyncio.create_task(self._train_model_async(model_name))
            
            # Update last run time
            self.training_schedules[model_name]['last_run'] = datetime.now()
            
        except Exception as e:
            logger.error(f"Failed to schedule training for {model_name}: {e}")
    
    def _check_monthly_training(self, model_name: str, target_day: int):
        """Check if monthly training should run today"""
        today = datetime.now()
        if today.day == target_day:
            self._schedule_model_training(model_name)
    
    async def _train_model_async(self, model_name: str):
        """Train model asynchronously"""
        try:
            logger.info(f"Starting scheduled training for {model_name}")
            
            # Generate training data (in production, this would fetch real data)
            training_data = self._generate_training_data(model_name)
            
            # Check if retraining is needed
            needs_retrain = await self.training_pipeline._should_retrain(model_name)
            
            if needs_retrain:
                result = await self.training_pipeline.train_model(
                    model_name, training_data, force_retrain=False
                )
                logger.info(f"Scheduled training completed for {model_name}: {result}")
            else:
                logger.info(f"Model {model_name} does not need retraining")
            
        except Exception as e:
            logger.error(f"Scheduled training failed for {model_name}: {e}")
    
    def _generate_training_data(self, model_name: str) -> pd.DataFrame:
        """Generate or fetch training data for a model"""
        # In production, this would fetch real data from databases
        import numpy as np
        
        np.random.seed(int(time.time()))  # Use current time as seed for variety
        n_samples = 1000
        
        if model_name == 'regulatory_classifier':
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
            data = {
                'revenue': np.random.lognormal(10, 1, n_samples),
                'profit_margin': np.random.beta(2, 5, n_samples),
                'debt_ratio': np.random.beta(2, 3, n_samples),
                'past_violations': np.random.poisson(2, n_samples),
                'compliance_score': np.random.beta(5, 2, n_samples),
                'risk_score': np.random.beta(2, 5, n_samples)
            }
        else:  # compliance_predictor
            data = {
                'recent_changes': np.random.poisson(3, n_samples),
                'impact_score': np.random.beta(3, 3, n_samples),
                'compliance_trend': np.random.beta(4, 2, n_samples),
                'compliance_status': np.random.choice(['compliant', 'non_compliant'], n_samples)
            }
        
        return pd.DataFrame(data)
    
    def get_schedule_status(self) -> Dict[str, Any]:
        """Get status of all scheduled training jobs"""
        status = {
            'service_running': self.is_running,
            'schedules': {},
            'next_runs': []
        }
        
        for model_name, config in self.training_schedules.items():
            status['schedules'][model_name] = {
                **config,
                'last_run': config['last_run'].isoformat() if config['last_run'] else None
            }
        
        # Get next scheduled runs
        for job in schedule.jobs:
            status['next_runs'].append({
                'job': str(job.job_func),
                'next_run': job.next_run.isoformat() if job.next_run else None
            })
        
        return status
    
    def update_schedule(self, model_name: str, new_config: Dict[str, Any]) -> bool:
        """Update schedule configuration for a model"""
        try:
            if model_name not in self.training_schedules:
                logger.error(f"Model {model_name} not found in schedules")
                return False
            
            # Update configuration
            self.training_schedules[model_name].update(new_config)
            
            # Restart scheduler to apply changes
            if self.is_running:
                schedule.clear()
                self._setup_schedules()
            
            logger.info(f"Schedule updated for {model_name}: {new_config}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to update schedule for {model_name}: {e}")
            return False
    
    def trigger_immediate_training(self, model_name: str) -> bool:
        """Trigger immediate training for a model"""
        try:
            if model_name not in self.training_schedules:
                logger.error(f"Model {model_name} not found")
                return False
            
            logger.info(f"Triggering immediate training for {model_name}")
            asyncio.create_task(self._train_model_async(model_name))
            return True
            
        except Exception as e:
            logger.error(f"Failed to trigger immediate training for {model_name}: {e}")
            return False
    
    def enable_schedule(self, model_name: str) -> bool:
        """Enable scheduled training for a model"""
        return self.update_schedule(model_name, {'enabled': True})
    
    def disable_schedule(self, model_name: str) -> bool:
        """Disable scheduled training for a model"""
        return self.update_schedule(model_name, {'enabled': False})


# Global instance
scheduled_training_service = ScheduledTrainingService()
