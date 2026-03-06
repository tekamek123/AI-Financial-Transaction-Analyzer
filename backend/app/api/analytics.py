from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.transaction import Transaction, Alert, AnalysisJob
from app.models.schemas import AnalyticsData, AlertResponse, AnalysisJobResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter()

@router.get("/dashboard", response_model=AnalyticsData)
async def get_dashboard_analytics(
    account_id: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get comprehensive dashboard analytics"""
    analytics_service = AnalyticsService(db)
    
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    return await analytics_service.get_dashboard_data(
        account_id=account_id,
        start_date=start_date,
        end_date=end_date
    )

@router.get("/risk-scores")
async def get_risk_score_distribution(
    account_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get distribution of risk scores"""
    analytics_service = AnalyticsService(db)
    return await analytics_service.get_risk_score_distribution(account_id)

@router.get("/transaction-trends")
async def get_transaction_trends(
    account_id: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get transaction volume trends over time"""
    analytics_service = AnalyticsService(db)
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    return await analytics_service.get_transaction_trends(
        account_id=account_id,
        start_date=start_date,
        end_date=end_date
    )

@router.get("/category-analysis")
async def get_category_analysis(
    account_id: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get transaction category analysis"""
    analytics_service = AnalyticsService(db)
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    return await analytics_service.get_category_analysis(
        account_id=account_id,
        start_date=start_date,
        end_date=end_date
    )

@router.get("/alerts", response_model=List[AlertResponse])
async def get_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    severity: Optional[str] = Query(None),
    is_resolved: Optional[bool] = Query(None),
    account_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get alerts with optional filters"""
    analytics_service = AnalyticsService(db)
    return await analytics_service.get_alerts(
        skip=skip,
        limit=limit,
        severity=severity,
        is_resolved=is_resolved,
        account_id=account_id
    )

@router.get("/alerts/summary")
async def get_alerts_summary(
    account_id: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get summary of alerts by type and severity"""
    analytics_service = AnalyticsService(db)
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    return await analytics_service.get_alerts_summary(
        account_id=account_id,
        start_date=start_date,
        end_date=end_date
    )

@router.post("/alerts/{alert_id}/resolve")
async def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):
    """Mark an alert as resolved"""
    analytics_service = AnalyticsService(db)
    success = await analytics_service.resolve_alert(alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert resolved successfully"}

@router.get("/analysis-jobs", response_model=List[AnalysisJobResponse])
async def get_analysis_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get analysis jobs with optional filters"""
    query = db.query(AnalysisJob)
    
    if status:
        query = query.filter(AnalysisJob.status == status)
    
    jobs = query.order_by(AnalysisJob.created_at.desc()).offset(skip).limit(limit).all()
    return jobs

@router.get("/analysis-jobs/{job_id}", response_model=AnalysisJobResponse)
async def get_analysis_job(
    job_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific analysis job"""
    job = db.query(AnalysisJob).filter(AnalysisJob.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Analysis job not found")
    return job

@router.get("/suspicious-patterns")
async def get_suspicious_patterns(
    account_id: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get analysis of suspicious patterns"""
    analytics_service = AnalyticsService(db)
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    return await analytics_service.get_suspicious_patterns(
        account_id=account_id,
        start_date=start_date,
        end_date=end_date
    )

@router.get("/merchant-analysis")
async def get_merchant_analysis(
    account_id: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    min_transactions: int = Query(5, ge=1),
    db: Session = Depends(get_db)
):
    """Get merchant-specific analysis"""
    analytics_service = AnalyticsService(db)
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    return await analytics_service.get_merchant_analysis(
        account_id=account_id,
        start_date=start_date,
        end_date=end_date,
        min_transactions=min_transactions
    )

@router.get("/time-patterns")
async def get_time_patterns(
    account_id: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get time-based transaction patterns"""
    analytics_service = AnalyticsService(db)
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    return await analytics_service.get_time_patterns(
        account_id=account_id,
        start_date=start_date,
        end_date=end_date
    )
