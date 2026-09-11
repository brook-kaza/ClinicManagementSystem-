"""add doctor_id to clinical tables and license_no to users

Revision ID: e7f1a2b3c4d5
Revises: b4c8d2e3f5a6
Create Date: 2026-09-11
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision: str = 'e7f1a2b3c4d5'
down_revision: Union[str, None] = 'd6e0f1a2b3c4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add license_no to users table
    op.add_column('users', sa.Column('license_no', sa.String(100), nullable=True))

    # 2. Add doctor_id (nullable first) to all 6 clinical/financial tables
    tables_to_update = ['visits', 'invoices', 'prescriptions', 'sick_leaves', 'medical_certificates', 'referrals']
    
    for table in tables_to_update:
        op.add_column(table, sa.Column('doctor_id', sa.Integer(), nullable=True))

    # 3. Backfill: set all existing rows to the admin user's ID
    # We find the admin dynamically so this works on any database
    conn = op.get_bind()
    result = conn.execute(sa.text("SELECT id FROM users WHERE username = 'admin' LIMIT 1"))
    admin_row = result.fetchone()
    
    if admin_row:
        admin_id = admin_row[0]
        for table in tables_to_update:
            conn.execute(sa.text(f"UPDATE {table} SET doctor_id = :admin_id WHERE doctor_id IS NULL"), {"admin_id": admin_id})

    # 4. Add foreign key constraints and indexes
    for table in tables_to_update:
        op.create_foreign_key(
            f'fk_{table}_doctor_id_users',
            table, 'users',
            ['doctor_id'], ['id']
        )
        op.create_index(f'ix_{table}_doctor_id', table, ['doctor_id'])


def downgrade() -> None:
    tables_to_update = ['visits', 'invoices', 'prescriptions', 'sick_leaves', 'medical_certificates', 'referrals']
    
    for table in tables_to_update:
        op.drop_index(f'ix_{table}_doctor_id', table_name=table)
        op.drop_constraint(f'fk_{table}_doctor_id_users', table, type_='foreignkey')
        op.drop_column(table, 'doctor_id')

    op.drop_column('users', 'license_no')
