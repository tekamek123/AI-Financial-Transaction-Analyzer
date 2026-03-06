"""Initial database schema

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create transactions table
    op.create_table('transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('transaction_id', sa.String(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('merchant', sa.String(), nullable=True),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('account_id', sa.String(), nullable=False),
        sa.Column('risk_score', sa.Float(), nullable=True, default=0.0),
        sa.Column('is_suspicious', sa.Boolean(), nullable=True, default=False),
        sa.Column('fraud_probability', sa.Float(), nullable=True, default=0.0),
        sa.Column('anomaly_score', sa.Float(), nullable=True, default=0.0),
        sa.Column('ai_explanation', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('transaction_id')
    )
    
    # Create indexes for transactions table
    op.create_index('ix_transactions_transaction_id', 'transactions', ['transaction_id'])
    op.create_index('ix_transactions_account_id', 'transactions', ['account_id'])
    op.create_index('ix_transactions_timestamp', 'transactions', ['timestamp'])
    op.create_index('ix_transactions_is_suspicious', 'transactions', ['is_suspicious'])
    op.create_index('ix_transactions_risk_score', 'transactions', ['risk_score'])
    
    # Create alerts table
    op.create_table('alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('transaction_id', sa.String(), nullable=False),
        sa.Column('alert_type', sa.String(), nullable=False),
        sa.Column('severity', sa.String(), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('is_resolved', sa.Boolean(), nullable=True, default=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.transaction_id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for alerts table
    op.create_index('ix_alerts_transaction_id', 'alerts', ['transaction_id'])
    op.create_index('ix_alerts_severity', 'alerts', ['severity'])
    op.create_index('ix_alerts_is_resolved', 'alerts', ['is_resolved'])
    op.create_index('ix_alerts_created_at', 'alerts', ['created_at'])
    
    # Create analysis_jobs table
    op.create_table('analysis_jobs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('job_id', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=True, default='pending'),
        sa.Column('total_transactions', sa.Integer(), nullable=True, default=0),
        sa.Column('suspicious_transactions', sa.Integer(), nullable=True, default=0),
        sa.Column('processing_time', sa.Float(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('job_id')
    )
    
    # Create indexes for analysis_jobs table
    op.create_index('ix_analysis_jobs_job_id', 'analysis_jobs', ['job_id'])
    op.create_index('ix_analysis_jobs_status', 'analysis_jobs', ['status'])
    op.create_index('ix_analysis_jobs_created_at', 'analysis_jobs', ['created_at'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('analysis_jobs')
    op.drop_table('alerts')
    op.drop_table('transactions')
