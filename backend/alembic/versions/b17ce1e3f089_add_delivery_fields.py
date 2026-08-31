"""Add delivery fields

Revision ID: b17ce1e3f089
Revises: 4089758b3769
Create Date: 2026-08-31 08:12:26.221153

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b17ce1e3f089'
down_revision: Union[str, Sequence[str], None] = '4089758b3769'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('deliveries', sa.Column('assigned_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False))
    op.add_column('deliveries', sa.Column('out_for_delivery_at', sa.DateTime(), nullable=True))
    op.add_column('deliveries', sa.Column('otp_hash', sa.String(length=128), nullable=True))
    op.add_column('deliveries', sa.Column('otp_expires_at', sa.DateTime(), nullable=True))
    op.add_column('deliveries', sa.Column('otp_attempts', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('deliveries', sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False))
    op.add_column('deliveries', sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('deliveries', 'updated_at')
    op.drop_column('deliveries', 'created_at')
    op.drop_column('deliveries', 'otp_attempts')
    op.drop_column('deliveries', 'otp_expires_at')
    op.drop_column('deliveries', 'otp_hash')
    op.drop_column('deliveries', 'out_for_delivery_at')
    op.drop_column('deliveries', 'assigned_at')
