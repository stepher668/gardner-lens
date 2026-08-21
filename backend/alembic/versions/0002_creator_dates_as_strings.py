"""creator dates as strings

Revision ID: 9ae50ac6a0bf
Revises: 6c12df2d3498
Create Date: 2026-08-21 02:34:14.432067

Creator.date_start/date_end move from INTEGER to VARCHAR(50). Real
biographical dates are often approximate/uncertain ("about 1400", "1266
or 1267"), which an int column can't hold without silently dropping the
qualifier - see the Creator model docstring in app/models/models.py.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9ae50ac6a0bf'
down_revision = '6c12df2d3498'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # int -> varchar always succeeds (every int has a valid text form).
    op.alter_column(
        "creators", "date_start",
        existing_type=sa.Integer(),
        type_=sa.String(length=50),
        postgresql_using="date_start::varchar(50)",
    )
    op.alter_column(
        "creators", "date_end",
        existing_type=sa.Integer(),
        type_=sa.String(length=50),
        postgresql_using="date_end::varchar(50)",
    )


def downgrade() -> None:
    # varchar -> int is lossy for the approximate/uncertain values this
    # migration exists to support ("about 1400" has no int form) -
    # deliberately left to fail loudly on such rows rather than silently
    # dropping data; clean those rows up manually before downgrading.
    op.alter_column(
        "creators", "date_start",
        existing_type=sa.String(length=50),
        type_=sa.Integer(),
        postgresql_using="date_start::integer",
    )
    op.alter_column(
        "creators", "date_end",
        existing_type=sa.String(length=50),
        type_=sa.Integer(),
        postgresql_using="date_end::integer",
    )
