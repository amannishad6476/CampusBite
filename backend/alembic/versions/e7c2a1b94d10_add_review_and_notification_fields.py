"""Add review timestamps, unique constraint, and notification order_id

Revision ID: e7c2a1b94d10
Revises: bfc927ae9f0f
Create Date: 2026-09-04 11:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e7c2a1b94d10'
down_revision: Union[str, Sequence[str], None] = 'bfc927ae9f0f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema with non-destructive review and notification enhancements."""
    # 1. Reviews table enhancements
    op.add_column('reviews', sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False))
    op.add_column('reviews', sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False))
    op.create_unique_constraint('uq_reviews_order_id', 'reviews', ['order_id'])
    op.create_index(op.f('ix_reviews_student_id'), 'reviews', ['student_id'], unique=False)
    op.create_index(op.f('ix_reviews_shop_id'), 'reviews', ['shop_id'], unique=False)

    # 2. Notifications table enhancements
    op.add_column('notifications', sa.Column('order_id', sa.String(length=36), nullable=True))
    op.create_foreign_key('fk_notifications_order_id', 'notifications', 'orders', ['order_id'], ['id'], ondelete='SET NULL')
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)
    op.create_index(op.f('ix_notifications_order_id'), 'notifications', ['order_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_notifications_order_id'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_user_id'), table_name='notifications')
    op.drop_constraint('fk_notifications_order_id', 'notifications', type_='foreignkey')
    op.drop_column('notifications', 'order_id')

    op.drop_index(op.f('ix_reviews_shop_id'), table_name='reviews')
    op.drop_index(op.f('ix_reviews_student_id'), table_name='reviews')
    op.drop_constraint('uq_reviews_order_id', 'reviews', type_='unique')
    op.drop_column('reviews', 'updated_at')
    op.drop_column('reviews', 'created_at')
