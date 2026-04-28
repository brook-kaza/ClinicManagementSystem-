"""add xray_images table

Revision ID: b4c8d2e3f5a6
Revises: a3b7c9d1e2f4
Create Date: 2026-04-28 10:22:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b4c8d2e3f5a6'
down_revision: Union[str, None] = 'a3b7c9d1e2f4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('xray_images',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('visit_id', sa.Integer(), nullable=False),
        sa.Column('image_url', sa.String(length=500), nullable=False),
        sa.Column('label', sa.String(length=200), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['visit_id'], ['visits.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_xray_images_id'), 'xray_images', ['id'], unique=False)
    op.create_index(op.f('ix_xray_images_visit_id'), 'xray_images', ['visit_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_xray_images_visit_id'), table_name='xray_images')
    op.drop_index(op.f('ix_xray_images_id'), table_name='xray_images')
    op.drop_table('xray_images')
