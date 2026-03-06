"""
Database health check and monitoring script
"""

import sys
import os
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.core.database import engine, SessionLocal
from app.core.database_utils import DatabaseManager
from app.models.transaction import Transaction, Alert, AnalysisJob


class DatabaseHealthChecker:
    """Monitor and check database health"""
    
    def __init__(self):
        self.db_manager = DatabaseManager()
    
    def run_health_check(self) -> Dict[str, Any]:
        """Run comprehensive health check"""
        health_report = {
            'timestamp': datetime.utcnow().isoformat(),
            'status': 'healthy',
            'checks': {},
            'issues': [],
            'recommendations': []
        }
        
        # Check database connection
        connection_ok = self.db_manager.check_connection()
        health_report['checks']['connection'] = {
            'status': 'pass' if connection_ok else 'fail',
            'message': 'Database connection successful' if connection_ok else 'Database connection failed'
        }
        
        if not connection_ok:
            health_report['status'] = 'unhealthy'
            health_report['issues'].append('Database connection failed')
            return health_report
        
        # Check table integrity
        table_check = self._check_table_integrity()
        health_report['checks']['tables'] = table_check
        
        if table_check['status'] != 'pass':
            health_report['status'] = 'degraded'
            health_report['issues'].extend(table_check['issues'])
        
        # Check data consistency
        data_check = self._check_data_consistency()
        health_report['checks']['data_consistency'] = data_check
        
        if data_check['status'] != 'pass':
            health_report['status'] = 'degraded'
            health_report['issues'].extend(data_check['issues'])
        
        # Check performance
        performance_check = self._check_performance()
        health_report['checks']['performance'] = performance_check
        
        if performance_check['status'] != 'pass':
            health_report['status'] = 'degraded'
            health_report['issues'].extend(performance_check['issues'])
        
        # Check storage
        storage_check = self._check_storage()
        health_report['checks']['storage'] = storage_check
        
        if storage_check['status'] != 'pass':
            health_report['status'] = 'degraded'
            health_report['issues'].extend(storage_check['issues'])
        
        # Generate recommendations
        health_report['recommendations'] = self._generate_recommendations(health_report)
        
        return health_report
    
    def _check_table_integrity(self) -> Dict[str, Any]:
        """Check table structure and integrity"""
        result = {'status': 'pass', 'issues': [], 'details': {}}
        
        try:
            # Check required tables exist
            required_tables = ['transactions', 'alerts', 'analysis_jobs']
            inspector = engine.dialect.get_table_names(engine.connect())
            
            for table in required_tables:
                if table not in inspector:
                    result['status'] = 'fail'
                    result['issues'].append(f'Missing table: {table}')
                else:
                    # Check table structure
                    table_info = self.db_manager.get_table_info(table)
                    result['details'][table] = {
                        'row_count': table_info['row_count'],
                        'column_count': len(table_info['columns']),
                        'index_count': len(table_info['indexes'])
                    }
                    
                    # Check for empty tables (except analysis_jobs)
                    if table != 'analysis_jobs' and table_info['row_count'] == 0:
                        result['status'] = 'warning'
                        result['issues'].append(f'Table {table} is empty')
        
        except Exception as e:
            result['status'] = 'fail'
            result['issues'].append(f'Table integrity check failed: {str(e)}')
        
        return result
    
    def _check_data_consistency(self) -> Dict[str, Any]:
        """Check data consistency and relationships"""
        result = {'status': 'pass', 'issues': [], 'details': {}}
        
        try:
            with SessionLocal() as db:
                # Check orphaned alerts (alerts without transactions)
                orphaned_alerts = db.execute("""
                    SELECT COUNT(*) FROM alerts a 
                    LEFT JOIN transactions t ON a.transaction_id = t.transaction_id 
                    WHERE t.transaction_id IS NULL
                """).scalar()
                
                if orphaned_alerts > 0:
                    result['status'] = 'warning'
                    result['issues'].append(f'Found {orphaned_alerts} orphaned alerts')
                    result['details']['orphaned_alerts'] = orphaned_alerts
                
                # Check transactions with null critical fields
                null_amounts = db.query(Transaction).filter(Transaction.amount.is_(None)).count()
                null_timestamps = db.query(Transaction).filter(Transaction.timestamp.is_(None)).count()
                
                if null_amounts > 0:
                    result['status'] = 'fail'
                    result['issues'].append(f'Found {null_amounts} transactions with null amount')
                
                if null_timestamps > 0:
                    result['status'] = 'fail'
                    result['issues'].append(f'Found {null_timestamps} transactions with null timestamp')
                
                # Check for duplicate transaction IDs
                duplicates = db.execute("""
                    SELECT transaction_id, COUNT(*) as count 
                    FROM transactions 
                    GROUP BY transaction_id 
                    HAVING COUNT(*) > 1
                """).fetchall()
                
                if duplicates:
                    result['status'] = 'fail'
                    result['issues'].append(f'Found {len(duplicates)} duplicate transaction IDs')
                    result['details']['duplicate_ids'] = [row[0] for row in duplicates]
                
                # Check future timestamps
                future_transactions = db.query(Transaction).filter(
                    Transaction.timestamp > datetime.utcnow()
                ).count()
                
                if future_transactions > 0:
                    result['status'] = 'warning'
                    result['issues'].append(f'Found {future_transactions} transactions with future timestamps')
        
        except Exception as e:
            result['status'] = 'fail'
            result['issues'].append(f'Data consistency check failed: {str(e)}')
        
        return result
    
    def _check_performance(self) -> Dict[str, Any]:
        """Check database performance metrics"""
        result = {'status': 'pass', 'issues': [], 'details': {}}
        
        try:
            # Test query performance
            start_time = time.time()
            stats = self.db_manager.get_database_stats()
            query_time = time.time() - start_time
            
            result['details']['stats_query_time'] = query_time
            
            if query_time > 5.0:  # More than 5 seconds is slow
                result['status'] = 'warning'
                result['issues'].append(f'Database stats query is slow: {query_time:.2f}s')
            
            # Check table sizes
            for table_name, table_info in stats['tables'].items():
                if table_info['row_count'] > 1000000:  # More than 1M rows
                    result['status'] = 'warning'
                    result['issues'].append(f'Table {table_name} has large number of rows: {table_info["row_count"]}')
            
            # Check index usage (PostgreSQL specific)
            try:
                index_usage = self.db_manager.execute_raw_query("""
                    SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
                    FROM pg_stat_user_indexes
                    WHERE idx_scan < 10
                    ORDER BY idx_scan
                """)
                
                if index_usage:
                    result['details']['unused_indexes'] = index_usage
                    result['issues'].append(f'Found {len(index_usage)} indexes with low usage')
            except:
                pass  # Skip if not PostgreSQL or no permission
        
        except Exception as e:
            result['status'] = 'fail'
            result['issues'].append(f'Performance check failed: {str(e)}')
        
        return result
    
    def _check_storage(self) -> Dict[str, Any]:
        """Check storage and disk space"""
        result = {'status': 'pass', 'issues': [], 'details': {}}
        
        try:
            # Get database size (PostgreSQL specific)
            db_size = self.db_manager.execute_raw_query("""
                SELECT pg_size_pretty(pg_database_size(current_database())) as size
            """)
            
            if db_size:
                result['details']['database_size'] = db_size[0]['size']
            
            # Check table sizes
            table_sizes = self.db_manager.execute_raw_query("""
                SELECT schemaname, tablename, 
                       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
                       pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
                FROM pg_tables
                WHERE schemaname = 'public'
                ORDER BY size_bytes DESC
            """)
            
            if table_sizes:
                result['details']['table_sizes'] = table_sizes
                
                # Check for very large tables
                for table_info in table_sizes:
                    if table_info['size_bytes'] > 1000000000:  # More than 1GB
                        result['status'] = 'warning'
                        result['issues'].append(f'Table {table_info["tablename"]} is large: {table_info["size"]}')
        
        except Exception as e:
            result['status'] = 'warning'
            result['issues'].append(f'Storage check failed: {str(e)}')
        
        return result
    
    def _generate_recommendations(self, health_report: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on health check results"""
        recommendations = []
        
        # Connection issues
        if health_report['checks'].get('connection', {}).get('status') != 'pass':
            recommendations.append('Check database connection string and server availability')
        
        # Table issues
        table_check = health_report['checks'].get('tables', {})
        if table_check.get('status') != 'pass':
            recommendations.append('Run database migrations to create missing tables')
        
        # Data consistency issues
        data_check = health_report['checks'].get('data_consistency', {})
        if 'orphaned_alerts' in data_check.get('details', {}):
            recommendations.append('Clean up orphaned alerts: DELETE FROM alerts WHERE transaction_id NOT IN (SELECT transaction_id FROM transactions)')
        
        if 'duplicate_ids' in data_check.get('details', {}):
            recommendations.append('Remove duplicate transaction IDs to ensure data integrity')
        
        # Performance issues
        perf_check = health_report['checks'].get('performance', {})
        if perf_check.get('status') != 'pass':
            recommendations.append('Consider running VACUUM ANALYZE and REINDEX to optimize performance')
            recommendations.append('Review and optimize slow queries')
        
        # Storage issues
        storage_check = health_report['checks'].get('storage', {})
        if storage_check.get('status') != 'pass':
            recommendations.append('Consider archiving old data to free up storage space')
            recommendations.append('Implement data retention policies')
        
        # General recommendations
        stats = self.db_manager.get_database_stats()
        total_transactions = stats['tables'].get('transactions', {}).get('row_count', 0)
        
        if total_transactions > 500000:
            recommendations.append('Consider implementing data partitioning for large tables')
        
        if total_transactions > 1000000:
            recommendations.append('Set up regular data archiving and cleanup jobs')
        
        return recommendations
    
    def monitor_database(self, interval: int = 60, duration: int = 3600) -> List[Dict[str, Any]]:
        """Monitor database over time"""
        print(f"Starting database monitoring for {duration} seconds (checking every {interval} seconds)...")
        
        monitoring_results = []
        start_time = time.time()
        
        while time.time() - start_time < duration:
            health_check = self.run_health_check()
            health_check['monitoring_timestamp'] = datetime.utcnow().isoformat()
            monitoring_results.append(health_check)
            
            print(f"[{health_check['monitoring_timestamp']}] Status: {health_check['status'].upper()}")
            
            if health_check['status'] != 'healthy':
                print(f"Issues found: {len(health_check['issues'])}")
                for issue in health_check['issues']:
                    print(f"  - {issue}")
            
            time.sleep(interval)
        
        return monitoring_results
    
    def generate_health_report(self) -> str:
        """Generate a formatted health report"""
        health_check = self.run_health_check()
        
        report = f"""
DATABASE HEALTH REPORT
=====================
Timestamp: {health_check['timestamp']}
Overall Status: {health_check['status'].upper()}

CHECK RESULTS:
"""
        
        for check_name, check_result in health_check['checks'].items():
            status_icon = "✓" if check_result['status'] == 'pass' else "⚠" if check_result['status'] == 'warning' else "✗"
            report += f"\n{status_icon} {check_name.upper()}: {check_result['status'].upper()}"
            report += f"\n  {check_result['message']}"
        
        if health_check['issues']:
            report += f"\n\nISSUES FOUND ({len(health_check['issues'])}):"
            for i, issue in enumerate(health_check['issues'], 1):
                report += f"\n{i}. {issue}"
        
        if health_check['recommendations']:
            report += f"\n\nRECOMMENDATIONS ({len(health_check['recommendations'])}):"
            for i, rec in enumerate(health_check['recommendations'], 1):
                report += f"\n{i}. {rec}"
        
        return report


def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Database health check script')
    parser.add_argument('--monitor', action='store_true', help='Run continuous monitoring')
    parser.add_argument('--interval', type=int, default=60, help='Monitoring interval in seconds')
    parser.add_argument('--duration', type=int, default=3600, help='Monitoring duration in seconds')
    parser.add_argument('--report', action='store_true', help='Generate detailed health report')
    
    args = parser.parse_args()
    
    checker = DatabaseHealthChecker()
    
    if args.monitor:
        results = checker.monitor_database(args.interval, args.duration)
        print(f"\nMonitoring completed. Collected {len(results)} health checks.")
    elif args.report:
        report = checker.generate_health_report()
        print(report)
    else:
        health_check = checker.run_health_check()
        print(f"Database Status: {health_check['status'].upper()}")
        
        if health_check['issues']:
            print(f"\nIssues found: {len(health_check['issues'])}")
            for issue in health_check['issues']:
                print(f"  - {issue}")
        else:
            print("All checks passed!")


if __name__ == "__main__":
    main()
