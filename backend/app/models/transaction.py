from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, unique=True, index=True, nullable=False)
    amount = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    merchant = Column(String, nullable=True)
    category = Column(String, nullable=True)
    account_id = Column(String, nullable=False, index=True)
    
    # AI Analysis Fields
    risk_score = Column(Float, default=0.0)
    is_suspicious = Column(Boolean, default=False)
    fraud_probability = Column(Float, default=0.0)
    anomaly_score = Column(Float, default=0.0)
    
    # AI Explanation
    ai_explanation = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    alerts = relationship("Alert", back_populates="transaction")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, ForeignKey("transactions.transaction_id"), nullable=False)
    alert_type = Column(String, nullable=False)  # "high_amount", "unusual_time", "frequency", etc.
    severity = Column(String, nullable=False)  # "low", "medium", "high", "critical"
    message = Column(Text, nullable=False)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    transaction = relationship("Transaction", back_populates="alerts")

class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, unique=True, index=True, nullable=False)
    status = Column(String, default="pending")  # "pending", "processing", "completed", "failed"
    total_transactions = Column(Integer, default=0)
    suspicious_transactions = Column(Integer, default=0)
    processing_time = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
