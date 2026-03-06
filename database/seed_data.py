"""
Database seeding script for generating test data
"""

import random
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.core.database import SessionLocal
from app.models.transaction import Transaction, Alert, AnalysisJob


class DataSeeder:
    """Generate and seed test data for the database"""
    
    def __init__(self):
        self.db = SessionLocal()
        
        # Sample data
        self.merchants = [
            "Amazon", "Walmart", "Target", "Best Buy", "Home Depot",
            "Starbucks", "McDonald's", "Subway", "Chipotle", "Panera",
            "Shell", "BP", "Chevron", "Exxon", "Mobile",
            "Apple Store", "Microsoft Store", "Dell", "HP", "Lenovo",
            "Nike", "Adidas", "Under Armour", "Puma", "Reebok",
            "Unknown", "Online Store", "E-commerce", "Digital Store"
        ]
        
        self.categories = [
            "Retail", "Food", "Gas", "Electronics", "Clothing",
            "Entertainment", "Travel", "Healthcare", "Education", "Transfer",
            "Subscription", "Utilities", "Insurance", "Investment", "Other"
        ]
        
        self.account_ids = [
            "ACC001", "ACC002", "ACC003", "ACC004", "ACC005",
            "ACC006", "ACC007", "ACC008", "ACC009", "ACC010"
        ]
    
    def generate_transactions(self, count: int = 1000, fraud_rate: float = 0.05) -> List[Dict]:
        """Generate sample transactions"""
        transactions = []
        
        for i in range(count):
            # Generate timestamp (last 90 days)
            days_ago = random.randint(0, 90)
            hours_ago = random.randint(0, 23)
            minutes_ago = random.randint(0, 59)
            timestamp = datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)
            
            # Generate amount (log-normal distribution)
            amount = round(random.lognormvariate(3.0, 1.0), 2)
            amount = max(0.01, min(10000, amount))  # Clamp between $0.01 and $10,000
            
            # Select merchant and category
            merchant = random.choice(self.merchants)
            category = random.choice(self.categories)
            account_id = random.choice(self.account_ids)
            
            # Generate transaction ID
            transaction_id = f"txn_{i+1:06d}"
            
            # Determine if this should be a fraudulent transaction
            is_fraud = random.random() < fraud_rate
            
            if is_fraud:
                # Make fraudulent transactions more suspicious
                if random.random() < 0.3:
                    amount = round(random.uniform(1000, 10000), 2)  # High amount
                if random.random() < 0.4:
                    merchant = "Unknown"  # Unknown merchant
                if random.random() < 0.3:
                    # Unusual time (late night or early morning)
                    hour = random.choice([0, 1, 2, 3, 4, 5, 22, 23])
                    timestamp = timestamp.replace(hour=hour)
                
                # Higher risk scores for fraudulent transactions
                risk_score = random.uniform(60, 95)
                fraud_probability = random.uniform(50, 90)
                anomaly_score = random.uniform(70, 100)
                is_suspicious = True
            else:
                # Normal transactions have lower risk scores
                risk_score = random.uniform(0, 40)
                fraud_probability = random.uniform(0, 20)
                anomaly_score = random.uniform(0, 30)
                is_suspicious = False
            
            # Generate AI explanation for suspicious transactions
            ai_explanation = None
            if is_suspicious:
                explanations = [
                    f"High amount transaction of ${amount} detected",
                    f"Transaction with unknown merchant: {merchant}",
                    f"Unusual transaction time: {timestamp.strftime('%H:%M')}",
                    f"Abnormal spending pattern detected for account {account_id}",
                    f"Transaction frequency anomaly detected",
                    f"Multiple risk factors: high amount + unusual time"
                ]
                ai_explanation = random.choice(explanations)
            
            transactions.append({
                'transaction_id': transaction_id,
                'amount': amount,
                'timestamp': timestamp,
                'merchant': merchant,
                'category': category,
                'account_id': account_id,
                'risk_score': risk_score,
                'is_suspicious': is_suspicious,
                'fraud_probability': fraud_probability,
                'anomaly_score': anomaly_score,
                'ai_explanation': ai_explanation,
                'created_at': timestamp,
                'updated_at': timestamp
            })
        
        return transactions
    
    def generate_alerts(self, transactions: List[Dict]) -> List[Dict]:
        """Generate alerts for suspicious transactions"""
        alerts = []
        
        for txn in transactions:
            if txn['is_suspicious']:
                # Generate 1-3 alerts per suspicious transaction
                num_alerts = random.randint(1, 3)
                
                for i in range(num_alerts):
                    alert_types = ["high_amount", "unusual_time", "unknown_merchant", "frequency_anomaly", "abnormal_pattern"]
                    severities = ["low", "medium", "high", "critical"]
                    
                    alert_type = random.choice(alert_types)
                    severity = random.choice(severities)
                    
                    # Generate alert message based on type
                    messages = {
                        "high_amount": f"High amount transaction detected: ${txn['amount']:.2f}",
                        "unusual_time": f"Transaction at unusual time: {txn['timestamp'].strftime('%H:%M')}",
                        "unknown_merchant": f"Transaction with unknown merchant: {txn['merchant']}",
                        "frequency_anomaly": f"Unusual transaction frequency detected",
                        "abnormal_pattern": f"Abnormal spending pattern detected"
                    }
                    
                    message = messages.get(alert_type, "Suspicious activity detected")
                    
                    alerts.append({
                        'transaction_id': txn['transaction_id'],
                        'alert_type': alert_type,
                        'severity': severity,
                        'message': message,
                        'is_resolved': random.choice([True, False]) if random.random() < 0.3 else False,
                        'created_at': txn['timestamp']
                    })
        
        return alerts
    
    def generate_analysis_jobs(self, count: int = 50) -> List[Dict]:
        """Generate sample analysis jobs"""
        jobs = []
        
        for i in range(count):
            # Generate timestamp (last 30 days)
            days_ago = random.randint(0, 30)
            hours_ago = random.randint(0, 23)
            created_at = datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago)
            
            # Random status
            statuses = ["pending", "processing", "completed", "failed"]
            weights = [0.1, 0.1, 0.7, 0.1]  # Most jobs are completed
            status = random.choices(statuses, weights=weights)[0]
            
            # Generate job data
            total_transactions = random.randint(10, 5000)
            suspicious_rate = random.uniform(0.02, 0.15)  # 2-15% suspicious rate
            suspicious_transactions = int(total_transactions * suspicious_rate)
            
            processing_time = None
            completed_at = None
            error_message = None
            
            if status == "completed":
                processing_time = random.uniform(0.5, 30.0)  # 0.5 to 30 seconds
                completed_at = created_at + timedelta(seconds=processing_time)
            elif status == "failed":
                error_message = random.choice([
                    "Insufficient data for analysis",
                    "Model training failed",
                    "Database connection error",
                    "Invalid transaction data",
                    "Memory allocation error"
                ])
            
            jobs.append({
                'job_id': f"job_{i+1:06d}",
                'status': status,
                'total_transactions': total_transactions,
                'suspicious_transactions': suspicious_transactions,
                'processing_time': processing_time,
                'error_message': error_message,
                'created_at': created_at,
                'completed_at': completed_at
            })
        
        return jobs
    
    def seed_database(self, num_transactions: int = 1000, fraud_rate: float = 0.05):
        """Seed the database with sample data"""
        print(f"Generating {num_transactions} transactions with {fraud_rate*100}% fraud rate...")
        
        try:
            # Generate transactions
            transactions = self.generate_transactions(num_transactions, fraud_rate)
            
            # Insert transactions
            for txn_data in transactions:
                transaction = Transaction(**txn_data)
                self.db.add(transaction)
            
            self.db.commit()
            print(f"Inserted {len(transactions)} transactions")
            
            # Generate and insert alerts
            alerts = self.generate_alerts(transactions)
            
            for alert_data in alerts:
                alert = Alert(**alert_data)
                self.db.add(alert)
            
            self.db.commit()
            print(f"Inserted {len(alerts)} alerts")
            
            # Generate and insert analysis jobs
            jobs = self.generate_analysis_jobs()
            
            for job_data in jobs:
                job = AnalysisJob(**job_data)
                self.db.add(job)
            
            self.db.commit()
            print(f"Inserted {len(jobs)} analysis jobs")
            
            print("Database seeding completed successfully!")
            
        except Exception as e:
            print(f"Error seeding database: {e}")
            self.db.rollback()
            raise
        finally:
            self.db.close()
    
    def clear_database(self):
        """Clear all data from database"""
        try:
            # Delete in correct order (due to foreign keys)
            self.db.query(Alert).delete()
            self.db.query(Transaction).delete()
            self.db.query(AnalysisJob).delete()
            
            self.db.commit()
            print("Database cleared successfully!")
            
        except Exception as e:
            print(f"Error clearing database: {e}")
            self.db.rollback()
            raise
        finally:
            self.db.close()
    
    def generate_csv_files(self, num_transactions: int = 1000, fraud_rate: float = 0.05):
        """Generate CSV files for testing file upload"""
        print(f"Generating CSV files with {num_transactions} transactions...")
        
        # Generate transactions
        transactions = self.generate_transactions(num_transactions, fraud_rate)
        
        # Convert to DataFrame
        df = pd.DataFrame(transactions)
        
        # Select columns for CSV
        csv_columns = ['transaction_id', 'amount', 'timestamp', 'merchant', 'category', 'account_id']
        df_csv = df[csv_columns].copy()
        
        # Format timestamp for CSV
        df_csv['timestamp'] = df_csv['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S')
        
        # Save CSV file
        csv_filename = 'sample_transactions.csv'
        df_csv.to_csv(csv_filename, index=False)
        print(f"CSV file saved as: {csv_filename}")
        
        # Also save a JSON version
        json_filename = 'sample_transactions.json'
        df_csv.to_json(json_filename, orient='records', indent=2)
        print(f"JSON file saved as: {json_filename}")
        
        return csv_filename, json_filename


def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Database seeding script')
    parser.add_argument('--transactions', type=int, default=1000, help='Number of transactions to generate')
    parser.add_argument('--fraud-rate', type=float, default=0.05, help='Fraud rate (0.0-1.0)')
    parser.add_argument('--clear', action='store_true', help='Clear database before seeding')
    parser.add_argument('--csv-only', action='store_true', help='Only generate CSV files')
    
    args = parser.parse_args()
    
    seeder = DataSeeder()
    
    if args.csv_only:
        seeder.generate_csv_files(args.transactions, args.fraud_rate)
    else:
        if args.clear:
            seeder.clear_database()
        
        seeder.seed_database(args.transactions, args.fraud_rate)


if __name__ == "__main__":
    main()
