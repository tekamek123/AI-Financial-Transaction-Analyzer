import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score, calinski_harabasz_score, davies_bouldin_score
from sklearn.preprocessing import StandardScaler
from typing import Dict, Tuple, List, Optional, Any
import joblib
import warnings
warnings.filterwarnings('ignore')

from app.ml.config import MLConfig, ModelMetrics
from app.ml.feature_engineering import FeatureEngineer

class KMeansModel:
    """K-Means clustering model for transaction pattern analysis"""
    
    def __init__(self, config: Optional[MLConfig] = None):
        self.config = config or MLConfig()
        self.model = None
        self.feature_engineer = FeatureEngineer(self.config)
        self.metrics = ModelMetrics()
        self.is_trained = False
        self.cluster_centers = None
        self.cluster_labels = None
        self.cluster_stats = {}
        
        # Initialize K-Means with configuration
        self.model = KMeans(
            n_clusters=self.config.KMEANS_N_CLUSTERS,
            random_state=self.config.KMEANS_RANDOM_STATE,
            max_iter=self.config.KMEANS_MAX_ITER,
            n_init=self.config.KMEANS_N_INIT,
            n_jobs=-1
        )
    
    def train(self, df: pd.DataFrame) -> Dict[str, float]:
        """Train the K-Means model"""
        if len(df) < self.config.MIN_TRAINING_SAMPLES:
            raise ValueError(f"Need at least {self.config.MIN_TRAINING_SAMPLES} samples for training")
        
        # Feature engineering
        X = self.feature_engineer.fit_transform(df)
        
        # Find optimal number of clusters using elbow method and silhouette analysis
        optimal_clusters = self._find_optimal_clusters(X)
        
        # Update model with optimal clusters
        self.model = KMeans(
            n_clusters=optimal_clusters,
            random_state=self.config.KMEANS_RANDOM_STATE,
            max_iter=self.config.KMEANS_MAX_ITER,
            n_init=self.config.KMEANS_N_INIT,
            n_jobs=-1
        )
        
        # Train the model
        self.model.fit(X)
        self.is_trained = True
        
        # Store cluster information
        self.cluster_centers = self.model.cluster_centers_
        self.cluster_labels = self.model.labels_
        
        # Calculate cluster statistics
        self._calculate_cluster_stats(X, df)
        
        # Calculate training metrics
        training_metrics = self._calculate_clustering_metrics(X)
        self.metrics.update_metrics("kmeans_clustering", training_metrics)
        
        return training_metrics
    
    def predict(self, df: pd.DataFrame) -> np.ndarray:
        """Predict cluster labels for new data"""
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")
        
        X = self.feature_engineer.transform(df)
        return self.model.predict(X)
    
    def analyze_transactions(self, df: pd.DataFrame) -> pd.DataFrame:
        """Analyze transactions and return detailed clustering results"""
        if not self.is_trained:
            raise ValueError("Model must be trained before analysis")
        
        # Predict clusters
        cluster_labels = self.predict(df)
        
        # Calculate distances to cluster centers
        X = self.feature_engineer.transform(df)
        distances = self._calculate_distances_to_centers(X)
        
        # Create results dataframe
        results = df.copy()
        results['cluster_id'] = cluster_labels
        results['distance_to_center'] = distances
        results['is_outlier'] = self._identify_outliers(distances)
        results['cluster_size'] = [self.cluster_stats.get(label, {}).get('size', 0) for label in cluster_labels]
        results['cluster_risk_score'] = self._calculate_cluster_risk_score(cluster_labels, distances)
        
        # Add detailed analysis
        results = self._add_cluster_analysis(results)
        
        return results
    
    def _find_optimal_clusters(self, X: np.ndarray) -> int:
        """Find optimal number of clusters using elbow method and silhouette analysis"""
        max_clusters = min(20, len(X) // 10)  # Don't exceed reasonable limits
        cluster_range = range(2, max_clusters + 1)
        
        inertias = []
        silhouette_scores = []
        
        for n_clusters in cluster_range:
            kmeans = KMeans(
                n_clusters=n_clusters,
                random_state=self.config.KMEANS_RANDOM_STATE,
                max_iter=self.config.KMEANS_MAX_ITER,
                n_init=self.config.KMEANS_N_INIT,
                n_jobs=-1
            )
            kmeans.fit(X)
            
            inertias.append(kmeans.inertia_)
            
            # Calculate silhouette score
            if n_clusters < len(X):
                sil_score = silhouette_score(X, kmeans.labels_)
                silhouette_scores.append(sil_score)
            else:
                silhouette_scores.append(0)
        
        # Find elbow point (simplified version)
        optimal_clusters = self._find_elbow_point(list(cluster_range), inertias)
        
        # Validate with silhouette score
        if optimal_clusters <= len(silhouette_scores):
            sil_score = silhouette_scores[optimal_clusters - 2]  # Adjust for 0-based index
            if sil_score < 0.3:  # Poor clustering
                optimal_clusters = max(3, optimal_clusters - 1)
        
        return optimal_clusters
    
    def _find_elbow_point(self, x_values: List[int], y_values: List[float]) -> int:
        """Find elbow point in the curve"""
        if len(x_values) < 3:
            return x_values[0]
        
        # Calculate second derivative to find elbow
        n_points = len(y_values)
        second_derivatives = []
        
        for i in range(1, n_points - 1):
            d2 = (y_values[i+1] - 2*y_values[i] + y_values[i-1])
            second_derivatives.append(abs(d2))
        
        if second_derivatives:
            elbow_index = np.argmax(second_derivatives) + 1  # Adjust for 0-based index
            return x_values[min(elbow_index, len(x_values) - 1)]
        
        return x_values[len(x_values) // 2]
    
    def _calculate_distances_to_centers(self, X: np.ndarray) -> np.ndarray:
        """Calculate distances from each point to its cluster center"""
        distances = np.zeros(len(X))
        
        for i in range(len(X)):
            cluster_label = self.model.labels_[i] if i < len(self.model.labels_) else 0
            if cluster_label < len(self.cluster_centers):
                center = self.cluster_centers[cluster_label]
                distances[i] = np.linalg.norm(X[i] - center)
        
        return distances
    
    def _identify_outliers(self, distances: np.ndarray) -> np.ndarray:
        """Identify outliers based on distance to cluster centers"""
        # Calculate threshold based on percentile
        threshold = np.percentile(distances, 95)  # Top 5% as outliers
        return distances > threshold
    
    def _calculate_cluster_risk_score(self, cluster_labels: np.ndarray, distances: np.ndarray) -> np.ndarray:
        """Calculate risk score based on cluster characteristics"""
        risk_scores = np.zeros(len(cluster_labels))
        
        for i, (label, distance) in enumerate(zip(cluster_labels, distances)):
            cluster_info = self.cluster_stats.get(label, {})
            
            # Base risk from distance to center
            distance_risk = min(distance * 10, 50)  # Scale distance to risk
            
            # Cluster-based risk
            cluster_risk = cluster_info.get('risk_score', 0)
            
            # Size-based risk (smaller clusters are riskier)
            size_risk = max(0, 30 - cluster_info.get('size', 0) * 0.5)
            
            # Combined risk score
            total_risk = distance_risk + cluster_risk + size_risk
            risk_scores[i] = min(total_risk, 100)
        
        return risk_scores
    
    def _calculate_cluster_stats(self, X: np.ndarray, df: pd.DataFrame):
        """Calculate statistics for each cluster"""
        self.cluster_stats = {}
        
        for cluster_id in range(len(self.cluster_centers)):
            cluster_mask = self.cluster_labels == cluster_id
            cluster_data = X[cluster_mask]
            cluster_df = df.iloc[cluster_mask] if len(cluster_df) == len(X) else df
            
            if len(cluster_data) == 0:
                continue
            
            # Basic statistics
            stats = {
                'size': len(cluster_data),
                'center': self.cluster_centers[cluster_id].tolist(),
                'avg_distance': np.mean(np.linalg.norm(cluster_data - self.cluster_centers[cluster_id], axis=1)),
                'std_distance': np.std(np.linalg.norm(cluster_data - self.cluster_centers[cluster_id], axis=1))
            }
            
            # Transaction-specific statistics
            if 'amount' in cluster_df.columns:
                stats['avg_amount'] = cluster_df['amount'].mean()
                stats['std_amount'] = cluster_df['amount'].std()
                stats['total_amount'] = cluster_df['amount'].sum()
            
            # Risk score based on cluster characteristics
            risk_factors = []
            if stats['size'] < self.config.CLUSTER_SIZE_THRESHOLD:
                risk_factors.append(20)  # Small cluster risk
            if stats['std_distance'] > 2.0:
                risk_factors.append(15)  # High variance risk
            if stats.get('std_amount', 0) > stats.get('avg_amount', 0):
                risk_factors.append(10)  # High amount variance risk
            
            stats['risk_score'] = sum(risk_factors)
            stats['risk_factors'] = risk_factors
            
            self.cluster_stats[cluster_id] = stats
    
    def _calculate_clustering_metrics(self, X: np.ndarray) -> Dict[str, float]:
        """Calculate clustering performance metrics"""
        metrics = {}
        
        # Silhouette score
        try:
            metrics['silhouette_score'] = silhouette_score(X, self.model.labels_)
        except:
            metrics['silhouette_score'] = 0.0
        
        # Inertia
        metrics['inertia'] = self.model.inertia_
        
        # Calinski-Harabasz score
        try:
            metrics['calinski_harabasz_score'] = calinski_harabasz_score(X, self.model.labels_)
        except:
            metrics['calinski_harabasz_score'] = 0.0
        
        # Davies-Bouldin score
        try:
            metrics['davies_bouldin_score'] = davies_bouldin_score(X, self.model.labels_)
        except:
            metrics['davies_bouldin_score'] = 0.0
        
        return metrics
    
    def _add_cluster_analysis(self, results: pd.DataFrame) -> pd.DataFrame:
        """Add detailed cluster analysis to results"""
        # Add cluster characteristics
        results['cluster_characteristics'] = results['cluster_id'].apply(
            lambda x: self._describe_cluster(x)
        )
        
        # Add outlier explanation
        results['outlier_explanation'] = results.apply(
            lambda row: self._explain_outlier(row), axis=1
        )
        
        return results
    
    def _describe_cluster(self, cluster_id: int) -> str:
        """Describe a cluster in human-readable terms"""
        cluster_info = self.cluster_stats.get(cluster_id, {})
        
        if not cluster_info:
            return "Unknown cluster"
        
        size = cluster_info.get('size', 0)
        avg_amount = cluster_info.get('avg_amount', 0)
        risk_score = cluster_info.get('risk_score', 0)
        
        description = f"Cluster {cluster_id}: "
        
        if size > 100:
            description += "Large cluster"
        elif size > 50:
            description += "Medium cluster"
        else:
            description += "Small cluster"
        
        if avg_amount > 1000:
            description += ", high-value transactions"
        elif avg_amount > 100:
            description += ", medium-value transactions"
        else:
            description += ", low-value transactions"
        
        if risk_score > 30:
            description += ", high risk"
        elif risk_score > 15:
            description += ", medium risk"
        else:
            description += ", low risk"
        
        return description
    
    def _explain_outlier(self, row: pd.Series) -> str:
        """Explain why a transaction is considered an outlier"""
        if not row.get('is_outlier', False):
            return "Not an outlier"
        
        explanations = []
        
        # Distance-based explanation
        if row.get('distance_to_center', 0) > 2.0:
            explanations.append("Far from cluster center")
        
        # Cluster size explanation
        cluster_size = row.get('cluster_size', 0)
        if cluster_size < self.config.CLUSTER_SIZE_THRESHOLD:
            explanations.append(f"Belongs to small cluster (size: {cluster_size})")
        
        # Risk score explanation
        risk_score = row.get('cluster_risk_score', 0)
        if risk_score > 70:
            explanations.append("High cluster risk score")
        
        return "; ".join(explanations) if explanations else "Outlier detected"
    
    def get_cluster_summary(self) -> Dict[int, Dict[str, Any]]:
        """Get summary of all clusters"""
        return self.cluster_stats.copy()
    
    def save_model(self, filepath: str) -> None:
        """Save the trained model"""
        if not self.is_trained:
            raise ValueError("Model must be trained before saving")
        
        model_data = {
            'model': self.model,
            'feature_engineer': self.feature_engineer,
            'config': self.config,
            'metrics': self.metrics,
            'cluster_centers': self.cluster_centers,
            'cluster_stats': self.cluster_stats,
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
        self.cluster_centers = model_data['cluster_centers']
        self.cluster_stats = model_data['cluster_stats']
        self.is_trained = model_data['is_trained']
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get model information"""
        return {
            'model_type': 'KMeans',
            'is_trained': self.is_trained,
            'config': {
                'n_clusters': self.model.n_clusters if self.is_trained else self.config.KMEANS_N_CLUSTERS,
                'random_state': self.config.KMEANS_RANDOM_STATE,
                'max_iter': self.config.KMEANS_MAX_ITER,
                'n_init': self.config.KMEANS_N_INIT
            },
            'metrics': self.metrics.get_metrics('kmeans_clustering'),
            'cluster_count': len(self.cluster_centers) if self.cluster_centers is not None else 0
        }
