"""
Risk Scoring & Prediction Models
Machine learning models for compliance risk assessment and prediction
"""

import asyncio
import pickle
import joblib
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
import numpy as np
import pandas as pd

# ML Libraries
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import xgboost as xgb
import lightgbm as lgb

# Deep Learning
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

from src.core.models import get_model_manager
from src.core.cache import cache_get, cache_set
from src.core.logging import ml_logger as logger


class RiskCategory(Enum):
    """Risk categories for assessment"""
    OPERATIONAL = "operational"
    FINANCIAL = "financial"
    REGULATORY = "regulatory"
    REPUTATIONAL = "reputational"
    STRATEGIC = "strategic"
    TECHNOLOGY = "technology"


class RiskLevel(Enum):
    """Risk levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class RiskFeatures:
    """Features for risk assessment"""
    # Financial metrics
    capital_adequacy_ratio: float
    liquidity_ratio: float
    npa_ratio: float
    roa: float
    roe: float
    
    # Operational metrics
    process_maturity_score: float
    system_reliability_score: float
    staff_competency_score: float
    
    # Regulatory metrics
    compliance_history_score: float
    audit_findings_count: int
    regulatory_penalties_count: int
    
    # Market metrics
    market_share: float
    customer_satisfaction_score: float
    brand_reputation_score: float
    
    # Additional context
    institution_size: str
    institution_type: str
    geographic_presence: str
    business_complexity: str


@dataclass
class RiskPrediction:
    """Risk prediction result"""
    overall_risk_score: float
    risk_level: RiskLevel
    category_scores: Dict[str, float]
    confidence: float
    contributing_factors: List[str]
    recommendations: List[str]
    prediction_horizon: int
    model_version: str


@dataclass
class RiskTrend:
    """Risk trend analysis"""
    historical_scores: List[float]
    trend_direction: str
    trend_magnitude: float
    forecast: List[float]
    volatility: float
    seasonal_patterns: Dict[str, float]


class RiskScoringEngine:
    """Advanced risk scoring and prediction engine"""
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.encoders = {}
        self.feature_importance = {}
        self.model_metadata = {}
        self.is_trained = False
    
    async def initialize(self):
        """Initialize the risk scoring engine"""
        try:
            logger.info("Initializing Risk Scoring Engine...")
            
            # Load pre-trained models or train new ones
            await self._load_or_train_models()
            
            # Initialize feature processors
            self._initialize_feature_processors()
            
            logger.info("✅ Risk Scoring Engine initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Risk Scoring Engine: {e}")
            raise
    
    async def _load_or_train_models(self):
        """Load existing models or train new ones"""
        try:
            # Try to load existing models
            await self._load_models()
            
            if not self.is_trained:
                logger.info("No pre-trained models found, training new models...")
                await self._train_models()
                await self._save_models()
            
        except Exception as e:
            logger.warning(f"Failed to load models, training new ones: {e}")
            await self._train_models()
            await self._save_models()
    
    async def _load_models(self):
        """Load pre-trained models from storage"""
        try:
            # In production, load from model registry or file system
            # For now, we'll mark as not trained to trigger training
            self.is_trained = False
            
        except Exception as e:
            logger.warning(f"Failed to load models: {e}")
            self.is_trained = False
    
    async def _train_models(self):
        """Train risk assessment models"""
        try:
            logger.info("Training risk assessment models...")
            
            # Generate synthetic training data
            X_train, y_train = self._generate_training_data()
            
            # Train multiple models for ensemble
            await self._train_classification_models(X_train, y_train)
            await self._train_regression_models(X_train, y_train)
            await self._train_deep_learning_model(X_train, y_train)
            
            # Calculate feature importance
            self._calculate_feature_importance(X_train, y_train)
            
            self.is_trained = True
            logger.info("✅ Risk models trained successfully")
            
        except Exception as e:
            logger.error(f"Failed to train models: {e}")
            raise
    
    def _generate_training_data(self) -> Tuple[np.ndarray, np.ndarray]:
        """Generate synthetic training data for risk models"""
        np.random.seed(42)
        n_samples = 10000
        
        # Generate features
        features = []
        labels = []
        
        for _ in range(n_samples):
            # Financial metrics
            car = np.random.normal(12, 2)  # Capital Adequacy Ratio
            liquidity = np.random.normal(25, 5)
            npa = np.random.exponential(2)
            roa = np.random.normal(1.2, 0.5)
            roe = np.random.normal(15, 3)
            
            # Operational metrics
            process_maturity = np.random.uniform(0.5, 1.0)
            system_reliability = np.random.uniform(0.6, 1.0)
            staff_competency = np.random.uniform(0.7, 1.0)
            
            # Regulatory metrics
            compliance_history = np.random.uniform(0.6, 1.0)
            audit_findings = np.random.poisson(2)
            penalties = np.random.poisson(0.5)
            
            # Market metrics
            market_share = np.random.exponential(2)
            customer_satisfaction = np.random.uniform(0.7, 1.0)
            brand_reputation = np.random.uniform(0.6, 1.0)
            
            # Calculate risk score based on features
            risk_score = self._calculate_synthetic_risk_score(
                car, liquidity, npa, roa, roe,
                process_maturity, system_reliability, staff_competency,
                compliance_history, audit_findings, penalties,
                market_share, customer_satisfaction, brand_reputation
            )
            
            feature_vector = [
                car, liquidity, npa, roa, roe,
                process_maturity, system_reliability, staff_competency,
                compliance_history, audit_findings, penalties,
                market_share, customer_satisfaction, brand_reputation
            ]
            
            features.append(feature_vector)
            labels.append(risk_score)
        
        return np.array(features), np.array(labels)
    
    def _calculate_synthetic_risk_score(self, *args) -> float:
        """Calculate synthetic risk score for training data"""
        car, liquidity, npa, roa, roe = args[:5]
        process_maturity, system_reliability, staff_competency = args[5:8]
        compliance_history, audit_findings, penalties = args[8:11]
        market_share, customer_satisfaction, brand_reputation = args[11:14]
        
        # Financial risk component
        financial_risk = (
            max(0, (9 - car) / 9) * 0.3 +  # CAR below 9% increases risk
            max(0, (20 - liquidity) / 20) * 0.2 +  # Low liquidity increases risk
            min(1, npa / 5) * 0.3 +  # High NPA increases risk
            max(0, (0.5 - roa) / 0.5) * 0.1 +  # Low ROA increases risk
            max(0, (10 - roe) / 10) * 0.1  # Low ROE increases risk
        )
        
        # Operational risk component
        operational_risk = (
            (1 - process_maturity) * 0.4 +
            (1 - system_reliability) * 0.3 +
            (1 - staff_competency) * 0.3
        )
        
        # Regulatory risk component
        regulatory_risk = (
            (1 - compliance_history) * 0.5 +
            min(1, audit_findings / 10) * 0.3 +
            min(1, penalties / 5) * 0.2
        )
        
        # Market risk component
        market_risk = (
            (1 - customer_satisfaction) * 0.4 +
            (1 - brand_reputation) * 0.6
        )
        
        # Combine components
        overall_risk = (
            financial_risk * 0.4 +
            operational_risk * 0.3 +
            regulatory_risk * 0.2 +
            market_risk * 0.1
        )
        
        # Add some noise
        overall_risk += np.random.normal(0, 0.05)
        
        return np.clip(overall_risk, 0, 1)
    
    async def _train_classification_models(self, X: np.ndarray, y: np.ndarray):
        """Train classification models for risk level prediction"""
        # Convert continuous scores to risk levels
        y_class = np.where(y < 0.3, 0,  # Low
                  np.where(y < 0.6, 1,  # Medium
                  np.where(y < 0.8, 2, 3)))  # High, Critical
        
        X_train, X_test, y_train, y_test = train_test_split(X, y_class, test_size=0.2, random_state=42)
        
        # Random Forest
        rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
        rf_model.fit(X_train, y_train)
        self.models['risk_classifier_rf'] = rf_model
        
        # XGBoost
        xgb_model = xgb.XGBClassifier(random_state=42)
        xgb_model.fit(X_train, y_train)
        self.models['risk_classifier_xgb'] = xgb_model
        
        # Logistic Regression
        lr_model = LogisticRegression(random_state=42)
        lr_model.fit(X_train, y_train)
        self.models['risk_classifier_lr'] = lr_model
        
        # Evaluate models
        for name, model in [('rf', rf_model), ('xgb', xgb_model), ('lr', lr_model)]:
            y_pred = model.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
            logger.info(f"Risk classifier {name} accuracy: {accuracy:.3f}")
    
    async def _train_regression_models(self, X: np.ndarray, y: np.ndarray):
        """Train regression models for risk score prediction"""
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Gradient Boosting
        gb_model = GradientBoostingRegressor(random_state=42)
        gb_model.fit(X_train, y_train)
        self.models['risk_regressor_gb'] = gb_model
        
        # LightGBM
        lgb_model = lgb.LGBMRegressor(random_state=42)
        lgb_model.fit(X_train, y_train)
        self.models['risk_regressor_lgb'] = lgb_model
        
        # Evaluate models
        for name, model in [('gb', gb_model), ('lgb', lgb_model)]:
            y_pred = model.predict(X_test)
            mse = np.mean((y_test - y_pred) ** 2)
            logger.info(f"Risk regressor {name} MSE: {mse:.4f}")
    
    async def _train_deep_learning_model(self, X: np.ndarray, y: np.ndarray):
        """Train deep learning model for risk prediction"""
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Normalize features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        self.scalers['deep_learning'] = scaler
        
        # Build neural network
        model = keras.Sequential([
            layers.Dense(128, activation='relu', input_shape=(X.shape[1],)),
            layers.Dropout(0.3),
            layers.Dense(64, activation='relu'),
            layers.Dropout(0.2),
            layers.Dense(32, activation='relu'),
            layers.Dense(1, activation='sigmoid')
        ])
        
        model.compile(
            optimizer='adam',
            loss='mse',
            metrics=['mae']
        )
        
        # Train model
        history = model.fit(
            X_train_scaled, y_train,
            epochs=50,
            batch_size=32,
            validation_split=0.2,
            verbose=0
        )
        
        self.models['risk_neural_network'] = model
        
        # Evaluate
        test_loss = model.evaluate(X_test_scaled, y_test, verbose=0)
        logger.info(f"Neural network test loss: {test_loss[0]:.4f}")
    
    def _calculate_feature_importance(self, X: np.ndarray, y: np.ndarray):
        """Calculate feature importance for interpretability"""
        feature_names = [
            'capital_adequacy_ratio', 'liquidity_ratio', 'npa_ratio', 'roa', 'roe',
            'process_maturity_score', 'system_reliability_score', 'staff_competency_score',
            'compliance_history_score', 'audit_findings_count', 'regulatory_penalties_count',
            'market_share', 'customer_satisfaction_score', 'brand_reputation_score'
        ]
        
        # Get feature importance from Random Forest
        if 'risk_classifier_rf' in self.models:
            rf_importance = self.models['risk_classifier_rf'].feature_importances_
            self.feature_importance['random_forest'] = dict(zip(feature_names, rf_importance))
        
        # Get feature importance from XGBoost
        if 'risk_classifier_xgb' in self.models:
            xgb_importance = self.models['risk_classifier_xgb'].feature_importances_
            self.feature_importance['xgboost'] = dict(zip(feature_names, xgb_importance))
    
    def _initialize_feature_processors(self):
        """Initialize feature preprocessing components"""
        self.scalers['standard'] = StandardScaler()
        self.encoders['institution_type'] = LabelEncoder()
        self.encoders['institution_size'] = LabelEncoder()
    
    async def _save_models(self):
        """Save trained models to storage"""
        try:
            # In production, save to model registry or persistent storage
            logger.info("Models would be saved to persistent storage in production")
            
        except Exception as e:
            logger.warning(f"Failed to save models: {e}")
    
    async def predict_risk(self, features: RiskFeatures) -> RiskPrediction:
        """Predict risk score and level for given features"""
        try:
            cache_key = f"risk_prediction:{hash(str(features))}"
            cached_result = await cache_get(cache_key)
            if cached_result:
                return cached_result
            
            # Convert features to array
            feature_array = self._features_to_array(features)
            
            # Get predictions from ensemble of models
            predictions = {}
            
            # Classification predictions
            if 'risk_classifier_rf' in self.models:
                rf_pred = self.models['risk_classifier_rf'].predict_proba(feature_array.reshape(1, -1))[0]
                predictions['rf_class'] = rf_pred
            
            # Regression predictions
            if 'risk_regressor_gb' in self.models:
                gb_pred = self.models['risk_regressor_gb'].predict(feature_array.reshape(1, -1))[0]
                predictions['gb_score'] = gb_pred
            
            if 'risk_regressor_lgb' in self.models:
                lgb_pred = self.models['risk_regressor_lgb'].predict(feature_array.reshape(1, -1))[0]
                predictions['lgb_score'] = lgb_pred
            
            # Neural network prediction
            if 'risk_neural_network' in self.models and 'deep_learning' in self.scalers:
                scaled_features = self.scalers['deep_learning'].transform(feature_array.reshape(1, -1))
                nn_pred = self.models['risk_neural_network'].predict(scaled_features, verbose=0)[0][0]
                predictions['nn_score'] = nn_pred
            
            # Ensemble prediction
            overall_score = self._ensemble_prediction(predictions)
            risk_level = self._score_to_risk_level(overall_score)
            
            # Calculate category-specific scores
            category_scores = self._calculate_category_scores(features)
            
            # Identify contributing factors
            contributing_factors = self._identify_contributing_factors(features, overall_score)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(features, overall_score, category_scores)
            
            # Calculate confidence
            confidence = self._calculate_prediction_confidence(predictions)
            
            result = RiskPrediction(
                overall_risk_score=overall_score,
                risk_level=risk_level,
                category_scores=category_scores,
                confidence=confidence,
                contributing_factors=contributing_factors,
                recommendations=recommendations,
                prediction_horizon=12,  # months
                model_version="1.0.0"
            )
            
            # Cache result
            await cache_set(cache_key, result, ttl=1800)
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to predict risk: {e}")
            # Return default prediction
            return RiskPrediction(
                overall_risk_score=0.5,
                risk_level=RiskLevel.MEDIUM,
                category_scores={},
                confidence=0.0,
                contributing_factors=[],
                recommendations=[],
                prediction_horizon=12,
                model_version="1.0.0"
            )
    
    def _features_to_array(self, features: RiskFeatures) -> np.ndarray:
        """Convert RiskFeatures to numpy array"""
        return np.array([
            features.capital_adequacy_ratio,
            features.liquidity_ratio,
            features.npa_ratio,
            features.roa,
            features.roe,
            features.process_maturity_score,
            features.system_reliability_score,
            features.staff_competency_score,
            features.compliance_history_score,
            features.audit_findings_count,
            features.regulatory_penalties_count,
            features.market_share,
            features.customer_satisfaction_score,
            features.brand_reputation_score
        ])
    
    def _ensemble_prediction(self, predictions: Dict[str, Any]) -> float:
        """Combine predictions from multiple models"""
        scores = []
        weights = []
        
        # Regression model scores
        if 'gb_score' in predictions:
            scores.append(predictions['gb_score'])
            weights.append(0.3)
        
        if 'lgb_score' in predictions:
            scores.append(predictions['lgb_score'])
            weights.append(0.3)
        
        if 'nn_score' in predictions:
            scores.append(predictions['nn_score'])
            weights.append(0.4)
        
        if scores:
            # Weighted average
            weights = np.array(weights) / sum(weights)
            return np.average(scores, weights=weights)
        else:
            return 0.5  # Default score
    
    def _score_to_risk_level(self, score: float) -> RiskLevel:
        """Convert risk score to risk level"""
        if score < 0.25:
            return RiskLevel.LOW
        elif score < 0.5:
            return RiskLevel.MEDIUM
        elif score < 0.75:
            return RiskLevel.HIGH
        else:
            return RiskLevel.CRITICAL
    
    def _calculate_category_scores(self, features: RiskFeatures) -> Dict[str, float]:
        """Calculate risk scores for each category"""
        return {
            RiskCategory.FINANCIAL.value: self._calculate_financial_risk(features),
            RiskCategory.OPERATIONAL.value: self._calculate_operational_risk(features),
            RiskCategory.REGULATORY.value: self._calculate_regulatory_risk(features),
            RiskCategory.REPUTATIONAL.value: self._calculate_reputational_risk(features),
        }
    
    def _calculate_financial_risk(self, features: RiskFeatures) -> float:
        """Calculate financial risk score"""
        car_risk = max(0, (9 - features.capital_adequacy_ratio) / 9)
        liquidity_risk = max(0, (20 - features.liquidity_ratio) / 20)
        npa_risk = min(1, features.npa_ratio / 5)
        roa_risk = max(0, (0.5 - features.roa) / 0.5)
        
        return np.clip((car_risk * 0.4 + liquidity_risk * 0.3 + npa_risk * 0.2 + roa_risk * 0.1), 0, 1)
    
    def _calculate_operational_risk(self, features: RiskFeatures) -> float:
        """Calculate operational risk score"""
        process_risk = 1 - features.process_maturity_score
        system_risk = 1 - features.system_reliability_score
        staff_risk = 1 - features.staff_competency_score
        
        return np.clip((process_risk * 0.4 + system_risk * 0.3 + staff_risk * 0.3), 0, 1)
    
    def _calculate_regulatory_risk(self, features: RiskFeatures) -> float:
        """Calculate regulatory risk score"""
        compliance_risk = 1 - features.compliance_history_score
        audit_risk = min(1, features.audit_findings_count / 10)
        penalty_risk = min(1, features.regulatory_penalties_count / 5)
        
        return np.clip((compliance_risk * 0.5 + audit_risk * 0.3 + penalty_risk * 0.2), 0, 1)
    
    def _calculate_reputational_risk(self, features: RiskFeatures) -> float:
        """Calculate reputational risk score"""
        customer_risk = 1 - features.customer_satisfaction_score
        brand_risk = 1 - features.brand_reputation_score
        
        return np.clip((customer_risk * 0.4 + brand_risk * 0.6), 0, 1)
    
    def _identify_contributing_factors(self, features: RiskFeatures, overall_score: float) -> List[str]:
        """Identify main factors contributing to risk"""
        factors = []
        
        if features.capital_adequacy_ratio < 9:
            factors.append("Low capital adequacy ratio")
        
        if features.npa_ratio > 3:
            factors.append("High non-performing assets")
        
        if features.compliance_history_score < 0.7:
            factors.append("Poor compliance history")
        
        if features.audit_findings_count > 5:
            factors.append("High number of audit findings")
        
        if features.process_maturity_score < 0.6:
            factors.append("Low process maturity")
        
        return factors[:5]  # Top 5 factors
    
    def _generate_recommendations(self, features: RiskFeatures, overall_score: float, category_scores: Dict[str, float]) -> List[str]:
        """Generate risk mitigation recommendations"""
        recommendations = []
        
        # Financial recommendations
        if category_scores.get('financial', 0) > 0.6:
            recommendations.append("Improve capital adequacy and liquidity management")
            recommendations.append("Implement stricter credit risk controls")
        
        # Operational recommendations
        if category_scores.get('operational', 0) > 0.6:
            recommendations.append("Enhance process automation and controls")
            recommendations.append("Invest in staff training and system reliability")
        
        # Regulatory recommendations
        if category_scores.get('regulatory', 0) > 0.6:
            recommendations.append("Strengthen compliance monitoring and reporting")
            recommendations.append("Address outstanding audit findings")
        
        # General recommendations
        if overall_score > 0.7:
            recommendations.append("Conduct comprehensive risk assessment")
            recommendations.append("Develop risk mitigation action plan")
        
        return recommendations[:6]  # Top 6 recommendations
    
    def _calculate_prediction_confidence(self, predictions: Dict[str, Any]) -> float:
        """Calculate confidence in the prediction"""
        if len(predictions) < 2:
            return 0.5
        
        # Calculate variance in predictions
        scores = [v for k, v in predictions.items() if 'score' in k]
        if len(scores) > 1:
            variance = np.var(scores)
            confidence = max(0.1, 1 - variance * 10)  # Lower variance = higher confidence
            return min(0.95, confidence)
        
        return 0.7  # Default confidence


# Global risk scoring engine instance
risk_scoring_engine = RiskScoringEngine()
