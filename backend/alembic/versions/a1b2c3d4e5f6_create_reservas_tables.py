"""create reservas and mesas tables

Revision ID: a1b2c3d4e5f6
Revises: e0bd99a603e7
Create Date: 2026-09-23 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'e0bd99a603e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# --- Datos de las 15 mesas (igual que frontend/src/data/tables.ts) ---
_MESAS_DATA = [
    {"numero": "M-01", "capacidad": 2, "area": "Terraza"},
    {"numero": "M-02", "capacidad": 2, "area": "Terraza"},
    {"numero": "M-03", "capacidad": 2, "area": "Terraza"},
    {"numero": "M-04", "capacidad": 2, "area": "Sala principal"},
    {"numero": "M-05", "capacidad": 2, "area": "Sala principal"},
    {"numero": "M-06", "capacidad": 2, "area": "Sala principal"},
    {"numero": "M-07", "capacidad": 4, "area": "Ventanal"},
    {"numero": "M-08", "capacidad": 4, "area": "Ventanal"},
    {"numero": "M-09", "capacidad": 4, "area": "Ventanal"},
    {"numero": "M-10", "capacidad": 4, "area": "Sala principal"},
    {"numero": "M-11", "capacidad": 4, "area": "Sala principal"},
    {"numero": "M-12", "capacidad": 4, "area": "Terraza"},
    {"numero": "M-13", "capacidad": 6, "area": "Ventanal"},
    {"numero": "M-14", "capacidad": 6, "area": "Ventanal"},
    {"numero": "M-15", "capacidad": 6, "area": "Sala principal"},
]


def upgrade() -> None:
    # --- Tabla mesas ---
    op.create_table(
        "mesas",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("numero", sa.String(length=10), nullable=False),
        sa.Column("capacidad", sa.Integer(), nullable=False),
        sa.Column(
            "area",
            sa.String(length=50),
            nullable=False,
            server_default="Sala principal",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_mesas_numero"), "mesas", ["numero"], unique=True)
    op.create_index(op.f("ix_mesas_id"), "mesas", ["id"], unique=False)

    # --- Seed de las 15 mesas ---
    op.bulk_insert(
        sa.table(
            "mesas",
            sa.column("numero", sa.String),
            sa.column("capacidad", sa.Integer),
            sa.column("area", sa.String),
        ),
        _MESAS_DATA,
    )

    # --- Tabla reservas ---
    op.create_table(
        "reservas",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("codigo", sa.String(length=20), nullable=False),
        sa.Column("cliente_nombre", sa.String(length=150), nullable=False),
        sa.Column("cliente_telefono", sa.String(length=20), nullable=True),
        sa.Column("fecha", sa.Date(), nullable=False),
        sa.Column("hora", sa.String(length=5), nullable=False),
        sa.Column("comensales", sa.Integer(), nullable=False),
        sa.Column(
            "mesa_id",
            sa.Integer(),
            sa.ForeignKey("mesas.id"),
            nullable=False,
        ),
        sa.Column(
            "estado",
            sa.String(length=20),
            nullable=False,
            server_default="confirmada",
        ),
        sa.Column("notas", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_reservas_codigo"), "reservas", ["codigo"], unique=True)
    op.create_index(op.f("ix_reservas_fecha"), "reservas", ["fecha"], unique=False)
    op.create_index(op.f("ix_reservas_hora"), "reservas", ["hora"], unique=False)
    op.create_index(op.f("ix_reservas_id"), "reservas", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_reservas_id"), table_name="reservas")
    op.drop_index(op.f("ix_reservas_hora"), table_name="reservas")
    op.drop_index(op.f("ix_reservas_fecha"), table_name="reservas")
    op.drop_index(op.f("ix_reservas_codigo"), table_name="reservas")
    op.drop_table("reservas")
    op.drop_index(op.f("ix_mesas_id"), table_name="mesas")
    op.drop_index(op.f("ix_mesas_numero"), table_name="mesas")
    op.drop_table("mesas")