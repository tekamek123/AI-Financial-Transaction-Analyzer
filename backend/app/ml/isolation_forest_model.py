import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.metrics import classification_report, roc_auc_score, precision_recall_curve
from sklearn.model_selection import train_test_split, cross_val_score
from typing import Dict, Tuple, List, Optional
import joblib
import warnings
warnings.filterwarnings('ignore')

from app.ml.config import MLConfig, ModelMetrics
from app.ml.feature_engineering import FeatureEngineer

class IsolationForestModel:
    """Isolation Forest model for fraud detection"""
    
    def __init__(self, config: Optional[MLConfig] = None):
        self.config = config or MLConfig()
        self.model = None
        self.feature_engineer = FeatureEngineer(self.config)
        self.metrics = ModelMetrics()
        self.is_trained = False
        
        # Initialize Isolation Forest with configuration
        self.model = IsolationForest(
            contamination=self.config.ISOLATION_FOREST_CONTAMINATION,
            n_estimators=self.config.ISOLATION_FOREST_N_ESTIMATORS,
            max_samples=self.config.ISOLATION_FOREST_MAX_SAMPLES,
            random_state=self.config.ISOLATION_FOREST_RANDOM_STATE,
            n_jobs=-1
        )
    
    def train(self, df: pd.DataFrame, labels: Optional[pd.Series] = None) -> Dict[str, float]:
        """Train the Isolation Forest model"""
        if len(df) < self.config.MIN_TRAINING_SAMPLES:
            raise ValueError(f"Need at least {self.config.MIN_TRAINING_SAMPLES} samples for training")
        
        # Feature engineering
        X = self.feature_engineer.fit_transform(df)
        
        # Train the model
        self.model.fit(X)
        self.is_trained = True
        
        # Calculate training metrics if labels are available
        training_metrics = {}
        if labels is not None:
            training_metrics = self._calculate_metrics(X, labels)
            self.metrics.update_metrics("isolation_forest", training_metrics)
        
        return training_metrics
    
    def predict(self, df: pd.DataFrame) -> np.ndarray:
        """Predict anomalies (1 for normal, -1 for anomaly)"""
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")
        
        X = self.feature_engineer.transform(df)
        return self.model.predict(X)
    
    def predict_proba(self, df: pd.DataFrame) -> np.ndarray:
        """Predict anomaly scores (higher = more anomalous)"""
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")
        
        X = self.feature_engineer.transform(df)
        # Decision function returns anomaly scores (negative for anomalies)
        scores = self.model.decision_function(X)
        # Convert to probability-like scores (0-1, higher = more anomalous)
        proba = 1 - (scores - scores.min()) / (scores.max() - scores.min())
        return proba
    
    def analyze_transactions(self, df: pd.DataFrame) -> pd.DataFrame:
        """Analyze transactions and return detailed results"""
        if not self.is_trained:
            raise ValueError("Model must be trained before analysis")
        
        # Make predictions
        predictions = self.predict(df)
        anomaly_scores = self.predict_proba(df)
        
        # Create results dataframe
        results = df.copy()
        results['is_anomaly'] = predictions == -1
        results['anomaly_score'] = anomaly_scores
        results['risk_score'] = self._calculate_risk_score(anomaly_scores)
        
        # Add detailed analysis
        results = self._add_detailed_analysis(results)
        
        return results
    
    def _calculate_risk_score(self, anomaly_scores: np.ndarray) -> np.ndarray:
        """Convert anomaly scores to risk scores (0-100)"""
        # Normalize to 0-100 scale
        risk_scores = anomaly_scores * 100
        
        # Apply threshold-based adjustments
        risk_scores = np.where(
            risk_scores > self.config.RISK_THRESHOLD_HIGH,
            risk_scores * 1.2,  # Boost high-risk scores
            risk_scores
        )
        
        return np.clip(risk_scores, 0, 100)
    
    def _add_detailed_analysis(self, results: pd.DataFrame) -> pd.DataFrame:
        """Add detailed analysis to results"""
        # Risk level classification
        results['risk_level'] = pd.cut(
            results['risk_score'],
            bins=[0, 30, 60, 80, 100],
            labels=['Low', 'Medium', 'High', 'Critical']
        )
        
        # Feature contribution analysis
        if not self.is_trained:
            return results
        
        # Get feature contributions (simplified version)
        X = self.feature_engineer.transform(results)
        feature_names = self.feature_engineer.get_feature_names()
        
        # Calculate feature importance based on tree structure
        feature_importance = self._get_feature_importance()
        
        # Add top contributing features for each transaction
        results['top_risk_factors'] = self._get_top_risk_factors(
            X, feature_names, feature_importance
        )
        
        return results
    
    def _get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance from the trained model"""
        if not self.is_trained:
            return {}
        
        # Isolation Forest doesn't have direct feature importance
        # We'll use a proxy based on path lengths
        feature_importance = {}
        feature_names = self.feature_engineer.get_feature_names()
        
        # Simple heuristic: time and amount features are usually most important
        for feature in feature_names:
            if 'amount' in feature.lower():
                feature_importance[feature] = 0.3
            elif 'hour' in feature.lower() or 'time' in feature.lower():
                feature_importance[feature] = 0.25
            elif 'merchant' in feature.lower():
                feature_importance[feature] = 0.2
            elif 'frequency' in feature.lower():
                feature_importance[feature] = 0.15
            else:
                feature_importance[feature] = 0.1
        
        return feature_importance
    
    def _get_top_risk_factors(
        self, 
        X: np.ndarray, 
        feature_names: List[str], 
        feature_importance: Dict[str, float]
    ) -> List[str]:
        """Get top risk factors for each transaction"""
        risk_factors = []
        
        for i in range(len(X)):
            # Find features with high values that are also important
            transaction_features = X[i]
            feature_scores = []
            
            for j, feature in enumerate(feature_names):
                if j < len(transaction_features):
                    importance = feature_importance.get(feature, 0)
                    feature_value = abs(transaction_features[j])
                    score = importance * feature_value
                    feature_scores.append((feature, score))
            
            # Sort by score and get top 3
            feature_scores.sort(key=lambda x: x[1], reverse=True)
            top_factors = [f[0] for f in feature_scores[:3]]
            risk_factors.append(", ".join(top_factors))
        
        return risk_factors
    
    def _calculate_metrics(self, X: np.ndarray, y_true: pd.Series) -> Dict[str, float]:
        """Calculate model performance metrics"""
        y_pred = self.predict(pd.DataFrame(X))
        y_pred_binary = (y_pred == -1).astype(int)  # Convert to binary (1 = anomaly)
        
        # Calculate metrics
        report = classification_report(y_true, y_pred_binary, output_dict=True, zero_division=0)
        
        metrics = {
            'accuracy': report['accuracy'],
            'precision': report['1']['precision'] if '1' in report else 0,
            'recall': report['1']['recall'] if '1' in report else 0,
            'f1_score': report['1']['f1-score'] if '1' in report else 0
        }
        
        # Calculate AUC-ROC if possible
        try:
            y_scores = self.predict_proba(pd.DataFrame(X))
            metrics['auc_roc'] = roc_auc_score(y_true, y_scores)
        except:
            metrics['auc_roc'] = 0.0
        
        return metrics
    
    def cross_validate(self, df: pd.DataFrame, labels: pd.Series) -> Dict[str, float]:
        """Perform cross-validation"""
        X = self.feature_engineer.fit_transform(df)
        
        # Convert to binary labels for cross-validation
        y_binary = labels.astype(int)
        
        # Perform cross-validation
        cv_scores = cross_val_score(
            self.model, X, y_binary, 
            cv=self.config.CROSS_VALIDATION_FOLDS,
            scoring='f1'
        )
        
        return {
            'cv_mean': cv_scores.mean(),
            'cv_std': cv_scores.std(),
            'cv_scores': cv_scores.tolist()
        }
    
    def save_model(self, filepath: str) -> None:
        """Save the trained model"""
        if not self.is_trained:
            raise ValueError("Model must be trained before saving")
        
        model_data = {
            'model': self.model,
            'feature_engineer': self.feature_engineer,
            'config': self.config,
            'metrics': self.metrics,
            'is_trained': self.is_trained
        }
        
        joblib.dump(model_data, filepath)
    
    def load_model(self, filepath: str) -> None:
        """Load a trained model"""
        model_data = joblib.load(filepath)
        
        self.model = model_data['model']
        self.feature_engineer = model_data['feature_engineer']
        self.config = model_data['config']
        self.metrics = model_data['metrics']
        self.is_trained = model_data['is_trained']
    
    def get_model_info(self) -> Dict[str, any]:
        """Get model information"""
        return {
            'model_type': 'IsolationForest',
            'is_trained': self.is_trained,
            'config': {
                'contamination': self.config.ISOLATION_FOREST_CONTAMINATION,
                'n_estimators': self.config.ISOLATION_FOREST_N_ESTIMATORS,
                'max_samples': self.config.ISOLATION_FOREST_MAX_SAMPLES,
                'random_state': self.config.ISOLATION_FOREST_RANDOM_STATE
            },
            'metrics': self.metrics.get_metrics('isolation_forest'),
            'feature_count': len(self.feature_engineer.get_feature_names()) if self.is_trained else 0
        }
    
    def update_config(self, new_config: MLConfig) -> None:
        """Update model configuration"""
        self.config = new_config
        
        # Reinitialize model with new config
        self.model = IsolationForest(
            contamination=self.config.ISOLATION_FOREST_CONTAMINATION,
            n_estimators=self.config.ISOLATION_FOREST_N_ESTIMATORS,
            max_samples=self.config.ISOLATION_FOREST_MAX_SAMPLES,
            random_state=self.config.ISOLATION_FOREST_RANDOM_STATE,
            n_jobs=-1
        )
        
        # Reset training status
        self.is_trained = False
