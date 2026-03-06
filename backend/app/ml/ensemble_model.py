import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple, Any
import joblib
import warnings
warnings.filterwarnings('ignore')

from app.ml.config import MLConfig, ModelMetrics
from app.ml.isolation_forest_model import IsolationForestModel
from app.ml.kmeans_model import KMeansModel
from app.ml.feature_engineering import FeatureEngineer

class EnsembleModel:
    """Ensemble model combining Isolation Forest and K-Means for fraud detection"""
    
    def __init__(self, config: Optional[MLConfig] = None):
        self.config = config or MLConfig()
        self.isolation_forest = IsolationForestModel(self.config)
        self.kmeans = KMeansModel(self.config)
        self.metrics = ModelMetrics()
        self.is_trained = False
        
        # Ensemble weights for combining model predictions
        self.ensemble_weights = {
            'isolation_forest': 0.6,  # Higher weight for anomaly detection
            'kmeans': 0.4  # Complementary clustering analysis
        }
        
        # Feature weights for final risk scoring
        self.feature_weights = self.config.FEATURE_WEIGHTS.copy()
    
    def train(self, df: pd.DataFrame, labels: Optional[pd.Series] = None) -> Dict[str, float]:
        """Train both models in the ensemble"""
        if len(df) < self.config.MIN_TRAINING_SAMPLES:
            raise ValueError(f"Need at least {self.config.MIN_TRAINING_SAMPLES} samples for training")
        
        # Train Isolation Forest
        if_metrics = self.isolation_forest.train(df, labels)
        
        # Train K-Means
        km_metrics = self.kmeans.train(df)
        
        self.is_trained = True
        
        # Combine metrics
        ensemble_metrics = {
            'isolation_forest_metrics': if_metrics,
            'kmeans_metrics': km_metrics,
            'ensemble_weighted_score': self._calculate_ensemble_score(if_metrics, km_metrics)
        }
        
        return ensemble_metrics
    
    def predict(self, df: pd.DataFrame) -> np.ndarray:
        """Predict anomalies using ensemble"""
        if not self.is_trained:
            raise ValueError("Ensemble must be trained before making predictions")
        
        # Get predictions from both models
        if_predictions = self.isolation_forest.predict(df)
        km_predictions = self.kmeans.predict(df)
        
        # Convert to binary (1 = anomaly, 0 = normal)
        if_binary = (if_predictions == -1).astype(int)
        km_binary = (self.kmeans._identify_outliers(
            self.kmeans._calculate_distances_to_centers(
                self.kmeans.feature_engineer.transform(df)
            )
        )).astype(int)
        
        # Weighted ensemble prediction
        ensemble_scores = (
            if_binary * self.ensemble_weights['isolation_forest'] +
            km_binary * self.ensemble_weights['kmeans']
        )
        
        # Threshold for final prediction
        ensemble_predictions = (ensemble_scores > 0.5).astype(int)
        
        return ensemble_predictions
    
    def predict_proba(self, df: pd.DataFrame) -> np.ndarray:
        """Predict anomaly probabilities using ensemble"""
        if not self.is_trained:
            raise ValueError("Ensemble must be trained before making predictions")
        
        # Get probability scores from both models
        if_proba = self.isolation_forest.predict_proba(df)
        
        # Get K-Means risk scores and normalize
        km_analysis = self.kmeans.analyze_transactions(df)
        km_risk_scores = km_analysis['cluster_risk_score'].values / 100.0
        
        # Weighted ensemble probability
        ensemble_proba = (
            if_proba * self.ensemble_weights['isolation_forest'] +
            km_risk_scores * self.ensemble_weights['kmeans']
        )
        
        return ensemble_proba
    
    def analyze_transactions(self, df: pd.DataFrame) -> pd.DataFrame:
        """Comprehensive analysis using both models"""
        if not self.is_trained:
            raise ValueError("Ensemble must be trained before analysis")
        
        # Get analysis from both models
        if_results = self.isolation_forest.analyze_transactions(df)
        km_results = self.kmeans.analyze_transactions(df)
        
        # Combine results
        ensemble_results = df.copy()
        
        # Add Isolation Forest results
        ensemble_results['if_anomaly_score'] = if_results['anomaly_score']
        ensemble_results['if_risk_score'] = if_results['risk_score']
        ensemble_results['if_risk_level'] = if_results['risk_level']
        ensemble_results['if_risk_factors'] = if_results['top_risk_factors']
        
        # Add K-Means results
        ensemble_results['km_cluster_id'] = km_results['cluster_id']
        ensemble_results['km_distance_to_center'] = km_results['distance_to_center']
        ensemble_results['km_is_outlier'] = km_results['is_outlier']
        ensemble_results['km_cluster_risk_score'] = km_results['cluster_risk_score']
        ensemble_results['km_cluster_characteristics'] = km_results['cluster_characteristics']
        ensemble_results['km_outlier_explanation'] = km_results['outlier_explanation']
        
        # Calculate ensemble predictions
        ensemble_predictions = self.predict(df)
        ensemble_proba = self.predict_proba(df)
        
        ensemble_results['ensemble_is_anomaly'] = ensemble_predictions.astype(bool)
        ensemble_results['ensemble_probability'] = ensemble_proba
        ensemble_results['ensemble_risk_score'] = self._calculate_ensemble_risk_score(
            if_results, km_results, ensemble_proba
        )
        
        # Add final risk level and explanation
        ensemble_results = self._add_final_analysis(ensemble_results)
        
        return ensemble_results
    
    def _calculate_ensemble_risk_score(
        self, 
        if_results: pd.DataFrame, 
        km_results: pd.DataFrame, 
        ensemble_proba: np.ndarray
    ) -> np.ndarray:
        """Calculate final ensemble risk score"""
        risk_scores = np.zeros(len(if_results))
        
        for i in range(len(if_results)):
            # Base risk from ensemble probability
            base_risk = ensemble_proba[i] * 100
            
            # Isolation Forest contribution
            if_risk = if_results.iloc[i]['risk_score'] * 0.4
            
            # K-Means contribution
            km_risk = km_results.iloc[i]['cluster_risk_score'] * 0.3
            
            # Consensus bonus (if both models agree)
            consensus_bonus = 0
            if if_results.iloc[i]['is_anomaly'] and km_results.iloc[i]['is_outlier']:
                consensus_bonus = 15  # Boost when both models agree
            
            # Final risk score
            total_risk = base_risk * 0.3 + if_risk + km_risk + consensus_bonus
            risk_scores[i] = min(total_risk, 100)
        
        return risk_scores
    
    def _add_final_analysis(self, results: pd.DataFrame) -> pd.DataFrame:
        """Add final risk analysis and explanations"""
        # Final risk level
        results['final_risk_level'] = pd.cut(
            results['ensemble_risk_score'],
            bins=[0, 30, 60, 80, 100],
            labels=['Low', 'Medium', 'High', 'Critical']
        )
        
        # Generate comprehensive explanation
        results['final_explanation'] = results.apply(
            lambda row: self._generate_final_explanation(row), axis=1
        )
        
        # Add recommended actions
        results['recommended_action'] = results.apply(
            lambda row: self._recommend_action(row), axis=1
        )
        
        return results
    
    def _generate_final_explanation(self, row: pd.Series) -> str:
        """Generate comprehensive explanation for the risk assessment"""
        risk_score = row['ensemble_risk_score']
        explanations = []
        
        # Base explanation
        if risk_score >= 80:
            explanations.append("CRITICAL RISK: Multiple fraud indicators detected")
        elif risk_score >= 60:
            explanations.append("HIGH RISK: Suspicious patterns identified")
        elif risk_score >= 40:
            explanations.append("MEDIUM RISK: Some unusual characteristics")
        else:
            explanations.append("LOW RISK: Transaction appears normal")
        
        # Model-specific explanations
        if row['if_anomaly_score'] > 0.7:
            explanations.append("Isolation Forest: Strong anomaly detected")
        
        if row['km_is_outlier']:
            explanations.append("K-Means: Transaction is an outlier in its cluster")
        
        # Feature-specific explanations
        if pd.notna(row['if_risk_factors']):
            explanations.append(f"Key factors: {row['if_risk_factors']}")
        
        if pd.notna(row['km_outlier_explanation']) and row['km_outlier_explanation'] != "Not an outlier":
            explanations.append(f"Clustering: {row['km_outlier_explanation']}")
        
        return "; ".join(explanations)
    
    def _recommend_action(self, row: pd.Series) -> str:
        """Recommend action based on risk assessment"""
        risk_score = row['ensemble_risk_score']
        
        if risk_score >= 80:
            return "IMMEDIATE REVIEW: Block transaction and contact customer"
        elif risk_score >= 60:
            return "HIGH PRIORITY: Manual review required within 1 hour"
        elif risk_score >= 40:
            return "MEDIUM PRIORITY: Review within 24 hours"
        else:
            return "LOW PRIORITY: Routine monitoring"
    
    def _calculate_ensemble_score(self, if_metrics: Dict, km_metrics: Dict) -> float:
        """Calculate overall ensemble performance score"""
        # Isolation Forest metrics
        if_f1 = if_metrics.get('f1_score', 0)
        if_auc = if_metrics.get('auc_roc', 0)
        
        # K-Means metrics
        km_silhouette = km_metrics.get('silhouette_score', 0)
        
        # Weighted ensemble score
        ensemble_score = (
            (if_f1 * 0.4) +
            (if_auc * 0.3) +
            (km_silhouette * 0.3)
        )
        
        return ensemble_score
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Get combined feature importance from both models"""
        if_importance = self.isolation_forest._get_feature_importance()
        
        # Combine with feature weights
        combined_importance = {}
        for feature, weight in self.feature_weights.items():
            combined_importance[feature] = weight
        
        # Add model-specific importances
        for feature, importance in if_importance.items():
            if feature not in combined_importance:
                combined_importance[feature] = importance * 0.5
        
        return combined_importance
    
    def get_model_summary(self) -> Dict[str, Any]:
        """Get comprehensive model summary"""
        return {
            'ensemble_type': 'IsolationForest + KMeans',
            'is_trained': self.is_trained,
            'models': {
                'isolation_forest': self.isolation_forest.get_model_info(),
                'kmeans': self.kmeans.get_model_info()
            },
            'ensemble_weights': self.ensemble_weights,
            'feature_weights': self.feature_weights,
            'metrics': {
                'isolation_forest': self.metrics.get_metrics('isolation_forest'),
                'kmeans_clustering': self.metrics.get_metrics('kmeans_clustering')
            }
        }
    
    def save_model(self, filepath: str) -> None:
        """Save the ensemble model"""
        if not self.is_trained:
            raise ValueError("Ensemble must be trained before saving")
        
        model_data = {
            'isolation_forest': self.isolation_forest,
            'kmeans': self.kmeans,
            'config': self.config,
            'metrics': self.metrics,
            'ensemble_weights': self.ensemble_weights,
            'feature_weights': self.feature_weights,
            'is_trained': self.is_trained
        }
        
        joblib.dump(model_data, filepath)
    
    def load_model(self, filepath: str) -> None:
        """Load a trained ensemble model"""
        model_data = joblib.load(filepath)
        
        self.isolation_forest = model_data['isolation_forest']
        self.kmeans = model_data['kmeans']
        self.config = model_data['config']
        self.metrics = model_data['metrics']
        self.ensemble_weights = model_data['ensemble_weights']
        self.feature_weights = model_data['feature_weights']
        self.is_trained = model_data['is_trained']
    
    def update_ensemble_weights(self, new_weights: Dict[str, float]) -> None:
        """Update ensemble weights"""
        total_weight = sum(new_weights.values())
        if abs(total_weight - 1.0) > 0.01:
            raise ValueError("Ensemble weights must sum to 1.0")
        
        self.ensemble_weights = new_weights.copy()
    
    def update_feature_weights(self, new_weights: Dict[str, float]) -> None:
        """Update feature weights"""
        self.feature_weights = new_weights.copy()
    
    def cross_validate(self, df: pd.DataFrame, labels: pd.Series) -> Dict[str, float]:
        """Perform cross-validation on the ensemble"""
        # This would require more sophisticated implementation
        # For now, return individual model cross-validation results
        if_cv = self.isolation_forest.cross_validate(df, labels)
        
        return {
            'isolation_forest_cv': if_cv,
            'ensemble_performance': 'Cross-validation not implemented for ensemble'
        }
