"""
Database initialization script for AI Financial Transaction Analyzer

This script creates the database, runs migrations, and sets up initial data.
"""

import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from sqlalchemy import create_engine
from alembic.config import Config
from alembic import command
import argparse

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.models.transaction import Transaction, Alert, AnalysisJob


def create_database():
    """Create the database if it doesn't exist"""
    # Parse the database URL to get connection details
    db_url = settings.DATABASE_URL
    if db_url.startswith('postgresql://'):
        # Remove 'postgresql://' from the beginning
        db_info = db_url[11:]
        # Split on '@' to separate user:password from host:port/database
        if '@' in db_info:
            user_pass, host_port_db = db_info.split('@')
            # Split user:pass
            if ':' in user_pass:
                user, password = user_pass.split(':')
            else:
                user = user_pass
                password = ''
            
            # Split host:port/database
            if '/' in host_port_db:
                host_port, database = host_port_db.split('/')
                if ':' in host_port:
                    host, port = host_port.split(':')
                else:
                    host = host_port
                    port = '5432'
            else:
                host = host_port_db
                port = '5432'
                database = 'postgres'
        else:
            raise ValueError("Invalid database URL format")
    else:
        raise ValueError("Only PostgreSQL URLs are supported")
    
    # Connect to PostgreSQL server (without specifying database)
    conn = psycopg2.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database='postgres'
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    # Check if database exists
    cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = '{database}'")
    exists = cursor.fetchone()
    
    if not exists:
        print(f"Creating database: {database}")
        cursor.execute(f"CREATE DATABASE {database}")
        print(f"Database '{database}' created successfully")
    else:
        print(f"Database '{database}' already exists")
    
    cursor.close()
    conn.close()


def run_migrations():
    """Run Alembic migrations"""
    print("Running database migrations...")
    
    # Get the path to alembic.ini
    alembic_ini_path = os.path.join(os.path.dirname(__file__), 'alembic.ini')
    
    # Configure Alembic
    alembic_cfg = Config(alembic_ini_path)
    
    # Run migrations
    command.upgrade(alembic_cfg, "head")
    print("Migrations completed successfully")


def create_tables():
    """Create tables using SQLAlchemy"""
    print("Creating database tables...")
    
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully")


def create_sample_data():
    """Create sample data for testing"""
    print("Creating sample data...")
    
    db = SessionLocal()
    
    try:
        # Create sample transactions
        sample_transactions = [
            Transaction(
                transaction_id="txn_001",
                amount=150.75,
                timestamp="2024-01-15 10:30:00",
                merchant="Amazon",
                category="Retail",
                account_id="ACC123",
                risk_score=15.5,
                is_suspicious=False,
                fraud_probability=5.2,
                anomaly_score=8.1
            ),
            Transaction(
                transaction_id="txn_002",
                amount=2500.00,
                timestamp="2024-01-15 14:22:00",
                merchant="Unknown",
                category="Transfer",
                account_id="ACC123",
                risk_score=85.2,
                is_suspicious=True,
                fraud_probability=75.8,
                anomaly_score=92.3,
                ai_explanation="High amount transaction with unknown merchant detected during unusual hours"
            ),
            Transaction(
                transaction_id="txn_003",
                amount=45.99,
                timestamp="2024-01-16 09:15:00",
                merchant="Starbucks",
                category="Food",
                account_id="ACC456",
                risk_score=12.3,
                is_suspicious=False,
                fraud_probability=3.1,
                anomaly_score=6.7
            ),
            Transaction(
                transaction_id="txn_004",
                amount=5000.00,
                timestamp="2024-01-16 23:45:00",
                merchant="Luxury Store",
                category="Retail",
                account_id="ACC789",
                risk_score=78.9,
                is_suspicious=True,
                fraud_probability=68.4,
                anomaly_score=82.1,
                ai_explanation="Large transaction during late night hours"
            )
        ]
        
        # Add transactions
        for txn in sample_transactions:
            db.add(txn)
        
        # Create sample alerts
        sample_alerts = [
            Alert(
                transaction_id="txn_002",
                alert_type="high_amount",
                severity="high",
                message="Unusually large transaction detected: $2500.00"
            ),
            Alert(
                transaction_id="txn_002",
                alert_type="unknown_merchant",
                severity="medium",
                message="Transaction with unknown merchant"
            ),
            Alert(
                transaction_id="txn_004",
                alert_type="unusual_time",
                severity="high",
                message="Transaction during unusual hours: 23:45"
            )
        ]
        
        # Add alerts
        for alert in sample_alerts:
            db.add(alert)
        
        # Create sample analysis job
        sample_job = AnalysisJob(
            job_id="job_001",
            status="completed",
            total_transactions=4,
            suspicious_transactions=2,
            processing_time=2.34
        )
        
        db.add(sample_job)
        
        # Commit all changes
        db.commit()
        print("Sample data created successfully")
        
    except Exception as e:
        print(f"Error creating sample data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def reset_database():
    """Reset the database (drop and recreate)"""
    print("Resetting database...")
    
    # Drop all tables
    Base.metadata.drop_all(bind=engine)
    print("All tables dropped")
    
    # Recreate tables
    Base.metadata.create_all(bind=engine)
    print("Tables recreated")


def main():
    """Main function to handle command line arguments"""
    parser = argparse.ArgumentParser(description='Database initialization script')
    parser.add_argument('--create-db', action='store_true', help='Create database')
    parser.add_argument('--migrate', action='store_true', help='Run migrations')
    parser.add_argument('--create-tables', action='store_true', help='Create tables')
    parser.add_argument('--sample-data', action='store_true', help='Create sample data')
    parser.add_argument('--reset', action='store_true', help='Reset database')
    parser.add_argument('--all', action='store_true', help='Run all initialization steps')
    
    args = parser.parse_args()
    
    if args.all:
        create_database()
        run_migrations()
        create_tables()
        create_sample_data()
    elif args.reset:
        reset_database()
    elif args.create_db:
        create_database()
    elif args.migrate:
        run_migrations()
    elif args.create_tables:
        create_tables()
    elif args.sample_data:
        create_sample_data()
    else:
        print("Please specify an action. Use --help for options.")


if __name__ == "__main__":
    main()
