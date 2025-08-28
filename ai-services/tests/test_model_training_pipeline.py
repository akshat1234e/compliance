"""
Tests for Model Training Pipeline
"""

import pytest
import asyncio
import tempfile
import shutil
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier

from src.services.model_training_pipeline import ModelTrainingPipeline


@pytest.fixture
def temp_models_dir():
    """Create temporary directory for models"""
    temp_dir = tempfile.mkdtemp()
    yield Path(temp_dir)
    shutil.rmtree(temp_dir)


@pytest.fixture
def training_pipeline(temp_models_dir):
    """Create ModelTrainingPipeline instance with temporary directory"""
    with patch('src.services.model_training_pipeline.settings') as mock_settings:
        mock_settings.MODEL_CACHE_DIR = str(temp_models_dir)
        pipeline = ModelTrainingPipeline()
        pipeline.models_dir = temp_models_dir
        return pipeline


@pytest.fixture
def sample_classification_data():
    """Generate sample classification data"""
    np.random.seed(42)
    n_samples = 100
    
    data = {
        'text_length': np.random.randint(100, 5000, n_samples),
        'paragraph_count': np.random.randint(1, 50, n_samples),
        'header_count': np.random.randint(0, 10, n_samples),
        'document_category': np.random.choice(
            ['rbi_circular', 'compliance_guideline', 'risk_management', 'policy_document'], 
            n_samples
        )
    }
    return pd.DataFrame(data)


@pytest.fixture
def sample_regression_data():
    """Generate sample regression data"""
    np.random.seed(42)
    n_samples = 100
    
    data = {
        'revenue': np.random.lognormal(10, 1, n_samples),
        'profit_margin': np.random.beta(2, 5, n_samples),
        'debt_ratio': np.random.beta(2, 3, n_samples),
        'risk_score': np.random.beta(2, 5, n_samples)
    }
    return pd.DataFrame(data)


class TestModelTrainingPipeline:
    """Test cases for ModelTrainingPipeline"""
    
    def test_initialization(self, training_pipeline):
        """Test pipeline initialization"""
        assert training_pipeline is not None
        assert 'regulatory_classifier' in training_pipeline.model_configs
        assert 'risk_scorer' in training_pipeline.model_configs
        assert 'compliance_predictor' in training_pipeline.model_configs
        assert training_pipeline.models_dir.exists()
    
    @pytest.mark.asyncio
    async def test_prepare_training_data_classification(self, training_pipeline, sample_classification_data):
        """Test data preparation for classification"""
        config = training_pipeline.model_configs['regulatory_classifier']
        
        X, y = await training_pipeline._prepare_training_data(sample_classification_data, config)
        
        assert X.shape[0] == len(sample_classification_data)
        assert X.shape[1] > 0  # Should have features
        assert len(y) == len(sample_classification_data)
        assert y.dtype in [np.int32, np.int64]  # Should be encoded
    
    @pytest.mark.asyncio
    async def test_prepare_training_data_regression(self, training_pipeline, sample_regression_data):
        """Test data preparation for regression"""
        config = training_pipeline.model_configs['risk_scorer']
        
        X, y = await training_pipeline._prepare_training_data(sample_regression_data, config)
        
        assert X.shape[0] == len(sample_regression_data)
        assert X.shape[1] > 0
        assert len(y) == len(sample_regression_data)
        assert y.dtype in [np.float32, np.float64]
    
    def test_generate_synthetic_features(self, training_pipeline):
        """Test synthetic feature generation"""
        data = pd.DataFrame({'dummy': range(50)})
        feature_columns = ['feature_1', 'feature_2', 'feature_3']
        
        X = training_pipeline._generate_synthetic_features(data, feature_columns)
        
        assert X.shape == (50, 3)
        assert not np.isnan(X).any()
    
    def test_generate_synthetic_target(self, training_pipeline):
        """Test synthetic target generation"""
        # Test classification target
        y_class = training_pipeline._generate_synthetic_target(100, 'classification')
        assert len(y_class) == 100
        assert y_class.dtype == '<U18'  # String type
        
        # Test regression target
        y_reg = training_pipeline._generate_synthetic_target(100, 'regression')
        assert len(y_reg) == 100
        assert y_reg.dtype in [np.float32, np.float64]
        assert np.all((y_reg >= 0) & (y_reg <= 1))  # Beta distribution range
    
    def test_create_model_random_forest_classification(self, training_pipeline):
        """Test random forest classifier creation"""
        model = training_pipeline._create_model('random_forest', 'classification')
        assert isinstance(model, RandomForestClassifier)
        assert model.n_estimators == 100
        assert model.random_state == 42
    
    def test_create_model_random_forest_regression(self, training_pipeline):
        """Test random forest regressor creation"""
        from sklearn.ensemble import RandomForestRegressor
        model = training_pipeline._create_model('random_forest', 'regression')
        assert isinstance(model, RandomForestRegressor)
    
    def test_create_model_gradient_boosting(self, training_pipeline):
        """Test gradient boosting model creation"""
        from sklearn.ensemble import GradientBoostingClassifier
        model = training_pipeline._create_model('gradient_boosting', 'classification')
        assert isinstance(model, GradientBoostingClassifier)
    
    def test_create_model_logistic_regression(self, training_pipeline):
        """Test logistic regression model creation"""
        from sklearn.linear_model import LogisticRegression
        model = training_pipeline._create_model('logistic_regression', 'classification')
        assert isinstance(model, LogisticRegression)
    
    def test_create_neural_network(self, training_pipeline):
        """Test neural network creation"""
        # Test classification network
        model_class = training_pipeline._create_neural_network('classification')
        assert model_class.layers[-1].units == 4  # 4 classes
        assert model_class.layers[-1].activation.__name__ == 'softmax'
        
        # Test regression network
        model_reg = training_pipeline._create_neural_network('regression')
        assert model_reg.layers[-1].units == 1
        assert model_reg.layers[-1].activation.__name__ == 'sigmoid'
    
    @pytest.mark.asyncio
    async def test_evaluate_model_classification(self, training_pipeline):
        """Test model evaluation for classification"""
        # Create simple mock data
        X_test = np.random.randn(50, 5)
        y_test = np.random.randint(0, 4, 50)
        
        # Create and train a simple model
        model = RandomForestClassifier(n_estimators=10, random_state=42)
        model.fit(X_test, y_test)  # Simple fit for testing
        
        metrics = await training_pipeline._evaluate_model(
            model, X_test, y_test, 'classification', 'random_forest'
        )
        
        assert 'accuracy' in metrics
        assert 'precision' in metrics
        assert 'recall' in metrics
        assert 'f1_score' in metrics
        assert all(0 <= v <= 1 for v in metrics.values())
    
    @pytest.mark.asyncio
    async def test_evaluate_model_regression(self, training_pipeline):
        """Test model evaluation for regression"""
        from sklearn.ensemble import RandomForestRegressor
        
        X_test = np.random.randn(50, 5)
        y_test = np.random.rand(50)
        
        model = RandomForestRegressor(n_estimators=10, random_state=42)
        model.fit(X_test, y_test)
        
        metrics = await training_pipeline._evaluate_model(
            model, X_test, y_test, 'regression', 'random_forest'
        )
        
        assert 'mse' in metrics
        assert 'mae' in metrics
        assert 'r2_score' in metrics
        assert 'rmse' in metrics
        assert metrics['mse'] >= 0
        assert metrics['mae'] >= 0
        assert metrics['rmse'] >= 0
    
    @pytest.mark.asyncio
    async def test_should_retrain_no_model(self, training_pipeline):
        """Test retraining check when no model exists"""
        should_retrain = await training_pipeline._should_retrain('regulatory_classifier')
        assert should_retrain is True
    
    @pytest.mark.asyncio
    async def test_get_model_info_not_found(self, training_pipeline):
        """Test getting info for non-existent model"""
        info = await training_pipeline._get_model_info('nonexistent_model')
        assert info['status'] == 'not_found'
    
    @pytest.mark.asyncio
    async def test_load_model_not_found(self, training_pipeline):
        """Test loading non-existent model"""
        model = await training_pipeline.load_model('nonexistent_model')
        assert model is None
    
    @pytest.mark.asyncio
    async def test_get_training_status(self, training_pipeline):
        """Test getting training status"""
        status = await training_pipeline.get_training_status()
        
        assert 'pipeline_status' in status
        assert 'models' in status
        assert 'last_updated' in status
        assert status['pipeline_status'] == 'active'
        
        # Check all configured models are in status
        for model_name in training_pipeline.model_configs:
            assert model_name in status['models']
            assert 'needs_retrain' in status['models'][model_name]
            assert 'config' in status['models'][model_name]
    
    @pytest.mark.asyncio
    @patch('src.services.model_training_pipeline.mlflow')
    async def test_train_model_success(self, mock_mlflow, training_pipeline, sample_classification_data):
        """Test successful model training"""
        # Mock MLflow
        mock_mlflow.start_run.return_value.__enter__ = Mock()
        mock_mlflow.start_run.return_value.__exit__ = Mock()
        mock_mlflow.log_params = Mock()
        mock_mlflow.log_metrics = Mock()
        mock_mlflow.log_artifact = Mock()
        mock_mlflow.sklearn.log_model = Mock()
        
        result = await training_pipeline.train_model(
            'regulatory_classifier', 
            sample_classification_data, 
            force_retrain=True
        )
        
        assert result['status'] == 'trained'
        assert result['model_name'] == 'regulatory_classifier'
        assert 'metrics' in result
        assert 'model_path' in result
        assert 'training_time' in result
    
    @pytest.mark.asyncio
    async def test_train_model_invalid_name(self, training_pipeline, sample_classification_data):
        """Test training with invalid model name"""
        with pytest.raises(ValueError, match="Unknown model"):
            await training_pipeline.train_model(
                'invalid_model', 
                sample_classification_data
            )
    
    @pytest.mark.asyncio
    @patch('src.services.model_training_pipeline.mlflow')
    async def test_retrain_all_models(self, mock_mlflow, training_pipeline):
        """Test batch retraining of all models"""
        # Mock MLflow
        mock_mlflow.start_run.return_value.__enter__ = Mock()
        mock_mlflow.start_run.return_value.__exit__ = Mock()
        mock_mlflow.log_params = Mock()
        mock_mlflow.log_metrics = Mock()
        mock_mlflow.log_artifact = Mock()
        mock_mlflow.sklearn.log_model = Mock()
        
        # Prepare training data for all models
        training_data = {}
        for model_name in training_pipeline.model_configs:
            if 'classifier' in model_name:
                training_data[model_name] = sample_classification_data
            else:
                training_data[model_name] = sample_regression_data
        
        results = await training_pipeline.retrain_all_models(training_data)
        
        assert len(results) == len(training_pipeline.model_configs)
        for model_name in training_pipeline.model_configs:
            assert model_name in results
            if model_name in training_data:
                assert results[model_name]['status'] == 'trained'
    
    @pytest.mark.asyncio
    async def test_retrain_all_models_missing_data(self, training_pipeline):
        """Test batch retraining with missing data"""
        # Only provide data for one model
        training_data = {'regulatory_classifier': sample_classification_data}
        
        results = await training_pipeline.retrain_all_models(training_data)
        
        assert len(results) == len(training_pipeline.model_configs)
        assert results['regulatory_classifier']['status'] == 'trained'
        
        # Other models should be skipped
        for model_name in training_pipeline.model_configs:
            if model_name != 'regulatory_classifier':
                assert results[model_name]['status'] == 'skipped'
                assert results[model_name]['reason'] == 'no_data'


if __name__ == "__main__":
    pytest.main([__file__])
