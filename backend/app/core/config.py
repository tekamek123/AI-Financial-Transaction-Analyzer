from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://username:password@localhost/transaction_analyzer"
    
    # API
    API_SECRET_KEY: str = "your-secret-key-change-in-production"
    API_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    ALLOWED_ORIGINS: list = ["http://localhost:3000"]
    
    # AI/ML Settings
    ISOLATION_FOREST_CONTAMINATION: float = 0.1
    KMEANS_N_CLUSTERS: int = 8
    RISK_THRESHOLD: int = 70
    
    # File Upload
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES: list = ["csv", "json"]
    
    # Debug
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"

settings = Settings()
