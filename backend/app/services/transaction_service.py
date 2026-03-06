from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from app.models.transaction import Transaction, Alert
from app.models.schemas import TransactionCreate, TransactionResponse, AlertResponse

class TransactionService:
    def __init__(self, db: Session):
        self.db = db

    async def create_transaction(self, transaction_data: Dict[str, Any]) -> TransactionResponse:
        """Create a single transaction"""
        # Convert timestamp string to datetime if needed
        if isinstance(transaction_data.get('timestamp'), str):
            transaction_data['timestamp'] = datetime.fromisoformat(
                transaction_data['timestamp'].replace('Z', '+00:00')
            )
        
        db_transaction = Transaction(**transaction_data)
        self.db.add(db_transaction)
        self.db.commit()
        self.db.refresh(db_transaction)
        
        return db_transaction

    async def create_batch_transactions(
        self, 
        transactions_data: List[Dict[str, Any]], 
        job_id: Optional[str] = None
    ) -> List[TransactionResponse]:
        """Create multiple transactions in batch"""
        created_transactions = []
        
        for transaction_data in transactions_data:
            try:
                # Convert timestamp string to datetime if needed
                if isinstance(transaction_data.get('timestamp'), str):
                    transaction_data['timestamp'] = datetime.fromisoformat(
                        transaction_data['timestamp'].replace('Z', '+00:00')
                    )
                
                # Set default values
                transaction_data.setdefault('risk_score', 0.0)
                transaction_data.setdefault('is_suspicious', False)
                transaction_data.setdefault('fraud_probability', 0.0)
                transaction_data.setdefault('anomaly_score', 0.0)
                
                db_transaction = Transaction(**transaction_data)
                self.db.add(db_transaction)
                created_transactions.append(db_transaction)
                
            except Exception as e:
                # Log error but continue processing other transactions
                print(f"Error creating transaction {transaction_data.get('transaction_id', 'unknown')}: {e}")
                continue
        
        # Commit all transactions at once
        if created_transactions:
            self.db.commit()
            # Refresh all to get their IDs
            for transaction in created_transactions:
                self.db.refresh(transaction)
        
        return created_transactions

    async def get_transaction_by_id(self, transaction_id: str) -> Optional[TransactionResponse]:
        """Get a transaction by its transaction_id"""
        return self.db.query(Transaction).filter(
            Transaction.transaction_id == transaction_id
        ).first()

    async def get_transactions(
        self,
        skip: int = 0,
        limit: int = 100,
        account_id: Optional[str] = None,
        is_suspicious: Optional[bool] = None,
        min_risk_score: Optional[float] = None
    ) -> List[TransactionResponse]:
        """Get transactions with optional filters"""
        query = self.db.query(Transaction)
        
        if account_id:
            query = query.filter(Transaction.account_id == account_id)
        
        if is_suspicious is not None:
            query = query.filter(Transaction.is_suspicious == is_suspicious)
        
        if min_risk_score is not None:
            query = query.filter(Transaction.risk_score >= min_risk_score)
        
        return query.order_by(Transaction.timestamp.desc()).offset(skip).limit(limit).all()

    async def update_transaction(
        self, 
        transaction_id: str, 
        update_data: Dict[str, Any]
    ) -> Optional[TransactionResponse]:
        """Update a transaction"""
        transaction = self.db.query(Transaction).filter(
            Transaction.transaction_id == transaction_id
        ).first()
        
        if not transaction:
            return None
        
        # Update fields
        for field, value in update_data.items():
            if hasattr(transaction, field):
                setattr(transaction, field, value)
        
        transaction.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(transaction)
        
        return transaction

    async def delete_transaction(self, transaction_id: str) -> bool:
        """Delete a transaction"""
        transaction = self.db.query(Transaction).filter(
            Transaction.transaction_id == transaction_id
        ).first()
        
        if not transaction:
            return False
        
        # Delete associated alerts first
        self.db.query(Alert).filter(Alert.transaction_id == transaction_id).delete()
        
        # Delete transaction
        self.db.delete(transaction)
        self.db.commit()
        
        return True

    async def get_transaction_alerts(self, transaction_id: str) -> List[AlertResponse]:
        """Get all alerts for a transaction"""
        return self.db.query(Alert).filter(
            Alert.transaction_id == transaction_id
        ).order_by(Alert.created_at.desc()).all()

    async def create_alert(
        self, 
        transaction_id: str, 
        alert_type: str, 
        severity: str, 
        message: str
    ) -> AlertResponse:
        """Create an alert for a transaction"""
        alert = Alert(
            transaction_id=transaction_id,
            alert_type=alert_type,
            severity=severity,
            message=message
        )
        
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(alert)
        
        return alert

    async def get_transactions_by_account(
        self, 
        account_id: str, 
        days: int = 30
    ) -> List[TransactionResponse]:
        """Get transactions for a specific account within the last N days"""
        start_date = datetime.utcnow() - timedelta(days=days)
        
        return self.db.query(Transaction).filter(
            and_(
                Transaction.account_id == account_id,
                Transaction.timestamp >= start_date
            )
        ).order_by(Transaction.timestamp.desc()).all()

    async def get_high_risk_transactions(
        self, 
        min_risk_score: float = 70.0,
        limit: int = 100
    ) -> List[TransactionResponse]:
        """Get transactions with risk score above threshold"""
        return self.db.query(Transaction).filter(
            Transaction.risk_score >= min_risk_score
        ).order_by(Transaction.risk_score.desc()).limit(limit).all()

    async def get_suspicious_transactions(
        self, 
        account_id: Optional[str] = None,
        limit: int = 100
    ) -> List[TransactionResponse]:
        """Get suspicious transactions"""
        query = self.db.query(Transaction).filter(Transaction.is_suspicious == True)
        
        if account_id:
            query = query.filter(Transaction.account_id == account_id)
        
        return query.order_by(Transaction.risk_score.desc()).limit(limit).all()

    async def update_transaction_risk_analysis(
        self, 
        transaction_id: str,
        risk_score: float,
        fraud_probability: float,
        anomaly_score: float,
        ai_explanation: Optional[str] = None
    ) -> Optional[TransactionResponse]:
        """Update transaction with AI analysis results"""
        transaction = self.db.query(Transaction).filter(
            Transaction.transaction_id == transaction_id
        ).first()
        
        if not transaction:
            return None
        
        transaction.risk_score = risk_score
        transaction.fraud_probability = fraud_probability
        transaction.anomaly_score = anomaly_score
        transaction.is_suspicious = risk_score > 70.0  # Threshold for suspicious
        
        if ai_explanation:
            transaction.ai_explanation = ai_explanation
        
        transaction.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(transaction)
        
        return transaction
