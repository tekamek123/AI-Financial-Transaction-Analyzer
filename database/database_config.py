"""
Database configuration for different environments
"""

import os
from typing import Dict, Any


class DatabaseConfig:
    """Database configuration management"""
    
    # Environment-specific configurations
    ENVIRONMENTS = {
        'development': {
            'host': 'localhost',
            'port': 5432,
            'database': 'transaction_analyzer_dev',
            'username': 'postgres',
            'password': 'postgres',
            'pool_size': 5,
            'max_overflow': 10,
            'pool_timeout': 30,
            'pool_recycle': 3600,
            'echo': True  # Enable SQL logging
        },
        'testing': {
            'host': 'localhost',
            'port': 5432,
            'database': 'transaction_analyzer_test',
            'username': 'postgres',
            'password': 'postgres',
            'pool_size': 5,
            'max_overflow': 10,
            'pool_timeout': 30,
            'pool_recycle': 3600,
            'echo': False
        },
        'staging': {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': int(os.getenv('DB_PORT', 5432)),
            'database': os.getenv('DB_NAME', 'transaction_analyzer_staging'),
            'username': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', ''),
            'pool_size': 10,
            'max_overflow': 20,
            'pool_timeout': 30,
            'pool_recycle': 3600,
            'echo': False
        },
        'production': {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': int(os.getenv('DB_PORT', 5432)),
            'database': os.getenv('DB_NAME', 'transaction_analyzer'),
            'username': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', ''),
            'pool_size': 20,
            'max_overflow': 30,
            'pool_timeout': 30,
            'pool_recycle': 3600,
            'echo': False
        }
    }
    
    @classmethod
    def get_config(cls, environment: str = None) -> Dict[str, Any]:
        """Get database configuration for specified environment"""
        if environment is None:
            environment = os.getenv('ENVIRONMENT', 'development')
        
        if environment not in cls.ENVIRONMENTS:
            raise ValueError(f"Unknown environment: {environment}. Available: {list(cls.ENVIRONMENTS.keys())}")
        
        return cls.ENVIRONMENTS[environment].copy()
    
    @classmethod
    def get_database_url(cls, environment: str = None) -> str:
        """Get database URL for specified environment"""
        config = cls.get_config(environment)
        
        return (
            f"postgresql://{config['username']}:{config['password']}"
            f"@{config['host']}:{config['port']}/{config['database']}"
        )
    
    @classmethod
    def get_engine_kwargs(cls, environment: str = None) -> Dict[str, Any]:
        """Get SQLAlchemy engine kwargs for specified environment"""
        config = cls.get_config(environment)
        
        return {
            'pool_size': config['pool_size'],
            'max_overflow': config['max_overflow'],
            'pool_timeout': config['pool_timeout'],
            'pool_recycle': config['pool_recycle'],
            'echo': config['echo']
        }


# Connection string templates
CONNECTION_TEMPLATES = {
    'postgresql': 'postgresql://{username}:{password}@{host}:{port}/{database}',
    'postgresql+psycopg2': 'postgresql+psycopg2://{username}:{password}@{host}:{port}/{database}',
    'sqlite': 'sqlite:////{database}',
    'mysql': 'mysql+pymysql://{username}:{password}@{host}:{port}/{database}'
}


class MigrationConfig:
    """Alembic migration configuration"""
    
    @classmethod
    def get_alembic_config(cls, environment: str = None) -> Dict[str, str]:
        """Get Alembic configuration for specified environment"""
        db_url = DatabaseConfig.get_database_url(environment)
        
        return {
            'sqlalchemy.url': db_url,
            'file_template': '%%(year)d_%%(month).2d_%%(day).2d_%%(hour).2d%%(minute).2d_%%(rev)s_%%(slug)s'
        }


class BackupConfig:
    """Database backup configuration"""
    
    BACKUP_SETTINGS = {
        'development': {
            'enabled': False,
            'schedule': 'daily',
            'retention_days': 7,
            'compression': True,
            'backup_path': './backups/development/'
        },
        'testing': {
            'enabled': False,
            'schedule': 'manual',
            'retention_days': 1,
            'compression': False,
            'backup_path': './backups/testing/'
        },
        'staging': {
            'enabled': True,
            'schedule': 'daily',
            'retention_days': 30,
            'compression': True,
            'backup_path': os.getenv('BACKUP_PATH', '/var/backups/transaction_analyzer/staging/')
        },
        'production': {
            'enabled': True,
            'schedule': 'daily',
            'retention_days': 90,
            'compression': True,
            'backup_path': os.getenv('BACKUP_PATH', '/var/backups/transaction_analyzer/production/')
        }
    }
    
    @classmethod
    def get_backup_config(cls, environment: str = None) -> Dict[str, Any]:
        """Get backup configuration for specified environment"""
        if environment is None:
            environment = os.getenv('ENVIRONMENT', 'development')
        
        return cls.BACKUP_SETTINGS.get(environment, cls.BACKUP_SETTINGS['development'])


class MonitoringConfig:
    """Database monitoring configuration"""
    
    MONITORING_SETTINGS = {
        'development': {
            'enabled': True,
            'health_check_interval': 300,  # 5 minutes
            'performance_monitoring': True,
            'alert_thresholds': {
                'connection_time': 5.0,  # seconds
                'query_time': 10.0,      # seconds
                'error_rate': 0.05       # 5%
            }
        },
        'testing': {
            'enabled': False,
            'health_check_interval': 600,  # 10 minutes
            'performance_monitoring': False,
            'alert_thresholds': {
                'connection_time': 10.0,
                'query_time': 30.0,
                'error_rate': 0.10
            }
        },
        'staging': {
            'enabled': True,
            'health_check_interval': 180,  # 3 minutes
            'performance_monitoring': True,
            'alert_thresholds': {
                'connection_time': 3.0,
                'query_time': 5.0,
                'error_rate': 0.02
            }
        },
        'production': {
            'enabled': True,
            'health_check_interval': 60,   # 1 minute
            'performance_monitoring': True,
            'alert_thresholds': {
                'connection_time': 2.0,
                'query_time': 3.0,
                'error_rate': 0.01
            }
        }
    }
    
    @classmethod
    def get_monitoring_config(cls, environment: str = None) -> Dict[str, Any]:
        """Get monitoring configuration for specified environment"""
        if environment is None:
            environment = os.getenv('ENVIRONMENT', 'development')
        
        return cls.MONITORING_SETTINGS.get(environment, cls.MONITORING_SETTINGS['development'])


def get_environment_info() -> Dict[str, Any]:
    """Get current environment information"""
    environment = os.getenv('ENVIRONMENT', 'development')
    
    return {
        'environment': environment,
        'database_config': DatabaseConfig.get_config(environment),
        'database_url': DatabaseConfig.get_database_url(environment),
        'backup_config': BackupConfig.get_backup_config(environment),
        'monitoring_config': MonitoringConfig.get_monitoring_config(environment)
    }


def validate_config(environment: str = None) -> Dict[str, Any]:
    """Validate database configuration"""
    if environment is None:
        environment = os.getenv('ENVIRONMENT', 'development')
    
    validation_result = {
        'environment': environment,
        'valid': True,
        'errors': [],
        'warnings': []
    }
    
    try:
        config = DatabaseConfig.get_config(environment)
        
        # Validate required fields
        required_fields = ['host', 'port', 'database', 'username']
        for field in required_fields:
            if not config.get(field):
                validation_result['valid'] = False
                validation_result['errors'].append(f"Missing required field: {field}")
        
        # Validate port
        if not (1 <= config['port'] <= 65535):
            validation_result['valid'] = False
            validation_result['errors'].append(f"Invalid port: {config['port']}")
        
        # Warnings for production
        if environment == 'production':
            if config['echo']:
                validation_result['warnings'].append("SQL logging enabled in production")
            
            if config['pool_size'] < 10:
                validation_result['warnings'].append("Small pool size for production")
        
    except Exception as e:
        validation_result['valid'] = False
        validation_result['errors'].append(f"Configuration error: {str(e)}")
    
    return validation_result


if __name__ == "__main__":
    """Print environment information when run directly"""
    import json
    
    env_info = get_environment_info()
    validation = validate_config()
    
    print("DATABASE ENVIRONMENT INFORMATION")
    print("=" * 40)
    print(json.dumps(env_info, indent=2))
    
    print("\nCONFIGURATION VALIDATION")
    print("=" * 30)
    print(f"Valid: {validation['valid']}")
    
    if validation['errors']:
        print("\nErrors:")
        for error in validation['errors']:
            print(f"  - {error}")
    
    if validation['warnings']:
        print("\nWarnings:")
        for warning in validation['warnings']:
            print(f"  - {warning}")
