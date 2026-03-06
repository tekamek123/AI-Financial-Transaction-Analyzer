from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import pandas as pd
import json
import uuid
from datetime import datetime

from app.core.database import get_db
from app.models.transaction import Transaction, Alert, AnalysisJob
from app.models.schemas import (
    TransactionCreate, TransactionResponse, TransactionUpdate,
    AlertResponse, FileUploadResponse, BatchTransactionUpload
)
from app.services.transaction_service import TransactionService
from app.services.ai_analysis_service import AIAnalysisService

router = APIRouter()

@router.post("/upload", response_model=FileUploadResponse)
async def upload_transactions(
    file: UploadFile = File(...),
    account_id: str = Form(...),
    db: Session = Depends(get_db)
):
    """Upload transactions from CSV or JSON file"""
    
    # Validate file type
    if file.content_type not in ["text/csv", "application/json"]:
        raise HTTPException(status_code=400, detail="Only CSV and JSON files are supported")
    
    # Generate job ID
    job_id = str(uuid.uuid4())
    
    try:
        # Read file content
        content = await file.read()
        
        if file.content_type == "text/csv":
            # Process CSV
            df = pd.read_csv(pd.io.common.StringIO(content.decode('utf-8')))
            transactions_data = df.to_dict('records')
        else:
            # Process JSON
            transactions_data = json.loads(content.decode('utf-8'))
            if isinstance(transactions_data, list):
                df = pd.DataFrame(transactions_data)
            else:
                df = pd.DataFrame([transactions_data])
        
        # Validate required columns
        required_columns = ['transaction_id', 'amount', 'timestamp']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )
        
        # Add account_id to all transactions
        df['account_id'] = account_id
        
        # Create analysis job
        analysis_job = AnalysisJob(
            job_id=job_id,
            status="processing",
            total_transactions=len(df)
        )
        db.add(analysis_job)
        db.commit()
        
        # Process transactions
        transaction_service = TransactionService(db)
        created_transactions = await transaction_service.create_batch_transactions(
            transactions_data=df.to_dict('records'),
            job_id=job_id
        )
        
        # Start AI analysis (async)
        ai_service = AIAnalysisService(db)
        await ai_service.analyze_transactions_async(job_id, created_transactions)
        
        return FileUploadResponse(
            message=f"Successfully uploaded {len(created_transactions)} transactions",
            job_id=job_id,
            total_transactions=len(created_transactions)
        )
        
    except Exception as e:
        # Update job status to failed
        if 'analysis_job' in locals():
            analysis_job.status = "failed"
            analysis_job.error_message = str(e)
            db.commit()
        
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@router.post("/batch", response_model=List[TransactionResponse])
async def create_batch_transactions(
    batch_data: BatchTransactionUpload,
    db: Session = Depends(get_db)
):
    """Create multiple transactions in batch"""
    transaction_service = TransactionService(db)
    transactions = await transaction_service.create_batch_transactions(
        transactions_data=[t.dict() for t in batch_data.transactions]
    )
    return transactions

@router.post("/", response_model=TransactionResponse)
async def create_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db)
):
    """Create a single transaction"""
    transaction_service = TransactionService(db)
    return await transaction_service.create_transaction(transaction.dict())

@router.get("/", response_model=List[TransactionResponse])
async def get_transactions(
    skip: int = 0,
    limit: int = 100,
    account_id: Optional[str] = None,
    is_suspicious: Optional[bool] = None,
    min_risk_score: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """Get transactions with optional filters"""
    transaction_service = TransactionService(db)
    return await transaction_service.get_transactions(
        skip=skip, 
        limit=limit,
        account_id=account_id,
        is_suspicious=is_suspicious,
        min_risk_score=min_risk_score
    )

@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific transaction by ID"""
    transaction_service = TransactionService(db)
    transaction = await transaction_service.get_transaction_by_id(transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction

@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: str,
    transaction_update: TransactionUpdate,
    db: Session = Depends(get_db)
):
    """Update a transaction"""
    transaction_service = TransactionService(db)
    transaction = await transaction_service.update_transaction(
        transaction_id, transaction_update.dict(exclude_unset=True)
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction

@router.delete("/{transaction_id}")
async def delete_transaction(
    transaction_id: str,
    db: Session = Depends(get_db)
):
    """Delete a transaction"""
    transaction_service = TransactionService(db)
    success = await transaction_service.delete_transaction(transaction_id)
    if not success:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"message": "Transaction deleted successfully"}

@router.get("/{transaction_id}/alerts", response_model=List[AlertResponse])
async def get_transaction_alerts(
    transaction_id: str,
    db: Session = Depends(get_db)
):
    """Get alerts for a specific transaction"""
    transaction_service = TransactionService(db)
    alerts = await transaction_service.get_transaction_alerts(transaction_id)
    return alerts

@router.post("/{transaction_id}/analyze")
async def analyze_transaction(
    transaction_id: str,
    db: Session = Depends(get_db)
):
    """Trigger AI analysis for a specific transaction"""
    transaction_service = TransactionService(db)
    ai_service = AIAnalysisService(db)
    
    transaction = await transaction_service.get_transaction_by_id(transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    job_id = str(uuid.uuid4())
    await ai_service.analyze_single_transaction_async(job_id, transaction)
    
    return {"message": "Analysis started", "job_id": job_id}
