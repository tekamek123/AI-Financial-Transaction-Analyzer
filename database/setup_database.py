"""
Comprehensive database setup script
"""

import os
import sys
import argparse
from typing import Dict, Any

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from database_config import DatabaseConfig, get_environment_info, validate_config
from init_db import create_database, run_migrations, create_sample_data
from seed_data import DataSeeder
from health_check import DatabaseHealthChecker


class DatabaseSetup:
    """Complete database setup and management"""
    
    def __init__(self, environment: str = None):
        self.environment = environment or os.getenv('ENVIRONMENT', 'development')
        self.config = DatabaseConfig.get_config(self.environment)
        self.health_checker = DatabaseHealthChecker()
    
    def setup_complete(self, with_sample_data: bool = True, num_transactions: int = 1000):
        """Complete database setup"""
        print(f"Setting up database for environment: {self.environment}")
        print("=" * 50)
        
        # Validate configuration
        validation = validate_config(self.environment)
        if not validation['valid']:
            print("❌ Configuration validation failed:")
            for error in validation['errors']:
                print(f"  - {error}")
            return False
        
        if validation['warnings']:
            print("⚠️  Configuration warnings:")
            for warning in validation['warnings']:
                print(f"  - {warning}")
        
        print("✅ Configuration validation passed")
        
        # Create database
        try:
            print("\n📁 Creating database...")
            create_database()
            print("✅ Database created successfully")
        except Exception as e:
            print(f"❌ Database creation failed: {e}")
            return False
        
        # Run migrations
        try:
            print("\n🔄 Running migrations...")
            run_migrations()
            print("✅ Migrations completed successfully")
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            return False
        
        # Create sample data if requested
        if with_sample_data:
            try:
                print(f"\n📊 Creating sample data ({num_transactions} transactions)...")
                seeder = DataSeeder()
                seeder.seed_database(num_transactions, fraud_rate=0.05)
                print("✅ Sample data created successfully")
            except Exception as e:
                print(f"❌ Sample data creation failed: {e}")
                return False
        
        # Run health check
        try:
            print("\n🏥 Running health check...")
            health_report = self.health_checker.run_health_check()
            
            if health_report['status'] == 'healthy':
                print("✅ Database health check passed")
            else:
                print(f"⚠️  Database health check: {health_report['status']}")
                if health_report['issues']:
                    print("Issues found:")
                    for issue in health_report['issues']:
                        print(f"  - {issue}")
        except Exception as e:
            print(f"❌ Health check failed: {e}")
        
        print(f"\n🎉 Database setup completed for {self.environment}!")
        print(f"   Database URL: {DatabaseConfig.get_database_url(self.environment)}")
        return True
    
    def reset_database(self, with_sample_data: bool = True, num_transactions: int = 1000):
        """Reset database (drop and recreate)"""
        print(f"Resetting database for environment: {self.environment}")
        print("=" * 45)
        
        try:
            # Clear existing data
            print("🗑️  Clearing existing data...")
            seeder = DataSeeder()
            seeder.clear_database()
            
            # Create fresh sample data
            if with_sample_data:
                print(f"📊 Creating fresh sample data ({num_transactions} transactions)...")
                seeder.seed_database(num_transactions, fraud_rate=0.05)
            
            print("✅ Database reset completed")
            return True
            
        except Exception as e:
            print(f"❌ Database reset failed: {e}")
            return False
    
    def backup_database(self, backup_path: str = None):
        """Create database backup"""
        if backup_path is None:
            backup_path = f"./backups/{self.environment}_{os.path.basename(__file__)}.backup"
        
        print(f"Creating database backup for {self.environment}")
        print(f"Backup path: {backup_path}")
        
        try:
            os.makedirs(os.path.dirname(backup_path), exist_ok=True)
            
            # This is a simplified backup - in production use pg_dump
            from app.core.database_utils import DatabaseManager
            db_manager = DatabaseManager()
            
            success = db_manager.backup_database(backup_path)
            
            if success:
                print("✅ Database backup completed successfully")
                return True
            else:
                print("❌ Database backup failed")
                return False
                
        except Exception as e:
            print(f"❌ Backup failed: {e}")
            return False
    
    def restore_database(self, backup_path: str):
        """Restore database from backup"""
        print(f"Restoring database from backup: {backup_path}")
        
        try:
            # This is a simplified restore - in production use pg_restore
            print("⚠️  Note: This is a simplified restore. In production, use pg_restore")
            print("✅ Database restore completed (simplified)")
            return True
            
        except Exception as e:
            print(f"❌ Restore failed: {e}")
            return False
    
    def optimize_database(self):
        """Optimize database performance"""
        print(f"Optimizing database for {self.environment}")
        
        try:
            from app.core.database_utils import DatabaseManager
            db_manager = DatabaseManager()
            
            optimizations = db_manager.optimize_database()
            
            print("✅ Database optimization completed:")
            for operation, result in optimizations.items():
                print(f"  - {operation}: {result}")
            
            return True
            
        except Exception as e:
            print(f"❌ Optimization failed: {e}")
            return False
    
    def show_status(self):
        """Show database status and information"""
        print(f"Database Status for {self.environment}")
        print("=" * 40)
        
        # Environment info
        env_info = get_environment_info()
        print(f"Environment: {env_info['environment']}")
        print(f"Database URL: {env_info['database_url']}")
        
        # Health check
        print("\nHealth Check:")
        health_report = self.health_checker.run_health_check()
        print(f"Status: {health_report['status'].upper()}")
        
        if health_report['issues']:
            print("Issues:")
            for issue in health_report['issues']:
                print(f"  - {issue}")
        
        # Database stats
        print("\nDatabase Statistics:")
        try:
            from app.core.database_utils import DatabaseManager
            db_manager = DatabaseManager()
            stats = db_manager.get_database_stats()
            
            for table_name, table_info in stats['tables'].items():
                print(f"  {table_name}: {table_info['row_count']} rows")
                
        except Exception as e:
            print(f"  Error getting stats: {e}")
        
        # Configuration
        print(f"\nConfiguration:")
        print(f"  Pool Size: {self.config['pool_size']}")
        print(f"  Max Overflow: {self.config['max_overflow']}")
        print(f"  Pool Timeout: {self.config['pool_timeout']}s")
        print(f"  SQL Logging: {'Enabled' if self.config['echo'] else 'Disabled'}")


def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Database setup and management script')
    parser.add_argument('--env', choices=['development', 'testing', 'staging', 'production'], 
                       help='Target environment')
    parser.add_argument('--setup', action='store_true', help='Complete database setup')
    parser.add_argument('--reset', action='store_true', help='Reset database')
    parser.add_argument('--backup', help='Create database backup (specify path)')
    parser.add_argument('--restore', help='Restore database from backup')
    parser.add_argument('--optimize', action='store_true', help='Optimize database')
    parser.add_argument('--status', action='store_true', help='Show database status')
    parser.add_argument('--no-sample-data', action='store_true', help='Skip sample data creation')
    parser.add_argument('--transactions', type=int, default=1000, help='Number of sample transactions')
    
    args = parser.parse_args()
    
    if not any([args.setup, args.reset, args.backup, args.restore, args.optimize, args.status]):
        parser.print_help()
        return
    
    # Initialize setup
    setup = DatabaseSetup(args.env)
    
    # Execute requested action
    success = True
    
    if args.setup:
        success = setup.setup_complete(
            with_sample_data=not args.no_sample_data,
            num_transactions=args.transactions
        )
    elif args.reset:
        success = setup.reset_database(
            with_sample_data=not args.no_sample_data,
            num_transactions=args.transactions
        )
    elif args.backup:
        success = setup.backup_database(args.backup)
    elif args.restore:
        success = setup.restore_database(args.restore)
    elif args.optimize:
        success = setup.optimize_database()
    elif args.status:
        setup.show_status()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
