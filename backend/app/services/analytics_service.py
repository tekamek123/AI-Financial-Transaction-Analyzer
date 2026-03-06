from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict

from app.models.transaction import Transaction, Alert
from app.models.schemas import AnalyticsData, AlertResponse

class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    async def get_dashboard_data(
        self, 
        account_id: Optional[str] = None,
        start_date: datetime = None,
        end_date: datetime = None
    ) -> AnalyticsData:
        """Get comprehensive dashboard analytics"""
        
        # Base query filters
        filters = []
        if account_id:
            filters.append(Transaction.account_id == account_id)
        if start_date:
            filters.append(Transaction.timestamp >= start_date)
        if end_date:
            filters.append(Transaction.timestamp <= end_date)
        
        base_query = self.db.query(Transaction)
        if filters:
            base_query = base_query.filter(and_(*filters))
        
        # Total transactions
        total_transactions = base_query.count()
        
        # Suspicious transactions
        suspicious_query = base_query.filter(Transaction.is_suspicious == True)
        suspicious_transactions = suspicious_query.count()
        
        # Fraud rate
        fraud_rate = (suspicious_transactions / total_transactions * 100) if total_transactions > 0 else 0
        
        # Average risk score
        avg_risk_score = base_query.with_entities(
            func.avg(Transaction.risk_score)
        ).scalar() or 0
        
        # Total amount
        total_amount = base_query.with_entities(
            func.sum(Transaction.amount)
        ).scalar() or 0
        
        # Suspicious amount
        suspicious_amount = suspicious_query.with_entities(
            func.sum(Transaction.amount)
        ).scalar() or 0
        
        # Category distribution
        category_data = base_query.with_entities(
            Transaction.category,
            func.count(Transaction.id)
        ).group_by(Transaction.category).all()
        
        category_distribution = {cat: count for cat, count in category_data if cat}
        
        # Risk distribution
        risk_ranges = {
            "Low (0-30)": 0,
            "Medium (31-60)": 0,
            "High (61-80)": 0,
            "Critical (81-100)": 0
        }
        
        for row in base_query.with_entities(Transaction.risk_score).all():
            score = row.risk_score
            if score <= 30:
                risk_ranges["Low (0-30)"] += 1
            elif score <= 60:
                risk_ranges["Medium (31-60)"] += 1
            elif score <= 80:
                risk_ranges["High (61-80)"] += 1
            else:
                risk_ranges["Critical (81-100)"] += 1
        
        # Time series data (daily)
        time_series_query = base_query.with_entities(
            func.date(Transaction.timestamp).label('date'),
            func.count(Transaction.id).label('count'),
            func.sum(Transaction.amount).label('total_amount'),
            func.avg(Transaction.risk_score).label('avg_risk')
        ).group_by(func.date(Transaction.timestamp)).order_by(func.date(Transaction.timestamp))
        
        time_series_data = [
            {
                "date": str(row.date),
                "count": row.count,
                "total_amount": float(row.total_amount or 0),
                "avg_risk": float(row.avg_risk or 0)
            }
            for row in time_series_query.all()
        ]
        
        return AnalyticsData(
            total_transactions=total_transactions,
            suspicious_transactions=suspicious_transactions,
            fraud_rate=fraud_rate,
            average_risk_score=float(avg_risk_score),
            total_amount=float(total_amount),
            suspicious_amount=float(suspicious_amount),
            category_distribution=category_distribution,
            risk_distribution=risk_ranges,
            time_series_data=time_series_data
        )

    async def get_risk_score_distribution(
        self, 
        account_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get detailed risk score distribution"""
        query = self.db.query(Transaction.risk_score)
        
        if account_id:
            query = query.filter(Transaction.account_id == account_id)
        
        risk_scores = [row.risk_score for row in query.all()]
        
        if not risk_scores:
            return {"distribution": {}, "statistics": {}}
        
        # Calculate statistics
        import statistics
        stats = {
            "mean": statistics.mean(risk_scores),
            "median": statistics.median(risk_scores),
            "min": min(risk_scores),
            "max": max(risk_scores),
            "std_dev": statistics.stdev(risk_scores) if len(risk_scores) > 1 else 0
        }
        
        # Create distribution buckets
        buckets = defaultdict(int)
        for score in risk_scores:
            bucket = int(score // 10) * 10
            buckets[f"{bucket}-{bucket+9}"] += 1
        
        return {
            "distribution": dict(buckets),
            "statistics": stats
        }

    async def get_transaction_trends(
        self,
        account_id: Optional[str] = None,
        start_date: datetime = None,
        end_date: datetime = None
    ) -> Dict[str, Any]:
        """Get transaction volume trends over time"""
        filters = []
        if account_id:
            filters.append(Transaction.account_id == account_id)
        if start_date:
            filters.append(Transaction.timestamp >= start_date)
        if end_date:
            filters.append(Transaction.timestamp <= end_date)
        
        query = self.db.query(Transaction)
        if filters:
            query = query.filter(and_(*filters))
        
        # Daily trends
        daily_trends = query.with_entities(
            func.date(Transaction.timestamp).label('date'),
            func.count(Transaction.id).label('count'),
            func.sum(Transaction.amount).label('total_amount'),
            func.count(func.case([(Transaction.is_suspicious == True, 1)])).label('suspicious_count')
        ).group_by(func.date(Transaction.timestamp)).order_by(func.date(Transaction.timestamp)).all()
        
        # Hourly patterns
        hourly_patterns = query.with_entities(
            extract('hour', Transaction.timestamp).label('hour'),
            func.count(Transaction.id).label('count'),
            func.avg(Transaction.amount).label('avg_amount')
        ).group_by(extract('hour', Transaction.timestamp)).all()
        
        return {
            "daily_trends": [
                {
                    "date": str(row.date),
                    "count": row.count,
                    "total_amount": float(row.total_amount or 0),
                    "suspicious_count": row.suspicious_count
                }
                for row in daily_trends
            ],
            "hourly_patterns": [
                {
                    "hour": int(row.hour),
                    "count": row.count,
                    "avg_amount": float(row.avg_amount or 0)
                }
                for row in hourly_patterns
            ]
        }

    async def get_category_analysis(
        self,
        account_id: Optional[str] = None,
        start_date: datetime = None,
        end_date: datetime = None
    ) -> Dict[str, Any]:
        """Get transaction category analysis"""
        filters = []
        if account_id:
            filters.append(Transaction.account_id == account_id)
        if start_date:
            filters.append(Transaction.timestamp >= start_date)
        if end_date:
            filters.append(Transaction.timestamp <= end_date)
        
        query = self.db.query(Transaction)
        if filters:
            query = query.filter(and_(*filters))
        
        # Category statistics
        category_stats = query.with_entities(
            Transaction.category,
            func.count(Transaction.id).label('count'),
            func.sum(Transaction.amount).label('total_amount'),
            func.avg(Transaction.amount).label('avg_amount'),
            func.avg(Transaction.risk_score).label('avg_risk'),
            func.count(func.case([(Transaction.is_suspicious == True, 1)])).label('suspicious_count')
        ).group_by(Transaction.category).all()
        
        return [
            {
                "category": row.category or "Unknown",
                "count": row.count,
                "total_amount": float(row.total_amount or 0),
                "avg_amount": float(row.avg_amount or 0),
                "avg_risk": float(row.avg_risk or 0),
                "suspicious_count": row.suspicious_count,
                "suspicious_rate": (row.suspicious_count / row.count * 100) if row.count > 0 else 0
            }
            for row in category_stats
        ]

    async def get_alerts(
        self,
        skip: int = 0,
        limit: int = 100,
        severity: Optional[str] = None,
        is_resolved: Optional[bool] = None,
        account_id: Optional[str] = None
    ) -> List[AlertResponse]:
        """Get alerts with filters"""
        query = self.db.query(Alert).join(Transaction)
        
        if severity:
            query = query.filter(Alert.severity == severity)
        
        if is_resolved is not None:
            query = query.filter(Alert.is_resolved == is_resolved)
        
        if account_id:
            query = query.filter(Transaction.account_id == account_id)
        
        return query.order_by(Alert.created_at.desc()).offset(skip).limit(limit).all()

    async def get_alerts_summary(
        self,
        account_id: Optional[str] = None,
        start_date: datetime = None,
        end_date: datetime = None
    ) -> Dict[str, Any]:
        """Get alerts summary by type and severity"""
        filters = []
        if account_id:
            filters.append(Transaction.account_id == account_id)
        if start_date:
            filters.append(Alert.created_at >= start_date)
        if end_date:
            filters.append(Alert.created_at <= end_date)
        
        query = self.db.query(Alert).join(Transaction)
        if filters:
            query = query.filter(and_(*filters))
        
        # By severity
        severity_summary = query.with_entities(
            Alert.severity,
            func.count(Alert.id).label('count')
        ).group_by(Alert.severity).all()
        
        # By type
        type_summary = query.with_entities(
            Alert.alert_type,
            func.count(Alert.id).label('count')
        ).group_by(Alert.alert_type).all()
        
        # Resolution rate
        total_alerts = query.count()
        resolved_alerts = query.filter(Alert.is_resolved == True).count()
        
        return {
            "by_severity": {severity: count for severity, count in severity_summary},
            "by_type": {alert_type: count for alert_type, count in type_summary},
            "total_alerts": total_alerts,
            "resolved_alerts": resolved_alerts,
            "resolution_rate": (resolved_alerts / total_alerts * 100) if total_alerts > 0 else 0
        }

    async def resolve_alert(self, alert_id: int) -> bool:
        """Mark an alert as resolved"""
        alert = self.db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return False
        
        alert.is_resolved = True
        self.db.commit()
        return True

    async def get_suspicious_patterns(
        self,
        account_id: Optional[str] = None,
        start_date: datetime = None,
        end_date: datetime = None
    ) -> Dict[str, Any]:
        """Analyze suspicious patterns"""
        filters = [Transaction.is_suspicious == True]
        if account_id:
            filters.append(Transaction.account_id == account_id)
        if start_date:
            filters.append(Transaction.timestamp >= start_date)
        if end_date:
            filters.append(Transaction.timestamp <= end_date)
        
        suspicious_transactions = self.db.query(Transaction).filter(and_(*filters)).all()
        
        if not suspicious_transactions:
            return {"patterns": [], "summary": {}}
        
        # Analyze patterns
        patterns = {
            "high_value_transactions": len([t for t in suspicious_transactions if t.amount > 1000]),
            "unusual_hours": len([t for t in suspicious_transactions if t.timestamp.hour < 6 or t.timestamp.hour > 22]),
            "unknown_merchants": len([t for t in suspicious_transactions if not t.merchant or t.merchant.lower() == "unknown"]),
            "recurring_patterns": self._find_recurring_patterns(suspicious_transactions)
        }
        
        return {
            "patterns": patterns,
            "summary": {
                "total_suspicious": len(suspicious_transactions),
                "avg_risk_score": sum(t.risk_score for t in suspicious_transactions) / len(suspicious_transactions),
                "total_amount": sum(t.amount for t in suspicious_transactions)
            }
        }

    async def get_merchant_analysis(
        self,
        account_id: Optional[str] = None,
        start_date: datetime = None,
        end_date: datetime = None,
        min_transactions: int = 5
    ) -> List[Dict[str, Any]]:
        """Get merchant-specific analysis"""
        filters = []
        if account_id:
            filters.append(Transaction.account_id == account_id)
        if start_date:
            filters.append(Transaction.timestamp >= start_date)
        if end_date:
            filters.append(Transaction.timestamp <= end_date)
        
        query = self.db.query(Transaction).filter(and_(*filters))
        
        merchant_data = query.with_entities(
            Transaction.merchant,
            func.count(Transaction.id).label('transaction_count'),
            func.sum(Transaction.amount).label('total_amount'),
            func.avg(Transaction.amount).label('avg_amount'),
            func.avg(Transaction.risk_score).label('avg_risk'),
            func.count(func.case([(Transaction.is_suspicious == True, 1)])).label('suspicious_count')
        ).group_by(Transaction.merchant).having(func.count(Transaction.id) >= min_transactions).all()
        
        return [
            {
                "merchant": row.merchant or "Unknown",
                "transaction_count": row.transaction_count,
                "total_amount": float(row.total_amount or 0),
                "avg_amount": float(row.avg_amount or 0),
                "avg_risk": float(row.avg_risk or 0),
                "suspicious_count": row.suspicious_count,
                "suspicious_rate": (row.suspicious_count / row.transaction_count * 100) if row.transaction_count > 0 else 0
            }
            for row in merchant_data
        ]

    async def get_time_patterns(
        self,
        account_id: Optional[str] = None,
        start_date: datetime = None,
        end_date: datetime = None
    ) -> Dict[str, Any]:
        """Get time-based transaction patterns"""
        filters = []
        if account_id:
            filters.append(Transaction.account_id == account_id)
        if start_date:
            filters.append(Transaction.timestamp >= start_date)
        if end_date:
            filters.append(Transaction.timestamp <= end_date)
        
        query = self.db.query(Transaction).filter(and_(*filters))
        
        # Day of week patterns
        dow_patterns = query.with_entities(
            extract('dow', Transaction.timestamp).label('day_of_week'),
            func.count(Transaction.id).label('count'),
            func.sum(Transaction.amount).label('total_amount')
        ).group_by(extract('dow', Transaction.timestamp)).all()
        
        # Hour of day patterns
        hod_patterns = query.with_entities(
            extract('hour', Transaction.timestamp).label('hour'),
            func.count(Transaction.id).label('count'),
            func.avg(Transaction.risk_score).label('avg_risk')
        ).group_by(extract('hour', Transaction.timestamp)).all()
        
        return {
            "day_of_week": [
                {
                    "day": int(row.day_of_week),
                    "count": row.count,
                    "total_amount": float(row.total_amount or 0)
                }
                for row in dow_patterns
            ],
            "hour_of_day": [
                {
                    "hour": int(row.hour),
                    "count": row.count,
                    "avg_risk": float(row.avg_risk or 0)
                }
                for row in hod_patterns
            ]
        }

    def _find_recurring_patterns(self, transactions: List[Transaction]) -> Dict[str, int]:
        """Find recurring suspicious patterns"""
        patterns = {
            "same_amount_same_day": 0,
            "same_merchant_frequent": 0,
            "round_amounts": 0
        }
        
        # Check for round amounts (suspicious indicator)
        patterns["round_amounts"] = len([t for t in transactions if t.amount % 100 == 0])
        
        # Check for same merchant frequency
        merchant_counts = defaultdict(int)
        for t in transactions:
            if t.merchant:
                merchant_counts[t.merchant] += 1
        
        patterns["same_merchant_frequent"] = len([count for count in merchant_counts.values() if count > 3])
        
        return patterns
