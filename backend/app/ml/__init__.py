"""
Machine Learning Module for AI Financial Transaction Analyzer

This module contains all ML models and utilities for fraud detection:
- Isolation Forest for anomaly detection
- K-Means clustering for pattern recognition
- Ensemble model combining both approaches
- Feature engineering utilities
- Model management and orchestration
"""

from .config import MLConfig, ModelMetrics
from .feature_engineering import FeatureEngineer
from .isolation_forest_model import IsolationForestModel
from .kmeans_model import KMeansModel
from .ensemble_model import EnsembleModel
from .model_manager import ModelManager

__all__ = [
    'MLConfig',
    'ModelMetrics',
    'FeatureEngineer',
    'IsolationForestModel',
    'KMeansModel',
    'EnsembleModel',
    'ModelManager'
]