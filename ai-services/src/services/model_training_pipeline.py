"""
Model Training Pipeline
Automated ML model training, evaluation, and deployment pipeline
"""

import os
import json
import asyncio
import pickle
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
import mlflow
import mlflow.sklearn
import mlflow.tensorflow
from tensorflow import keras
import joblib

from src.core.logging import api_logger as logger
from src.core.config import settings


class ModelTrainingPipeline:
    """Automated model training and deployment pipeline"""

    def __init__(self):
        self.models_dir = Path(settings.MODEL_CACHE_DIR)
        self.models_dir.mkdir(parents=True, exist_ok=True)

        # MLflow configuration
        mlflow.set_tracking_uri(getattr(settings, 'MLFLOW_TRACKING_URI', 'http://localhost:5000'))
        mlflow.set_experiment(getattr(settings, 'MLFLOW_EXPERIMENT_NAME', 'compliance_ai'))

        # Model configurations
        self.model_configs = {
            'regulatory_classifier': {
                'type': 'classification',
                'target': 'document_category',
                'features': ['text_features', 'structural_features'],
                'models': ['random_forest', 'gradient_boosting', 'logistic_regression'],
                'retrain_threshold': 0.85,
                'retrain_interval_days': 7
            },
            'risk_scorer': {
                'type': 'regression',
                'target': 'risk_score',
                'features': ['financial_metrics', 'compliance_history', 'operational_metrics'],
                'models': ['random_forest', 'gradient_boosting', 'neural_network'],
                'retrain_threshold': 0.80,
                'retrain_interval_days': 14
            },
            'compliance_predictor': {
                'type': 'classification',
                'target': 'compliance_status',
                'features': ['regulatory_changes', 'historical_compliance', 'risk_factors'],
                'models': ['gradient_boosting', 'neural_network'],
                'retrain_threshold': 0.88,
                'retrain_interval_days': 30
            }
        }

        self.training_history = {}
        logger.info("Model Training Pipeline initialized")

    async def train_model(self, model_name: str, training_data: pd.DataFrame,
                         force_retrain: bool = False) -> Dict[str, Any]:
        """Train a specific model with given data"""
        try:
            if model_name not in self.model_configs:
                raise ValueError(f"Unknown model: {model_name}")

            config = self.model_configs[model_name]

            # Check if retraining is needed
            if not force_retrain and not await self._should_retrain(model_name):
                logger.info(f"Model {model_name} does not need retraining")
                return await self._get_model_info(model_name)

            logger.info(f"Starting training for model: {model_name}")

            with mlflow.start_run(run_name=f"{model_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"):
                # Log parameters
                mlflow.log_params({
                    'model_name': model_name,
                    'model_type': config['type'],
                    'training_samples': len(training_data),
                    'features': config['features']
                })

                # Prepare data
                X, y = await self._prepare_training_data(training_data, config)
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=0.2, random_state=42, stratify=y if config['type'] == 'classification' else None
                )

                # Train multiple models and select best
                best_model, best_metrics = await self._train_and_evaluate_models(
                    model_name, config, X_train, X_test, y_train, y_test
                )

                # Save model
                model_path = await self._save_model(model_name, best_model, best_metrics)

                # Log metrics
                mlflow.log_metrics(best_metrics)
                mlflow.log_artifact(model_path)

                # Update training history
                self.training_history[model_name] = {
                    'last_trained': datetime.now(),
                    'metrics': best_metrics,
                    'model_path': str(model_path),
                    'training_samples': len(training_data)
                }

                logger.info(f"Model {model_name} trained successfully with {best_metrics}")

                return {
                    'model_name': model_name,
                    'status': 'trained',
                    'metrics': best_metrics,
                    'model_path': str(model_path),
                    'training_time': datetime.now().isoformat()
                }

        except Exception as e:
            logger.error(f"Failed to train model {model_name}: {e}")
            raise

    async def _prepare_training_data(self, data: pd.DataFrame, config: Dict[str, Any]) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare training data based on model configuration"""
        try:
            # Extract features based on configuration
            feature_columns = []
            for feature_group in config['features']:
                if feature_group == 'text_features':
                    # Mock text feature extraction
                    feature_columns.extend([f'text_feature_{i}' for i in range(10)])
                elif feature_group == 'structural_features':
                    feature_columns.extend(['doc_length', 'paragraph_count', 'header_count'])
                elif feature_group == 'financial_metrics':
                    feature_columns.extend(['revenue', 'profit_margin', 'debt_ratio'])
                elif feature_group == 'compliance_history':
                    feature_columns.extend(['past_violations', 'compliance_score', 'audit_results'])
                elif feature_group == 'operational_metrics':
                    feature_columns.extend(['employee_count', 'branch_count', 'transaction_volume'])
                elif feature_group == 'regulatory_changes':
                    feature_columns.extend(['recent_changes', 'impact_score', 'complexity_score'])
                elif feature_group == 'historical_compliance':
                    feature_columns.extend(['compliance_trend', 'violation_frequency', 'remediation_time'])
                elif feature_group == 'risk_factors':
                    feature_columns.extend(['market_risk', 'credit_risk', 'operational_risk'])

            # Generate synthetic features if not present
            X = self._generate_synthetic_features(data, feature_columns)

            # Extract target variable
            if config['target'] in data.columns:
                y = data[config['target']].values
            else:
                # Generate synthetic target
                y = self._generate_synthetic_target(len(data), config['type'])

            # Encode categorical targets
            if config['type'] == 'classification' and y.dtype == 'object':
                le = LabelEncoder()
                y = le.fit_transform(y)
                # Save label encoder
                joblib.dump(le, self.models_dir / f"{config['target']}_label_encoder.pkl")

            return X, y

        except Exception as e:
            logger.error(f"Failed to prepare training data: {e}")
            raise

    def _generate_synthetic_features(self, data: pd.DataFrame, feature_columns: List[str]) -> np.ndarray:
        """Generate synthetic features for demonstration"""
        n_samples = len(data)
        n_features = len(feature_columns)

        # Generate realistic synthetic data
        np.random.seed(42)
        X = np.random.randn(n_samples, n_features)

        # Add some correlation structure
        for i in range(1, n_features):
            X[:, i] = 0.7 * X[:, i-1] + 0.3 * X[:, i]

        # Normalize features
        scaler = StandardScaler()
        X = scaler.fit_transform(X)

        return X

    def _generate_synthetic_target(self, n_samples: int, target_type: str) -> np.ndarray:
        """Generate synthetic target variable"""
        np.random.seed(42)

        if target_type == 'classification':
            # Generate categorical target (e.g., document categories)
            categories = ['rbi_circular', 'compliance_guideline', 'risk_management', 'policy_document']
            return np.random.choice(categories, n_samples)
        else:
            # Generate continuous target (e.g., risk scores)
            return np.random.beta(2, 5, n_samples)  # Skewed distribution between 0 and 1

    async def _train_and_evaluate_models(self, model_name: str, config: Dict[str, Any],
                                       X_train: np.ndarray, X_test: np.ndarray,
                                       y_train: np.ndarray, y_test: np.ndarray) -> Tuple[Any, Dict[str, float]]:
        """Train multiple models and return the best one"""
        best_model = None
        best_score = -np.inf
        best_metrics = {}

        for model_type in config['models']:
            logger.info(f"Training {model_type} for {model_name}")

            # Create model
            model = self._create_model(model_type, config['type'])

            # Train model
            if model_type == 'neural_network':
                model = await self._train_neural_network(model, X_train, y_train, X_test, y_test, config['type'])
            else:
                model.fit(X_train, y_train)

            # Evaluate model
            metrics = await self._evaluate_model(model, X_test, y_test, config['type'], model_type)

            # Select best model based on primary metric
            primary_metric = 'f1_score' if config['type'] == 'classification' else 'r2_score'
            if metrics.get(primary_metric, -np.inf) > best_score:
                best_score = metrics[primary_metric]
                best_model = model
                best_metrics = metrics
                best_metrics['model_type'] = model_type

        return best_model, best_metrics

    def _create_model(self, model_type: str, task_type: str) -> Any:
        """Create a model instance based on type"""
        if model_type == 'random_forest':
            if task_type == 'classification':
                return RandomForestClassifier(n_estimators=100, random_state=42)
            else:
                from sklearn.ensemble import RandomForestRegressor
                return RandomForestRegressor(n_estimators=100, random_state=42)

        elif model_type == 'gradient_boosting':
            if task_type == 'classification':
                return GradientBoostingClassifier(n_estimators=100, random_state=42)
            else:
                from sklearn.ensemble import GradientBoostingRegressor
                return GradientBoostingRegressor(n_estimators=100, random_state=42)

        elif model_type == 'logistic_regression':
            return LogisticRegression(random_state=42, max_iter=1000)

        elif model_type == 'neural_network':
            return self._create_neural_network(task_type)

        else:
            raise ValueError(f"Unknown model type: {model_type}")

    def _create_neural_network(self, task_type: str) -> keras.Model:
        """Create a neural network model"""
        model = keras.Sequential([
            keras.layers.Dense(128, activation='relu', input_shape=(None,)),
            keras.layers.Dropout(0.3),
            keras.layers.Dense(64, activation='relu'),
            keras.layers.Dropout(0.2),
            keras.layers.Dense(32, activation='relu'),
        ])

        if task_type == 'classification':
            model.add(keras.layers.Dense(4, activation='softmax'))  # 4 classes
            model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])
        else:
            model.add(keras.layers.Dense(1, activation='sigmoid'))
            model.compile(optimizer='adam', loss='mse', metrics=['mae'])

        return model

    async def _train_neural_network(self, model: keras.Model, X_train: np.ndarray, y_train: np.ndarray,
                                  X_test: np.ndarray, y_test: np.ndarray, task_type: str) -> keras.Model:
        """Train neural network with early stopping"""
        early_stopping = keras.callbacks.EarlyStopping(
            monitor='val_loss', patience=10, restore_best_weights=True
        )

        # Reshape input for the first layer
        input_shape = X_train.shape[1]
        model.layers[0] = keras.layers.Dense(128, activation='relu', input_shape=(input_shape,))
        model.build((None, input_shape))

        # Recompile after rebuilding
        if task_type == 'classification':
            model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])
        else:
            model.compile(optimizer='adam', loss='mse', metrics=['mae'])

        # Train model
        history = model.fit(
            X_train, y_train,
            epochs=100,
            batch_size=32,
            validation_data=(X_test, y_test),
            callbacks=[early_stopping],
            verbose=0
        )

        return model

    async def _evaluate_model(self, model: Any, X_test: np.ndarray, y_test: np.ndarray,
                            task_type: str, model_type: str) -> Dict[str, float]:
        """Evaluate model performance"""
        try:
            if task_type == 'classification':
                if model_type == 'neural_network':
                    y_pred_proba = model.predict(X_test)
                    y_pred = np.argmax(y_pred_proba, axis=1)
                else:
                    y_pred = model.predict(X_test)
                    y_pred_proba = model.predict_proba(X_test) if hasattr(model, 'predict_proba') else None

                metrics = {
                    'accuracy': accuracy_score(y_test, y_pred),
                    'precision': precision_score(y_test, y_pred, average='weighted', zero_division=0),
                    'recall': recall_score(y_test, y_pred, average='weighted', zero_division=0),
                    'f1_score': f1_score(y_test, y_pred, average='weighted', zero_division=0)
                }

                # Add AUC for binary classification
                if len(np.unique(y_test)) == 2 and y_pred_proba is not None:
                    if model_type == 'neural_network':
                        metrics['auc'] = roc_auc_score(y_test, y_pred_proba[:, 1])
                    else:
                        metrics['auc'] = roc_auc_score(y_test, y_pred_proba[:, 1])

            else:  # regression
                if model_type == 'neural_network':
                    y_pred = model.predict(X_test).flatten()
                else:
                    y_pred = model.predict(X_test)

                from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

                metrics = {
                    'mse': mean_squared_error(y_test, y_pred),
                    'mae': mean_absolute_error(y_test, y_pred),
                    'r2_score': r2_score(y_test, y_pred),
                    'rmse': np.sqrt(mean_squared_error(y_test, y_pred))
                }

            return metrics

        except Exception as e:
            logger.error(f"Failed to evaluate model: {e}")
            return {}

    async def _save_model(self, model_name: str, model: Any, metrics: Dict[str, float]) -> Path:
        """Save trained model to disk"""
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            model_dir = self.models_dir / model_name / timestamp
            model_dir.mkdir(parents=True, exist_ok=True)

            # Save model
            if hasattr(model, 'save'):  # Keras model
                model_path = model_dir / 'model.h5'
                model.save(str(model_path))
                mlflow.tensorflow.log_model(model, f"{model_name}_model")
            else:  # Scikit-learn model
                model_path = model_dir / 'model.pkl'
                joblib.dump(model, model_path)
                mlflow.sklearn.log_model(model, f"{model_name}_model")

            # Save metadata
            metadata = {
                'model_name': model_name,
                'timestamp': timestamp,
                'metrics': metrics,
                'model_type': metrics.get('model_type', 'unknown')
            }

            metadata_path = model_dir / 'metadata.json'
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)

            # Create symlink to latest
            latest_path = self.models_dir / model_name / 'latest'
            if latest_path.exists():
                latest_path.unlink()
            latest_path.symlink_to(timestamp)

            logger.info(f"Model saved to {model_path}")
            return model_path

        except Exception as e:
            logger.error(f"Failed to save model: {e}")
            raise

    async def _should_retrain(self, model_name: str) -> bool:
        """Check if model should be retrained"""
        try:
            config = self.model_configs[model_name]

            # Check if model exists
            latest_path = self.models_dir / model_name / 'latest'
            if not latest_path.exists():
                logger.info(f"No existing model found for {model_name}, training required")
                return True

            # Check training history
            if model_name not in self.training_history:
                return True

            history = self.training_history[model_name]

            # Check time-based retraining
            last_trained = history['last_trained']
            retrain_interval = timedelta(days=config['retrain_interval_days'])
            if datetime.now() - last_trained > retrain_interval:
                logger.info(f"Model {model_name} needs retraining due to time interval")
                return True

            # Check performance-based retraining
            current_metrics = history['metrics']
            primary_metric = 'f1_score' if config['type'] == 'classification' else 'r2_score'
            if current_metrics.get(primary_metric, 0) < config['retrain_threshold']:
                logger.info(f"Model {model_name} needs retraining due to performance degradation")
                return True

            return False

        except Exception as e:
            logger.error(f"Failed to check retraining status: {e}")
            return True

    async def _get_model_info(self, model_name: str) -> Dict[str, Any]:
        """Get information about existing model"""
        try:
            latest_path = self.models_dir / model_name / 'latest'
            if not latest_path.exists():
                return {'status': 'not_found'}

            metadata_path = latest_path / 'metadata.json'
            if metadata_path.exists():
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
                return {
                    'status': 'exists',
                    'model_name': model_name,
                    'last_trained': metadata['timestamp'],
                    'metrics': metadata['metrics']
                }

            return {'status': 'exists', 'model_name': model_name}

        except Exception as e:
            logger.error(f"Failed to get model info: {e}")
            return {'status': 'error', 'error': str(e)}

    async def load_model(self, model_name: str) -> Optional[Any]:
        """Load trained model from disk"""
        try:
            latest_path = self.models_dir / model_name / 'latest'
            if not latest_path.exists():
                logger.warning(f"No model found for {model_name}")
                return None

            # Try to load Keras model first
            h5_path = latest_path / 'model.h5'
            if h5_path.exists():
                return keras.models.load_model(str(h5_path))

            # Try to load scikit-learn model
            pkl_path = latest_path / 'model.pkl'
            if pkl_path.exists():
                return joblib.load(pkl_path)

            logger.warning(f"No valid model file found for {model_name}")
            return None

        except Exception as e:
            logger.error(f"Failed to load model {model_name}: {e}")
            return None

    async def get_training_status(self) -> Dict[str, Any]:
        """Get status of all models"""
        status = {
            'pipeline_status': 'active',
            'models': {},
            'last_updated': datetime.now().isoformat()
        }

        for model_name in self.model_configs:
            model_info = await self._get_model_info(model_name)
            needs_retrain = await self._should_retrain(model_name)

            status['models'][model_name] = {
                **model_info,
                'needs_retrain': needs_retrain,
                'config': self.model_configs[model_name]
            }

        return status

    async def retrain_all_models(self, training_data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
        """Retrain all models that need retraining"""
        results = {}

        for model_name in self.model_configs:
            if model_name in training_data:
                try:
                    result = await self.train_model(model_name, training_data[model_name], force_retrain=True)
                    results[model_name] = result
                except Exception as e:
                    results[model_name] = {'status': 'failed', 'error': str(e)}
            else:
                logger.warning(f"No training data provided for {model_name}")
                results[model_name] = {'status': 'skipped', 'reason': 'no_data'}

        return results
