from pydantic_settings import BaseSettings
from typing import Dict, Any

class MLConfig:
    """Machine Learning Model Configuration"""
    
    # Isolation Forest Configuration
    ISOLATION_FOREST_CONTAMINATION: float = 0.1
    ISOLATION_FOREST_N_ESTIMATORS: int = 100
    ISOLATION_FOREST_MAX_SAMPLES: str = "auto"
    ISOLATION_FOREST_RANDOM_STATE: int = 42
    
    # K-Means Clustering Configuration
    KMEANS_N_CLUSTERS: int = 8
    KMEANS_RANDOM_STATE: int = 42
    KMEANS_MAX_ITER: int = 300
    KMEANS_N_INIT: int = 10
    
    # Feature Engineering
    FEATURE_SCALING: bool = True
    HANDLE_OUTLIERS: bool = True
    OUTLIER_THRESHOLD: float = 3.0
    
    # Risk Scoring
    RISK_THRESHOLD_LOW: float = 30.0
    RISK_THRESHOLD_MEDIUM: float = 60.0
    RISK_THRESHOLD_HIGH: float = 80.0
    
    # Model Persistence
    MODEL_SAVE_PATH: str = "models/"
    MODEL_VERSION: str = "v1.0"
    
    # Training Data Requirements
    MIN_TRAINING_SAMPLES: int = 100
    TRAIN_TEST_SPLIT: float = 0.2
    CROSS_VALIDATION_FOLDS: int = 5
    
    # Feature Weights for Risk Scoring
    FEATURE_WEIGHTS: Dict[str, float] = {
        "amount_anomaly": 0.35,
        "time_anomaly": 0.25,
        "merchant_anomaly": 0.20,
        "frequency_anomaly": 0.20
    }
    
    # Anomaly Detection Thresholds
    AMOUNT_Z_SCORE_THRESHOLD: float = 2.5
    FREQUENCY_DEVIATION_THRESHOLD: float = 2.0
    TIME_ANOMALY_HOURS: list = [0, 1, 2, 3, 4, 5, 22, 23]  # Unusual hours
    
    # Clustering Analysis
    CLUSTER_SIZE_THRESHOLD: int = 5  # Minimum cluster size for analysis
    OUTLIER_CLUSTER_THRESHOLD: float = 0.1  # Percentage threshold for outlier clusters

class ModelMetrics:
    """Model Performance Metrics Tracking"""
    
    def __init__(self):
        self.metrics = {
            "isolation_forest": {
                "accuracy": 0.0,
                "precision": 0.0,
                "recall": 0.0,
                "f1_score": 0.0,
                "auc_roc": 0.0
            },
            "kmeans_clustering": {
                "silhouette_score": 0.0,
                "inertia": 0.0,
                "calinski_harabasz_score": 0.0
            }
        }
    
    def update_metrics(self, model_name: str, metrics_dict: Dict[str, float]):
        """Update metrics for a specific model"""
        if model_name in self.metrics:
            self.metrics[model_name].update(metrics_dict)
    
    def get_metrics(self, model_name: str) -> Dict[str, float]:
        """Get metrics for a specific model"""
        return self.metrics.get(model_name, {})
    
    def get_all_metrics(self) -> Dict[str, Dict[str, float]]:
        """Get all model metrics"""
        return self.metrics
