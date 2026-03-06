"""
Database utilities and helper functions
"""

import os
import sys
from typing import List, Dict, Any, Optional
from sqlalchemy import text, inspect
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
import pandas as pd
from datetime import datetime, timedelta

from app.core.database import engine, SessionLocal
from app.models.transaction import Transaction, Alert, AnalysisJob


class DatabaseManager:
    """Database management utilities"""
    
    @staticmethod
    def get_session() -> Session:
        """Get database session"""
        return SessionLocal()
    
    @staticmethod
    def execute_raw_query(query: str, params: Optional[Dict] = None) -> List[Dict]:
        """Execute raw SQL query and return results"""
        with engine.connect() as connection:
            result = connection.execute(text(query), params or {})
            return [dict(row._mapping) for row in result]
    
    @staticmethod
    def check_connection() -> bool:
        """Check database connection"""
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            return True
        except SQLAlchemyError:
            return False
    
    @staticmethod
    def get_table_info(table_name: str) -> Dict[str, Any]:
        """Get table information"""
        inspector = inspect(engine)
        
        if table_name not in inspector.get_table_names():
            return {}
        
        columns = inspector.get_columns(table_name)
        indexes = inspector.get_indexes(table_name)
        foreign_keys = inspector.get_foreign_keys(table_name)
        
        return {
            'table_name': table_name,
            'columns': columns,
            'indexes': indexes,
            'foreign_keys': foreign_keys,
            'row_count': DatabaseManager.get_row_count(table_name)
        }
    
    @staticmethod
    def get_row_count(table_name: str) -> int:
        """Get row count for a table"""
        try:
            with engine.connect() as connection:
                result = connection.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                return result.scalar()
        except SQLAlchemyError:
            return 0
    
    @staticmethod
    def get_database_stats() -> Dict[str, Any]:
        """Get comprehensive database statistics"""
        inspector = inspect(engine)
        table_names = inspector.get_table_names()
        
        stats = {
            'database_connected': DatabaseManager.check_connection(),
            'tables': {},
            'total_size': 0
        }
        
        for table_name in table_names:
            table_info = DatabaseManager.get_table_info(table_name)
            stats['tables'][table_name] = {
                'row_count': table_info['row_count'],
                'column_count': len(table_info['columns']),
                'index_count': len(table_info['indexes'])
            }
        
        return stats
    
    @staticmethod
    def cleanup_old_data(days_to_keep: int = 90) -> Dict[str, int]:
        """Clean up old data from database"""
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        
        deleted_counts = {}
        
        with SessionLocal() as db:
            try:
                # Delete old transactions
                old_transactions = db.query(Transaction).filter(
                    Transaction.timestamp < cutoff_date
                )
                deleted_counts['transactions'] = old_transactions.count()
                old_transactions.delete()
                
                # Delete old alerts (orphaned)
                old_alerts = db.query(Alert).join(Transaction).filter(
                    Transaction.timestamp < cutoff_date
                )
                deleted_counts['alerts'] = old_alerts.count()
                old_alerts.delete()
                
                # Delete old analysis jobs
                old_jobs = db.query(AnalysisJob).filter(
                    AnalysisJob.created_at < cutoff_date
                )
                deleted_counts['analysis_jobs'] = old_jobs.count()
                old_jobs.delete()
                
                db.commit()
                
            except SQLAlchemyError as e:
                db.rollback()
                raise e
        
        return deleted_counts
    
    @staticmethod
    def export_table_to_csv(table_name: str, filepath: str, limit: Optional[int] = None) -> bool:
        """Export table data to CSV file"""
        try:
            query = f"SELECT * FROM {table_name}"
            if limit:
                query += f" LIMIT {limit}"
            
            df = pd.read_sql(query, engine)
            df.to_csv(filepath, index=False)
            return True
        except Exception as e:
            print(f"Error exporting table {table_name}: {e}")
            return False
    
    @staticmethod
    def import_csv_to_table(table_name: str, filepath: str) -> bool:
        """Import CSV data to table"""
        try:
            df = pd.read_csv(filepath)
            
            # Convert date columns
            date_columns = ['timestamp', 'created_at', 'updated_at', 'completed_at']
            for col in date_columns:
                if col in df.columns:
                    df[col] = pd.to_datetime(df[col])
            
            # Import to database
            df.to_sql(table_name, engine, if_exists='append', index=False)
            return True
        except Exception as e:
            print(f"Error importing to table {table_name}: {e}")
            return False
    
    @staticmethod
    def backup_database(backup_path: str) -> bool:
        """Create database backup (PostgreSQL specific)"""
        try:
            # This is a simplified version - in production, use pg_dump
            query = f"COPY transactions TO '{backup_path}/transactions.csv' WITH CSV HEADER"
            DatabaseManager.execute_raw_query(query)
            
            query = f"COPY alerts TO '{backup_path}/alerts.csv' WITH CSV HEADER"
            DatabaseManager.execute_raw_query(query)
            
            query = f"COPY analysis_jobs TO '{backup_path}/analysis_jobs.csv' WITH CSV HEADER"
            DatabaseManager.execute_raw_query(query)
            
            return True
        except Exception as e:
            print(f"Error creating backup: {e}")
            return False
    
    @staticmethod
    def optimize_database() -> Dict[str, str]:
        """Optimize database performance"""
        optimizations = {}
        
        try:
            with engine.connect() as connection:
                # Update table statistics
                connection.execute(text("ANALYZE transactions"))
                optimizations['transactions_analyzed'] = "Table statistics updated"
                
                connection.execute(text("ANALYZE alerts"))
                optimizations['alerts_analyzed'] = "Table statistics updated"
                
                connection.execute(text("ANALYZE analysis_jobs"))
                optimizations['analysis_jobs_analyzed'] = "Table statistics updated"
                
                # Reindex if needed (PostgreSQL specific)
                connection.execute(text("REINDEX INDEX CONCURRENTLY ix_transactions_transaction_id"))
                optimizations['transactions_reindexed'] = "Transaction indexes rebuilt"
                
                connection.execute(text("REINDEX INDEX CONCURRENTLY ix_alerts_transaction_id"))
                optimizations['alerts_reindexed'] = "Alert indexes rebuilt"
                
        except Exception as e:
            optimizations['error'] = str(e)
        
        return optimizations
    
    @staticmethod
    def get_query_performance_stats() -> Dict[str, Any]:
        """Get database query performance statistics"""
        stats = {}
        
        try:
            # Get slow queries (PostgreSQL specific)
            slow_queries = DatabaseManager.execute_raw_query("""
                SELECT query, mean_time, calls, total_time
                FROM pg_stat_statements
                WHERE mean_time > 1000  -- queries taking more than 1 second
                ORDER BY mean_time DESC
                LIMIT 10
            """)
            stats['slow_queries'] = slow_queries
            
            # Get table sizes
            table_sizes = DatabaseManager.execute_raw_query("""
                SELECT schemaname, tablename, 
                       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
                FROM pg_tables
                WHERE schemaname = 'public'
                ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
            """)
            stats['table_sizes'] = table_sizes
            
        except Exception as e:
            stats['error'] = str(e)
        
        return stats


class QueryBuilder:
    """Helper class for building complex queries"""
    
    @staticmethod
    def build_transaction_query(
        account_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None,
        is_suspicious: Optional[bool] = None,
        min_risk_score: Optional[float] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None
    ) -> tuple:
        """Build transaction query with filters"""
        
        query = "SELECT * FROM transactions WHERE 1=1"
        params = {}
        
        if account_id:
            query += " AND account_id = :account_id"
            params['account_id'] = account_id
        
        if start_date:
            query += " AND timestamp >= :start_date"
            params['start_date'] = start_date
        
        if end_date:
            query += " AND timestamp <= :end_date"
            params['end_date'] = end_date
        
        if min_amount:
            query += " AND amount >= :min_amount"
            params['min_amount'] = min_amount
        
        if max_amount:
            query += " AND amount <= :max_amount"
            params['max_amount'] = max_amount
        
        if is_suspicious is not None:
            query += " AND is_suspicious = :is_suspicious"
            params['is_suspicious'] = is_suspicious
        
        if min_risk_score:
            query += " AND risk_score >= :min_risk_score"
            params['min_risk_score'] = min_risk_score
        
        query += " ORDER BY timestamp DESC"
        
        if limit:
            query += " LIMIT :limit"
            params['limit'] = limit
        
        if offset:
            query += " OFFSET :offset"
            params['offset'] = offset
        
        return query, params
    
    @staticmethod
    def build_analytics_query(
        account_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> tuple:
        """Build analytics query for dashboard data"""
        
        query = """
        SELECT 
            COUNT(*) as total_transactions,
            COUNT(CASE WHEN is_suspicious = true THEN 1 END) as suspicious_transactions,
            AVG(amount) as avg_amount,
            SUM(amount) as total_amount,
            AVG(risk_score) as avg_risk_score,
            COUNT(CASE WHEN risk_score > 70 THEN 1 END) as high_risk_count
        FROM transactions
        WHERE 1=1
        """
        
        params = {}
        
        if account_id:
            query += " AND account_id = :account_id"
            params['account_id'] = account_id
        
        if start_date:
            query += " AND timestamp >= :start_date"
            params['start_date'] = start_date
        
        if end_date:
            query += " AND timestamp <= :end_date"
            params['end_date'] = end_date
        
        return query, params
