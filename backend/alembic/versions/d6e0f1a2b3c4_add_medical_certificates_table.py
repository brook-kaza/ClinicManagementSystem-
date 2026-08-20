"""add medical_certificates table

Revision ID: d6e0f1a2b3c4
Revises: c5d9e3f4a7b8
Create Date: 2026-08-20 08:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd6e0f1a2b3c4'
down_revision: Union[str, None] = 'c5d9e3f4a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'medical_certificates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('visit_id', sa.Integer(), nullable=True),
        sa.Column('date_issued', sa.DateTime(), nullable=False),
        sa.Column('date_examined', sa.DateTime(), nullable=False),
        sa.Column('diagnosis', sa.String(length=500), nullable=False),
        sa.Column('recommended_rest_days', sa.Integer(), nullable=True),
        sa.Column('start_date', sa.DateTime(), nullable=True),
        sa.Column('end_date', sa.DateTime(), nullable=True),
        sa.Column('specific_dates', sa.Text(), nullable=True),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('doctor_name', sa.String(length=150), nullable=True),
        sa.Column('license_no', sa.String(length=100), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.ForeignKeyConstraint(['visit_id'], ['visits.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_medical_certificates_id'), 'medical_certificates', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_medical_certificates_id'), table_name='medical_certificates')
    op.drop_table('medical_certificates')
