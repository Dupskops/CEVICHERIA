"""
Modelos SQLAlchemy para el módulo de Ventas.
Proporciona la base para los reportes de comprobantes y tickets.
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Venta(Base):
    """Modelo de una venta / comprobante."""

    __tablename__ = "ventas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    numero = Column(String(20), unique=True, nullable=False, index=True)
    fecha = Column(DateTime, default=datetime.utcnow, nullable=False)
    cliente_nombre = Column(String(150), nullable=True)
    cliente_documento = Column(String(20), nullable=True)
    subtotal = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    igv = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    total = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    estado = Column(String(20), nullable=False, default="emitida")
    observaciones = Column(Text, nullable=True)

    # Relación con detalle
    detalles = relationship(
        "VentaDetalle", back_populates="venta", cascade="all, delete-orphan"
    )


class VentaDetalle(Base):
    """Detalle de una venta (ítem de la comanda)."""

    __tablename__ = "ventas_detalle"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    venta_id = Column(Integer, ForeignKey("ventas.id"), nullable=False)
    platillo_nombre = Column(String(150), nullable=False)
    cantidad = Column(Integer, nullable=False, default=1)
    precio_unitario = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)

    venta = relationship("Venta", back_populates="detalles")
