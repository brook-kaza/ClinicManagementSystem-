"""add specific_dates column to sick_leaves

Revision ID: c5d9e3f4a7b8
Revises: b4c8d2e3f5a6
Create Date: 2026-08-13 06:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c5d9e3f4a7b8'
down_revision: Union[str, None] = 'b4c8d2e3f5a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add nullable specific_dates column for non-consecutive sick leave days
    op.add_column('sick_leaves', sa.Column('specific_dates', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('sick_leaves', 'specific_dates')
