import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
import os
import joblib
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

from app.ml.config import MLConfig, ModelMetrics
from app.ml.ensemble_model import EnsembleModel
from app.ml.isolation_forest_model import IsolationForestModel
from app.ml.kmeans_model import KMeansModel
from app.ml.feature_engineering import FeatureEngineer

class ModelManager:
    """Manager class for all ML models and model operations"""
    
    def __init__(self, config: Optional[MLConfig] = None):
        self.config = config or MLConfig()
        self.ensemble_model = EnsembleModel(self.config)
        self.isolation_forest = IsolationForestModel(self.config)
        self.kmeans = KMeansModel(self.config)
        
        # Model registry
        self.models = {
            'ensemble': self.ensemble_model,
            'isolation_forest': self.isolation_forest,
            'kmeans': self.kmeans
        }
        
        # Model storage paths
        self.model_storage_path = self.config.MODEL_SAVE_PATH
        os.makedirs(self.model_storage_path, exist_ok=True)
        
        # Training history
        self.training_history = []
    
    def train_all_models(self, df: pd.DataFrame, labels: Optional[pd.Series] = None) -> Dict[str, Any]:
        """Train all available models"""
        training_results = {}
        
        # Validate data
        if len(df) < self.config.MIN_TRAINING_SAMPLES:
            raise ValueError(f"Need at least {self.config.MIN_TRAINING_SAMPLES} samples for training")
        
        # Train ensemble (which trains individual models)
        print("Training ensemble model...")
        ensemble_results = self.ensemble_model.train(df, labels)
        training_results['ensemble'] = ensemble_results
        
        # Store training record
        training_record = {
            'timestamp': datetime.now(),
            'dataset_size': len(df),
            'models_trained': list(self.models.keys()),
            'results': training_results
        }
        self.training_history.append(training_record)
        
        return training_results
    
    def analyze_transactions(
        self, 
        df: pd.DataFrame, 
        model_name: str = 'ensemble'
    ) -> pd.DataFrame:
        """Analyze transactions using specified model"""
        if model_name not in self.models:
            raise ValueError(f"Model '{model_name}' not available. Available models: {list(self.models.keys())}")
        
        model = self.models[model_name]
        
        if not model.is_trained:
            raise ValueError(f"Model '{model_name}' must be trained before analysis")
        
        return model.analyze_transactions(df)
    
    def predict(
        self, 
        df: pd.DataFrame, 
        model_name: str = 'ensemble'
    ) -> np.ndarray:
        """Make predictions using specified model"""
        if model_name not in self.models:
            raise ValueError(f"Model '{model_name}' not available")
        
        model = self.models[model_name]
        
        if not model.is_trained:
            raise ValueError(f"Model '{model_name}' must be trained before prediction")
        
        return model.predict(df)
    
    def predict_proba(
        self, 
        df: pd.DataFrame, 
        model_name: str = 'ensemble'
    ) -> np.ndarray:
        """Predict probabilities using specified model"""
        if model_name not in self.models:
            raise ValueError(f"Model '{model_name}' not available")
        
        model = self.models[model_name]
        
        if not model.is_trained:
            raise ValueError(f"Model '{model_name}' must be trained before prediction")
        
        return model.predict_proba(df)
    
    def get_model_performance(self, model_name: str) -> Dict[str, Any]:
        """Get performance metrics for a specific model"""
        if model_name not in self.models:
            raise ValueError(f"Model '{model_name}' not available")
        
        model = self.models[model_name]
        return model.get_model_info()
    
    def get_all_models_performance(self) -> Dict[str, Dict[str, Any]]:
        """Get performance metrics for all models"""
        performance = {}
        for model_name, model in self.models.items():
            performance[model_name] = model.get_model_info()
        
        return performance
    
    def save_model(self, model_name: str, version: Optional[str] = None) -> str:
        """Save a specific model"""
        if model_name not in self.models:
            raise ValueError(f"Model '{model_name}' not available")
        
        model = self.models[model_name]
        
        if not model.is_trained:
            raise ValueError(f"Model '{model_name}' must be trained before saving")
        
        # Generate filename
        version = version or self.config.MODEL_VERSION
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{model_name}_{version}_{timestamp}.joblib"
        filepath = os.path.join(self.model_storage_path, filename)
        
        # Save model
        model.save_model(filepath)
        
        print(f"Model '{model_name}' saved to: {filepath}")
        return filepath
    
    def load_model(self, model_name: str, filepath: str) -> None:
        """Load a specific model"""
        if model_name not in self.models:
            raise ValueError(f"Model '{model_name}' not available")
        
        model = self.models[model_name]
        model.load_model(filepath)
        
        print(f"Model '{model_name}' loaded from: {filepath}")
    
    def save_all_models(self, version: Optional[str] = None) -> Dict[str, str]:
        """Save all trained models"""
        saved_files = {}
        
        for model_name in self.models.keys():
            try:
                filepath = self.save_model(model_name, version)
                saved_files[model_name] = filepath
            except Exception as e:
                print(f"Error saving model '{model_name}': {e}")
                saved_files[model_name] = None
        
        return saved_files
    
    def load_latest_models(self) -> Dict[str, str]:
        """Load the latest versions of all models"""
        loaded_files = {}
        
        for model_name in self.models.keys():
            try:
                # Find latest model file
                model_files = [f for f in os.listdir(self.model_storage_path) 
                           if f.startswith(model_name) and f.endswith('.joblib')]
                
                if model_files:
                    # Sort by timestamp (assuming filename format includes timestamp)
                    latest_file = sorted(model_files)[-1]
                    filepath = os.path.join(self.model_storage_path, latest_file)
                    
                    self.load_model(model_name, filepath)
                    loaded_files[model_name] = filepath
                    
            except Exception as e:
                print(f"Error loading model '{model_name}': {e}")
                loaded_files[model_name] = None
        
        return loaded_files
    
    def compare_models(self, df: pd.DataFrame, labels: pd.Series) -> Dict[str, Any]:
        """Compare performance of all models"""
        comparison_results = {}
        
        for model_name, model in self.models.items():
            try:
                # Train model if not trained
                if not model.is_trained:
                    print(f"Training {model_name} for comparison...")
                    if model_name == 'ensemble':
                        model.train(df, labels)
                    elif model_name == 'isolation_forest':
                        model.train(df, labels)
                    else:
                        model.train(df)
                
                # Get performance metrics
                metrics = model.get_model_info()
                comparison_results[model_name] = metrics
                
            except Exception as e:
                print(f"Error comparing model '{model_name}': {e}")
                comparison_results[model_name] = {'error': str(e)}
        
        return comparison_results
    
    def get_feature_importance(self, model_name: str = 'ensemble') -> Dict[str, float]:
        """Get feature importance for a specific model"""
        if model_name not in self.models:
            raise ValueError(f"Model '{model_name}' not available")
        
        model = self.models[model_name]
        
        if hasattr(model, 'get_feature_importance'):
            return model.get_feature_importance()
        elif hasattr(model, '_get_feature_importance'):
            return model._get_feature_importance()
        else:
            return {}
    
    def update_model_config(self, new_config: MLConfig) -> None:
        """Update configuration for all models"""
        self.config = new_config
        
        # Update each model's configuration
        for model in self.models.values():
            if hasattr(model, 'update_config'):
                model.update_config(new_config)
            elif hasattr(model, 'config'):
                model.config = new_config
    
    def get_training_history(self) -> List[Dict[str, Any]]:
        """Get training history"""
        return self.training_history.copy()
    
    def clear_training_history(self) -> None:
        """Clear training history"""
        self.training_history.clear()
    
    def validate_models(self) -> Dict[str, bool]:
        """Validate all models are properly configured"""
        validation_results = {}
        
        for model_name, model in self.models.items():
            try:
                # Check if model is properly initialized
                is_valid = (
                    hasattr(model, 'is_trained') and
                    hasattr(model, 'train') and
                    hasattr(model, 'predict') and
                    hasattr(model, 'analyze_transactions')
                )
                validation_results[model_name] = is_valid
                
                if is_valid and model.is_trained:
                    # Additional validation for trained models
                    validation_results[f"{model_name}_trained"] = True
                else:
                    validation_results[f"{model_name}_trained"] = False
                    
            except Exception as e:
                validation_results[model_name] = False
                validation_results[f"{model_name}_error"] = str(e)
        
        return validation_results
    
    def get_model_summary(self) -> Dict[str, Any]:
        """Get comprehensive summary of all models"""
        summary = {
            'manager_config': {
                'model_storage_path': self.model_storage_path,
                'available_models': list(self.models.keys()),
                'total_training_sessions': len(self.training_history)
            },
            'models': {},
            'validation': self.validate_models()
        }
        
        # Add individual model summaries
        for model_name, model in self.models.items():
            try:
                summary['models'][model_name] = model.get_model_info()
            except Exception as e:
                summary['models'][model_name] = {'error': str(e)}
        
        return summary
    
    def export_model_report(self, filepath: str) -> None:
        """Export comprehensive model report"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'config': self.config.__dict__ if hasattr(self.config, '__dict__') else str(self.config),
            'models': self.get_all_models_performance(),
            'training_history': self.get_training_history(),
            'validation': self.validate_models()
        }
        
        joblib.dump(report, filepath)
        print(f"Model report exported to: {filepath}")
    
    def batch_analyze(
        self, 
        df: pd.DataFrame, 
        batch_size: int = 1000,
        model_name: str = 'ensemble'
    ) -> pd.DataFrame:
        """Analyze large datasets in batches"""
        if len(df) <= batch_size:
            return self.analyze_transactions(df, model_name)
        
        results = []
        
        for i in range(0, len(df), batch_size):
            batch_df = df.iloc[i:i+batch_size]
            batch_results = self.analyze_transactions(batch_df, model_name)
            results.append(batch_results)
            
            print(f"Processed batch {i//batch_size + 1}/{(len(df)-1)//batch_size + 1}")
        
        return pd.concat(results, ignore_index=True)
