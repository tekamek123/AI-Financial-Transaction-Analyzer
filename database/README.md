# Database Module

This directory contains all database-related files for the AI Financial Transaction Analyzer project.

## 📁 File Structure

```
database/
├── README.md                    # This file
├── alembic.ini                  # Alembic configuration
├── init_db.py                   # Database initialization script
├── setup_database.py            # Complete database setup script
├── seed_data.py                 # Test data generation
├── health_check.py              # Database health monitoring
├── database_config.py          # Environment-specific configurations
└── migrations/                  # Database migration files
    ├── env.py                   # Alembic environment
    ├── script.py.mako           # Migration template
    └── versions/
        └── 001_initial_schema.py # Initial schema migration
```

## 🚀 Quick Start

### 1. Environment Setup

Set your environment variable:
```bash
export ENVIRONMENT=development  # or testing, staging, production
```

### 2. Complete Database Setup

```bash
cd database
python setup_database.py --setup --env development
```

This will:
- ✅ Create the database
- ✅ Run migrations
- ✅ Create sample data (1000 transactions)
- ✅ Run health check

### 3. Database Status Check

```bash
python setup_database.py --status
```

## 🛠 Available Scripts

### setup_database.py
Complete database management script with multiple operations:

```bash
# Setup complete database
python setup_database.py --setup --env development

# Reset database (clear and recreate)
python setup_database.py --reset --env development

# Create backup
python setup_database.py --backup ./backups/my_backup.sql

# Optimize database
python setup_database.py --optimize

# Show status
python setup_database.py --status
```

Options:
- `--env`: Target environment (development, testing, staging, production)
- `--no-sample-data`: Skip sample data creation
- `--transactions N`: Number of sample transactions (default: 1000)

### init_db.py
Basic database initialization:

```bash
python init_db.py --all                    # Run all steps
python init_db.py --create-db              # Create database only
python init_db.py --migrate                # Run migrations only
python init_db.py --sample-data            # Create sample data only
```

### seed_data.py
Generate test data for development:

```bash
# Generate 5000 transactions with 10% fraud rate
python seed_data.py --transactions 5000 --fraud-rate 0.1

# Clear all data
python seed_data.py --clear

# Generate CSV files only
python seed_data.py --csv-only --transactions 1000
```

### health_check.py
Database health monitoring:

```bash
# Run health check
python health_check.py

# Generate detailed report
python health_check.py --report

# Continuous monitoring (1 hour, checking every minute)
python health_check.py --monitor --interval 60 --duration 3600
```

## 🗄 Database Schema

### Tables

#### transactions
Main transaction records with AI analysis results.

```sql
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR UNIQUE NOT NULL,
    amount FLOAT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    merchant VARCHAR,
    category VARCHAR,
    account_id VARCHAR NOT NULL,
    risk_score FLOAT DEFAULT 0.0,
    is_suspicious BOOLEAN DEFAULT FALSE,
    fraud_probability FLOAT DEFAULT 0.0,
    anomaly_score FLOAT DEFAULT 0.0,
    ai_explanation TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### alerts
Alert records for suspicious transactions.

```sql
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR NOT NULL,
    alert_type VARCHAR NOT NULL,
    severity VARCHAR NOT NULL,
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id)
);
```

#### analysis_jobs
Background job tracking for AI analysis.

```sql
CREATE TABLE analysis_jobs (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR UNIQUE NOT NULL,
    status VARCHAR DEFAULT 'pending',
    total_transactions INTEGER DEFAULT 0,
    suspicious_transactions INTEGER DEFAULT 0,
    processing_time FLOAT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);
```

### Indexes

Optimized indexes for performance:

```sql
-- Transactions table indexes
CREATE INDEX ix_transactions_transaction_id ON transactions(transaction_id);
CREATE INDEX ix_transactions_account_id ON transactions(account_id);
CREATE INDEX ix_transactions_timestamp ON transactions(timestamp);
CREATE INDEX ix_transactions_is_suspicious ON transactions(is_suspicious);
CREATE INDEX ix_transactions_risk_score ON transactions(risk_score);

-- Alerts table indexes
CREATE INDEX ix_alerts_transaction_id ON alerts(transaction_id);
CREATE INDEX ix_alerts_severity ON alerts(severity);
CREATE INDEX ix_alerts_is_resolved ON alerts(is_resolved);
CREATE INDEX ix_alerts_created_at ON alerts(created_at);

-- Analysis jobs table indexes
CREATE INDEX ix_analysis_jobs_job_id ON analysis_jobs(job_id);
CREATE INDEX ix_analysis_jobs_status ON analysis_jobs(status);
CREATE INDEX ix_analysis_jobs_created_at ON analysis_jobs(created_at);
```

## 🔧 Configuration

### Environment-specific settings

Each environment has its own configuration in `database_config.py`:

- **Development**: Small pool, SQL logging enabled
- **Testing**: Separate test database, minimal logging
- **Staging**: Medium pool, production-like settings
- **Production**: Large pool, optimized for performance

### Connection Pool Settings

```python
'pool_size': 20,          # Base connection pool size
'max_overflow': 30,       # Additional connections under load
'pool_timeout': 30,        # Timeout for getting connection
'pool_recycle': 3600,      # Recycle connections every hour
'echo': False             # SQL logging (development only)
```

## 📊 Monitoring & Health Checks

### Health Check Components

1. **Connection Check**: Database connectivity
2. **Table Integrity**: Schema validation
3. **Data Consistency**: Relationship validation
4. **Performance**: Query performance metrics
5. **Storage**: Disk space and table sizes

### Monitoring Metrics

- Connection response time
- Query execution time
- Table row counts
- Index usage statistics
- Database size
- Error rates

## 🔄 Migrations

### Creating New Migration

```bash
cd database
alembic revision --autogenerate -m "Add new feature"
```

### Running Migrations

```bash
alembic upgrade head
```

### Rolling Back

```bash
alembic downgrade -1
```

### Migration History

```bash
alembic history
```

## 📈 Performance Optimization

### Database Optimization

```bash
python setup_database.py --optimize
```

This performs:
- Table statistics update (`ANALYZE`)
- Index rebuilding (`REINDEX`)
- Query plan optimization

### Query Optimization Tips

1. **Use appropriate indexes** for frequent queries
2. **Monitor slow queries** with `pg_stat_statements`
3. **Optimize connection pooling** for your workload
4. **Regular maintenance** (VACUUM, ANALYZE)
5. **Partition large tables** for better performance

## 🗂 Backup & Recovery

### Manual Backup

```bash
python setup_database.py --backup ./backups/manual_backup.sql
```

### Automated Backups

Production environments should have:
- Daily automated backups
- Backup retention policies
- Off-site backup storage
- Regular restore testing

### Recovery

```bash
python setup_database.py --restore ./backups/manual_backup.sql
```

## 🧪 Testing

### Test Database Setup

```bash
export ENVIRONMENT=testing
python setup_database.py --setup --env testing --no-sample-data
```

### Test Data Generation

```bash
python seed_data.py --transactions 100 --fraud-rate 0.1
```

## 🚨 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check database URL in environment
   - Verify database server is running
   - Check network connectivity

2. **Migration Failed**
   - Check database permissions
   - Verify migration file syntax
   - Check for locked tables

3. **Performance Issues**
   - Run health check: `python health_check.py`
   - Check slow queries
   - Optimize indexes

4. **Memory Issues**
   - Reduce connection pool size
   - Check for memory leaks
   - Monitor query memory usage

### Health Check Issues

```bash
# Run detailed health check
python health_check.py --report

# Monitor continuously
python health_check.py --monitor --interval 60 --duration 300
```

## 📝 Environment Variables

```bash
# Database configuration
ENVIRONMENT=development
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# Optional overrides
DB_HOST=localhost
DB_PORT=5432
DB_NAME=transaction_analyzer
DB_USER=postgres
DB_PASSWORD=password

# Backup configuration
BACKUP_PATH=/var/backups/transaction_analyzer/
```

## 🔐 Security Considerations

- Use environment variables for credentials
- Enable SSL connections in production
- Regular security updates
- Access control and permissions
- Audit logging for sensitive operations
- Encrypt sensitive data at rest

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Database Performance Tuning](https://wiki.postgresql.org/wiki/Tuning_Your_PostgreSQL_Server)
