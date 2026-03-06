from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class TransactionBase(BaseModel):
    transaction_id: str = Field(..., description="Unique transaction identifier")
    amount: float = Field(..., gt=0, description="Transaction amount")
    timestamp: datetime = Field(..., description="Transaction timestamp")
    merchant: Optional[str] = Field(None, description="Merchant name")
    category: Optional[str] = Field(None, description="Transaction category")
    account_id: str = Field(..., description="Account identifier")

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    merchant: Optional[str] = None
    category: Optional[str] = None

class TransactionResponse(TransactionBase):
    id: int
    risk_score: float
    is_suspicious: bool
    fraud_probability: float
    anomaly_score: float
    ai_explanation: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class AlertBase(BaseModel):
    alert_type: str
    severity: str
    message: str

class AlertCreate(AlertBase):
    transaction_id: str

class AlertResponse(AlertBase):
    id: int
    transaction_id: str
    is_resolved: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class AnalysisJobBase(BaseModel):
    job_id: str
    status: str
    total_transactions: int
    suspicious_transactions: int

class AnalysisJobCreate(BaseModel):
    job_id: str

class AnalysisJobResponse(AnalysisJobBase):
    id: int
    processing_time: Optional[float]
    error_message: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class FileUploadResponse(BaseModel):
    message: str
    job_id: str
    total_transactions: int

class AnalyticsData(BaseModel):
    total_transactions: int
    suspicious_transactions: int
    fraud_rate: float
    average_risk_score: float
    total_amount: float
    suspicious_amount: float
    category_distribution: Dict[str, int]
    risk_distribution: Dict[str, int]
    time_series_data: List[Dict[str, Any]]

class AlertSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AlertType(str, Enum):
    HIGH_AMOUNT = "high_amount"
    UNUSUAL_TIME = "unusual_time"
    FREQUENCY = "frequency"
    UNKNOWN_MERCHANT = "unknown_merchant"
    ABNORMAL_PATTERN = "abnormal_pattern"

class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

# Batch transaction upload schema
class BatchTransactionUpload(BaseModel):
    transactions: List[TransactionCreate]
    
    @validator('transactions')
    def validate_transactions_not_empty(cls, v):
        if not v:
            raise ValueError('At least one transaction must be provided')
        return v

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# AI Analysis Request
class AIAnalysisRequest(BaseModel):
    transaction_ids: List[str] = Field(..., description="List of transaction IDs to analyze")
    analysis_types: List[str] = Field(default=["fraud_detection", "anomaly_detection"], description="Types of analysis to perform")

# AI Analysis Response
class AIAnalysisResponse(BaseModel):
    job_id: str
    analyzed_transactions: int
    suspicious_found: int
    analysis_summary: Dict[str, Any]
