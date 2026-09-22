"""initial: create ventas tables

Revision ID: e0bd99a603e7
Revises: 
Create Date: 2026-09-22 16:06:40.579310

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e0bd99a603e7'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Tabla ventas ---
    op.create_table(
        "ventas",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("numero", sa.String(length=20), nullable=False),
        sa.Column("fecha", sa.DateTime(), nullable=False),
        sa.Column("cliente_nombre", sa.String(length=150), nullable=True),
        sa.Column("cliente_documento", sa.String(length=20), nullable=True),
        sa.Column(
            "subtotal", sa.Numeric(precision=10, scale=2), nullable=False
        ),
        sa.Column(
            "igv", sa.Numeric(precision=10, scale=2), nullable=False
        ),
        sa.Column(
            "total", sa.Numeric(precision=10, scale=2), nullable=False
        ),
        sa.Column(
            "estado", sa.String(length=20), nullable=False, server_default="emitida"
        ),
        sa.Column("observaciones", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ventas_numero"), "ventas", ["numero"], unique=True)
    op.create_index(op.f("ix_ventas_id"), "ventas", ["id"], unique=False)

    # --- Tabla ventas_detalle ---
    op.create_table(
        "ventas_detalle",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column(
            "venta_id",
            sa.Integer(),
            sa.ForeignKey("ventas.id"),
            nullable=False,
        ),
        sa.Column(
            "platillo_nombre", sa.String(length=150), nullable=False
        ),
        sa.Column("cantidad", sa.Integer(), nullable=False),
        sa.Column(
            "precio_unitario",
            sa.Numeric(precision=10, scale=2),
            nullable=False,
        ),
        sa.Column(
            "subtotal", sa.Numeric(precision=10, scale=2), nullable=False
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_ventas_detalle_id"),
        "ventas_detalle",
        ["id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_ventas_detalle_id"), table_name="ventas_detalle")
    op.drop_table("ventas_detalle")
    op.drop_index(op.f("ix_ventas_id"), table_name="ventas")
    op.drop_index(op.f("ix_ventas_numero"), table_name="ventas")
    op.drop_table("ventas")
