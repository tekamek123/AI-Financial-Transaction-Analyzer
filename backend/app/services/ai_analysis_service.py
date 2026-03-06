from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import asyncio
import numpy as np
import pandas as pd
from collections import defaultdict

from app.models.transaction import Transaction, Alert, AnalysisJob
from app.services.transaction_service import TransactionService

class AIAnalysisService:
    def __init__(self, db: Session):
        self.db = db
        self.transaction_service = TransactionService(db)

    async def analyze_transactions_async(
        self, 
        job_id: str, 
        transactions: List[Transaction]
    ):
        """Analyze transactions asynchronously"""
        try:
            # Update job status
            job = self.db.query(AnalysisJob).filter(AnalysisJob.job_id == job_id).first()
            if job:
                job.status = "processing"
                self.db.commit()
            
            # Convert to DataFrame for analysis
            transaction_data = []
            for t in transactions:
                transaction_data.append({
                    'transaction_id': t.transaction_id,
                    'amount': t.amount,
                    'timestamp': t.timestamp,
                    'merchant': t.merchant,
                    'category': t.category,
                    'account_id': t.account_id
                })
            
            df = pd.DataFrame(transaction_data)
            
            # Perform AI analysis
            analysis_results = await self._perform_ai_analysis(df)
            
            # Update transactions with results
            suspicious_count = 0
            for result in analysis_results:
                await self.transaction_service.update_transaction_risk_analysis(
                    transaction_id=result['transaction_id'],
                    risk_score=result['risk_score'],
                    fraud_probability=result['fraud_probability'],
                    anomaly_score=result['anomaly_score'],
                    ai_explanation=result['explanation']
                )
                
                # Create alerts if suspicious
                if result['risk_score'] > 70:
                    await self._create_alerts_for_transaction(result)
                    suspicious_count += 1
            
            # Update job completion
            if job:
                job.status = "completed"
                job.suspicious_transactions = suspicious_count
                job.completed_at = datetime.utcnow()
                job.processing_time = (datetime.utcnow() - job.created_at).total_seconds()
                self.db.commit()
                
        except Exception as e:
            # Update job status to failed
            if job:
                job.status = "failed"
                job.error_message = str(e)
                self.db.commit()
            raise e

    async def analyze_single_transaction_async(
        self, 
        job_id: str, 
        transaction: Transaction
    ):
        """Analyze a single transaction asynchronously"""
        try:
            # Create analysis job record
            job = AnalysisJob(
                job_id=job_id,
                status="processing",
                total_transactions=1
            )
            self.db.add(job)
            self.db.commit()
            
            # Convert to DataFrame
            df = pd.DataFrame([{
                'transaction_id': transaction.transaction_id,
                'amount': transaction.amount,
                'timestamp': transaction.timestamp,
                'merchant': transaction.merchant,
                'category': transaction.category,
                'account_id': transaction.account_id
            }])
            
            # Get historical data for context
            historical_data = await self._get_historical_data(transaction.account_id)
            if not historical_data.empty:
                df = pd.concat([historical_data, df], ignore_index=True)
            
            # Perform analysis
            analysis_results = await self._perform_ai_analysis(df)
            
            # Find the result for our transaction
            transaction_result = next(
                (r for r in analysis_results if r['transaction_id'] == transaction.transaction_id),
                None
            )
            
            if transaction_result:
                await self.transaction_service.update_transaction_risk_analysis(
                    transaction_id=transaction_result['transaction_id'],
                    risk_score=transaction_result['risk_score'],
                    fraud_probability=transaction_result['fraud_probability'],
                    anomaly_score=transaction_result['anomaly_score'],
                    ai_explanation=transaction_result['explanation']
                )
                
                # Create alerts if suspicious
                if transaction_result['risk_score'] > 70:
                    await self._create_alerts_for_transaction(transaction_result)
                
                # Update job
                job.status = "completed"
                job.suspicious_transactions = 1 if transaction_result['risk_score'] > 70 else 0
            else:
                job.status = "failed"
                job.error_message = "Analysis result not found"
            
            job.completed_at = datetime.utcnow()
            job.processing_time = (datetime.utcnow() - job.created_at).total_seconds()
            self.db.commit()
            
        except Exception as e:
            if job:
                job.status = "failed"
                job.error_message = str(e)
                self.db.commit()
            raise e

    async def _perform_ai_analysis(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Perform AI analysis on transactions"""
        results = []
        
        # Feature engineering
        df_features = await self._engineer_features(df)
        
        # Get historical statistics for context
        historical_stats = await self._get_historical_stats(df)
        
        for idx, row in df.iterrows():
            risk_factors = []
            risk_score = 0
            fraud_probability = 0
            anomaly_score = 0
            
            # Amount-based analysis
            amount_analysis = await self._analyze_amount(row['amount'], historical_stats)
            risk_score += amount_analysis['risk_score'] * 0.3
            fraud_probability += amount_analysis['fraud_probability'] * 0.3
            anomaly_score += amount_analysis['anomaly_score'] * 0.3
            risk_factors.extend(amount_analysis['factors'])
            
            # Time-based analysis
            time_analysis = await self._analyze_time(row['timestamp'], historical_stats)
            risk_score += time_analysis['risk_score'] * 0.2
            fraud_probability += time_analysis['fraud_probability'] * 0.2
            anomaly_score += time_analysis['anomaly_score'] * 0.2
            risk_factors.extend(time_analysis['factors'])
            
            # Merchant analysis
            merchant_analysis = await self._analyze_merchant(row['merchant'], historical_stats)
            risk_score += merchant_analysis['risk_score'] * 0.2
            fraud_probability += merchant_analysis['fraud_probability'] * 0.2
            anomaly_score += merchant_analysis['anomaly_score'] * 0.2
            risk_factors.extend(merchant_analysis['factors'])
            
            # Frequency analysis
            frequency_analysis = await self._analyze_frequency(row, df, historical_stats)
            risk_score += frequency_analysis['risk_score'] * 0.3
            fraud_probability += frequency_analysis['fraud_probability'] * 0.3
            anomaly_score += frequency_analysis['anomaly_score'] * 0.3
            risk_factors.extend(frequency_analysis['factors'])
            
            # Generate explanation
            explanation = await self._generate_explanation(risk_factors, row, risk_score)
            
            results.append({
                'transaction_id': row['transaction_id'],
                'risk_score': min(risk_score, 100),
                'fraud_probability': min(fraud_probability, 100),
                'anomaly_score': min(anomaly_score, 100),
                'explanation': explanation,
                'risk_factors': risk_factors
            })
        
        return results

    async def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Engineer features for AI analysis"""
        df = df.copy()
        
        # Time-based features
        df['hour'] = pd.to_datetime(df['timestamp']).dt.hour
        df['day_of_week'] = pd.to_datetime(df['timestamp']).dt.dayofweek
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        df['is_night'] = ((df['hour'] >= 22) | (df['hour'] <= 6)).astype(int)
        
        # Amount-based features
        df['is_round_amount'] = (df['amount'] % 100 == 0).astype(int)
        df['amount_log'] = np.log1p(df['amount'])
        
        # Merchant features
        df['merchant_unknown'] = (df['merchant'].isna() | (df['merchant'] == 'Unknown')).astype(int)
        
        return df

    async def _get_historical_data(self, account_id: str, days: int = 90) -> pd.DataFrame:
        """Get historical transaction data for context"""
        start_date = datetime.utcnow() - timedelta(days=days)
        
        transactions = self.db.query(Transaction).filter(
            Transaction.account_id == account_id,
            Transaction.timestamp >= start_date
        ).all()
        
        if not transactions:
            return pd.DataFrame()
        
        data = []
        for t in transactions:
            data.append({
                'transaction_id': t.transaction_id,
                'amount': t.amount,
                'timestamp': t.timestamp,
                'merchant': t.merchant,
                'category': t.category,
                'account_id': t.account_id
            })
        
        return pd.DataFrame(data)

    async def _get_historical_stats(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate historical statistics"""
        if df.empty:
            return {}
        
        return {
            'amount_mean': df['amount'].mean(),
            'amount_std': df['amount'].std(),
            'amount_median': df['amount'].median(),
            'amount_max': df['amount'].max(),
            'hourly_distribution': df.groupby(df['timestamp'].dt.hour).size().to_dict(),
            'merchant_counts': df['merchant'].value_counts().to_dict(),
            'daily_transaction_counts': df.groupby(df['timestamp'].dt.date).size().mean()
        }

    async def _analyze_amount(self, amount: float, historical_stats: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze transaction amount for suspicious patterns"""
        factors = []
        risk_score = 0
        fraud_probability = 0
        anomaly_score = 0
        
        if not historical_stats:
            return {
                'risk_score': 10,
                'fraud_probability': 10,
                'anomaly_score': 10,
                'factors': ['Insufficient historical data']
            }
        
        # Z-score analysis
        if historical_stats['amount_std'] > 0:
            z_score = abs(amount - historical_stats['amount_mean']) / historical_stats['amount_std']
            if z_score > 3:
                risk_score += 30
                fraud_probability += 25
                anomaly_score += 35
                factors.append(f"Unusually large amount (Z-score: {z_score:.2f})")
        
        # Round amount analysis
        if amount % 100 == 0 and amount > 500:
            risk_score += 15
            fraud_probability += 10
            anomaly_score += 20
            factors.append("Round amount (potential structuring)")
        
        # High value threshold
        if amount > 5000:
            risk_score += 25
            fraud_probability += 20
            anomaly_score += 30
            factors.append("High-value transaction")
        elif amount > 1000:
            risk_score += 10
            fraud_probability += 8
            anomaly_score += 15
            factors.append("Moderate-high value transaction")
        
        return {
            'risk_score': min(risk_score, 100),
            'fraud_probability': min(fraud_probability, 100),
            'anomaly_score': min(anomaly_score, 100),
            'factors': factors
        }

    async def _analyze_time(self, timestamp: datetime, historical_stats: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze transaction time for suspicious patterns"""
        factors = []
        risk_score = 0
        fraud_probability = 0
        anomaly_score = 0
        
        hour = timestamp.hour
        is_weekend = timestamp.weekday() in [5, 6]
        
        # Unusual hours
        if hour >= 22 or hour <= 6:
            risk_score += 20
            fraud_probability += 15
            anomaly_score += 25
            factors.append(f"Unusual time: {hour}:00")
        
        # Weekend transactions (depending on account type)
        if is_weekend:
            risk_score += 10
            fraud_probability += 8
            anomaly_score += 12
            factors.append("Weekend transaction")
        
        return {
            'risk_score': min(risk_score, 100),
            'fraud_probability': min(fraud_probability, 100),
            'anomaly_score': min(anomaly_score, 100),
            'factors': factors
        }

    async def _analyze_merchant(self, merchant: Optional[str], historical_stats: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze merchant for suspicious patterns"""
        factors = []
        risk_score = 0
        fraud_probability = 0
        anomaly_score = 0
        
        # Unknown merchant
        if not merchant or merchant.lower() == 'unknown':
            risk_score += 25
            fraud_probability += 20
            anomaly_score += 30
            factors.append("Unknown merchant")
        
        # Check if merchant is new (not in historical data)
        if historical_stats and merchant:
            merchant_counts = historical_stats.get('merchant_counts', {})
            if merchant not in merchant_counts:
                risk_score += 15
                fraud_probability += 10
                anomaly_score += 20
                factors.append("New merchant")
        
        return {
            'risk_score': min(risk_score, 100),
            'fraud_probability': min(fraud_probability, 100),
            'anomaly_score': min(anomaly_score, 100),
            'factors': factors
        }

    async def _analyze_frequency(self, row: pd.Series, df: pd.DataFrame, historical_stats: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze transaction frequency patterns"""
        factors = []
        risk_score = 0
        fraud_probability = 0
        anomaly_score = 0
        
        # Check for multiple transactions in short time period
        account_id = row['account_id']
        current_time = pd.to_datetime(row['timestamp'])
        
        # Recent transactions (last hour)
        recent_transactions = df[
            (df['account_id'] == account_id) & 
            (pd.to_datetime(df['timestamp']) > current_time - timedelta(hours=1))
        ]
        
        if len(recent_transactions) > 5:
            risk_score += 20
            fraud_probability += 15
            anomaly_score += 25
            factors.append(f"High frequency: {len(recent_transactions)} transactions in last hour")
        
        # Check daily average
        if historical_stats:
            daily_avg = historical_stats.get('daily_transaction_counts', 1)
            today_count = len(df[
                (df['account_id'] == account_id) & 
                (pd.to_datetime(df['timestamp']).dt.date == current_time.date())
            ])
            
            if today_count > daily_avg * 3:
                risk_score += 15
                fraud_probability += 12
                anomaly_score += 18
                factors.append(f"Unusually high daily frequency: {today_count} transactions")
        
        return {
            'risk_score': min(risk_score, 100),
            'fraud_probability': min(fraud_probability, 100),
            'anomaly_score': min(anomaly_score, 100),
            'factors': factors
        }

    async def _generate_explanation(self, risk_factors: List[str], transaction: pd.Series, risk_score: float) -> str:
        """Generate human-readable explanation for risk score"""
        if not risk_factors:
            return "Transaction appears normal based on available data."
        
        explanation = f"Risk score: {risk_score:.1f}/100. "
        
        if risk_score >= 80:
            explanation += "High risk detected. "
        elif risk_score >= 60:
            explanation += "Moderate risk detected. "
        elif risk_score >= 40:
            explanation += "Low to moderate risk detected. "
        else:
            explanation += "Low risk detected. "
        
        if risk_factors:
            explanation += "Factors: " + "; ".join(risk_factors[:3])  # Limit to top 3 factors
        
        return explanation

    async def _create_alerts_for_transaction(self, analysis_result: Dict[str, Any]):
        """Create alerts based on analysis results"""
        transaction_id = analysis_result['transaction_id']
        risk_factors = analysis_result['risk_factors']
        
        # Create specific alerts based on risk factors
        for factor in risk_factors:
            alert_type = "general"
            severity = "medium"
            
            if "amount" in factor.lower():
                alert_type = "high_amount"
                severity = "high" if "large" in factor.lower() else "medium"
            elif "time" in factor.lower():
                alert_type = "unusual_time"
                severity = "medium"
            elif "frequency" in factor.lower():
                alert_type = "frequency"
                severity = "high"
            elif "merchant" in factor.lower():
                alert_type = "unknown_merchant"
                severity = "medium"
            
            await self.transaction_service.create_alert(
                transaction_id=transaction_id,
                alert_type=alert_type,
                severity=severity,
                message=f"Suspicious activity detected: {factor}"
            )
