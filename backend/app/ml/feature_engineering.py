import pandas as pd
import numpy as np
from app.ml.config import MLConfig
from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.decomposition import PCA
import warnings
warnings.filterwarnings('ignore')

class FeatureEngineer:
    """Feature engineering for transaction fraud detection"""
    
    def __init__(self, config=None):
        self.config = config or MLConfig()
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.is_fitted = False
        
    def fit(self, df: pd.DataFrame) -> 'FeatureEngineer':
        """Fit the feature engineer on training data"""
        df_features = self._create_features(df)
        
        # Identify numerical and categorical features
        numerical_features = df_features.select_dtypes(include=[np.number]).columns.tolist()
        categorical_features = df_features.select_dtypes(include=['object', 'category']).columns.tolist()
        
        # Fit scaler on numerical features
        if numerical_features and self.config.FEATURE_SCALING:
            self.scaler.fit(df_features[numerical_features])
        
        # Fit label encoders on categorical features
        for feature in categorical_features:
            if feature in df_features.columns:
                le = LabelEncoder()
                le.fit(df_features[feature].fillna('Unknown'))
                self.label_encoders[feature] = le
        
        self.is_fitted = True
        return self
    
    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform new data using fitted parameters"""
        if not self.is_fitted:
            raise ValueError("FeatureEngineer must be fitted before transforming data")
        
        df_features = self._create_features(df)
        
        # Apply scaling to numerical features
        numerical_features = df_features.select_dtypes(include=[np.number]).columns.tolist()
        if numerical_features and self.config.FEATURE_SCALING:
            df_features[numerical_features] = self.scaler.transform(df_features[numerical_features])
        
        # Apply label encoding to categorical features
        for feature, encoder in self.label_encoders.items():
            if feature in df_features.columns:
                df_features[feature] = encoder.transform(df_features[feature].fillna('Unknown'))
        
        return df_features
    
    def fit_transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Fit and transform in one step"""
        return self.fit(df).transform(df)
    
    def _create_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create all features from raw transaction data"""
        df_features = df.copy()
        
        # Ensure timestamp is datetime
        if 'timestamp' in df_features.columns:
            df_features['timestamp'] = pd.to_datetime(df_features['timestamp'])
        
        # Time-based features
        df_features = self._create_time_features(df_features)
        
        # Amount-based features
        df_features = self._create_amount_features(df_features)
        
        # Merchant-based features
        df_features = self._create_merchant_features(df_features)
        
        # Frequency features
        df_features = self._create_frequency_features(df_features)
        
        # Account-based features
        df_features = self._create_account_features(df_features)
        
        # Interaction features
        df_features = self._create_interaction_features(df_features)
        
        # Handle missing values
        df_features = self._handle_missing_values(df_features)
        
        return df_features
    
    def _create_time_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create time-based features"""
        if 'timestamp' not in df.columns:
            return df
        
        # Extract time components
        df['hour'] = df['timestamp'].dt.hour
        df['day_of_week'] = df['timestamp'].dt.dayofweek
        df['day_of_month'] = df['timestamp'].dt.day
        df['month'] = df['timestamp'].dt.month
        df['quarter'] = df['timestamp'].dt.quarter
        df['year'] = df['timestamp'].dt.year
        
        # Cyclical encoding for time features
        df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
        df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
        df['day_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
        df['day_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
        df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
        df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
        
        # Special time periods
        df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
        df['is_night'] = ((df['hour'] >= 22) | (df['hour'] <= 6)).astype(int)
        df['is_business_hours'] = ((df['hour'] >= 9) & (df['hour'] <= 17)).astype(int)
        
        # Time since last transaction (will be calculated later)
        df['time_since_last_transaction'] = 0
        
        return df
    
    def _create_amount_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create amount-based features"""
        if 'amount' not in df.columns:
            return df
        
        # Log transformation
        df['amount_log'] = np.log1p(df['amount'])
        
        # Amount categories
        df['amount_category'] = pd.cut(
            df['amount'], 
            bins=[0, 10, 50, 100, 500, 1000, 5000, float('inf')],
            labels=['very_small', 'small', 'medium', 'large', 'very_large', 'huge', 'massive']
        )
        
        # Round amount detection
        df['is_round_amount'] = (df['amount'] % 100 == 0).astype(int)
        df['is_very_round_amount'] = (df['amount'] % 1000 == 0).astype(int)
        
        # Amount ratios (will be calculated with account context)
        df['amount_to_avg_ratio'] = 1.0  # Placeholder
        
        return df
    
    def _create_merchant_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create merchant-based features"""
        if 'merchant' not in df.columns:
            return df
        
        # Merchant name cleaning
        df['merchant_clean'] = df['merchant'].fillna('Unknown').str.lower().str.strip()
        
        # Merchant type classification
        df['is_known_merchant'] = (df['merchant_clean'] != 'unknown').astype(int)
        df['merchant_length'] = df['merchant_clean'].str.len()
        
        # Merchant frequency (will be calculated later)
        df['merchant_frequency'] = 1  # Placeholder
        
        return df
    
    def _create_frequency_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create frequency-based features"""
        if 'timestamp' not in df.columns or 'account_id' not in df.columns:
            return df
        
        # Sort by account and timestamp
        df_sorted = df.sort_values(['account_id', 'timestamp'])
        
        # Calculate transactions per day/week/month for each account
        for period in ['day', 'week', 'month']:
            df[f'transactions_per_{period}'] = 0  # Placeholder
        
        # Time since last transaction
        df_sorted['time_diff'] = df_sorted.groupby('account_id')['timestamp'].diff()
        df_sorted['time_since_last_transaction'] = df_sorted['time_diff'].dt.total_seconds() / 3600  # in hours
        df_sorted['time_since_last_transaction'] = df_sorted['time_since_last_transaction'].fillna(24)  # Default 24 hours
        
        # Rapid transaction detection
        df_sorted['is_rapid_transaction'] = (df_sorted['time_since_last_transaction'] < 1).astype(int)
        
        return df_sorted
    
    def _create_account_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create account-based features"""
        if 'account_id' not in df.columns:
            return df
        
        # Account statistics (will be calculated with historical data)
        df['account_avg_amount'] = 0  # Placeholder
        df['account_std_amount'] = 0  # Placeholder
        df['account_transaction_count'] = 0  # Placeholder
        
        return df
    
    def _create_interaction_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create interaction features"""
        # Amount * time interactions
        if 'amount' in df.columns and 'hour' in df.columns:
            df['amount_hour_interaction'] = df['amount'] * df['is_night']
        
        # Merchant * amount interactions
        if 'amount' in df.columns and 'is_known_merchant' in df.columns:
            df['amount_merchant_interaction'] = df['amount'] * df['is_known_merchant']
        
        # Frequency * amount interactions
        if 'amount' in df.columns and 'is_rapid_transaction' in df.columns:
            df['amount_frequency_interaction'] = df['amount'] * df['is_rapid_transaction']
        
        return df
    
    def _handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values in features"""
        # Fill numerical missing values with median
        numerical_columns = df.select_dtypes(include=[np.number]).columns
        for col in numerical_columns:
            if df[col].isnull().any():
                df[col] = df[col].fillna(df[col].median())
        
        # Fill categorical missing values with 'Unknown'
        categorical_columns = df.select_dtypes(include=['object', 'category']).columns
        for col in categorical_columns:
            if df[col].isnull().any():
                df[col] = df[col].fillna('Unknown')
        
        return df
    
    def get_feature_names(self) -> List[str]:
        """Get list of all feature names"""
        if not self.is_fitted:
            raise ValueError("FeatureEngineer must be fitted first")
        
        # This would be populated during fitting
        return [
            'hour', 'day_of_week', 'day_of_month', 'month', 'quarter',
            'hour_sin', 'hour_cos', 'day_sin', 'day_cos', 'month_sin', 'month_cos',
            'is_weekend', 'is_night', 'is_business_hours',
            'amount_log', 'is_round_amount', 'is_very_round_amount',
            'is_known_merchant', 'merchant_length',
            'time_since_last_transaction', 'is_rapid_transaction',
            'amount_hour_interaction', 'amount_merchant_interaction', 'amount_frequency_interaction'
        ]
    
    def get_feature_importance_groups(self) -> Dict[str, List[str]]:
        """Get feature groups for importance analysis"""
        return {
            'time_features': [
                'hour', 'day_of_week', 'day_of_month', 'month', 'quarter',
                'hour_sin', 'hour_cos', 'day_sin', 'day_cos', 'month_sin', 'month_cos',
                'is_weekend', 'is_night', 'is_business_hours'
            ],
            'amount_features': [
                'amount_log', 'is_round_amount', 'is_very_round_amount'
            ],
            'merchant_features': [
                'is_known_merchant', 'merchant_length'
            ],
            'frequency_features': [
                'time_since_last_transaction', 'is_rapid_transaction'
            ],
            'interaction_features': [
                'amount_hour_interaction', 'amount_merchant_interaction', 'amount_frequency_interaction'
            ]
        }
