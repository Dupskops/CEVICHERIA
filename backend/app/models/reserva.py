"""
Modelos SQLAlchemy para el módulo de Reservas.
Proporciona las entidades Mesa y Reserva de la Cevichería D'Peñas.
"""

from datetime import date, datetime

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Mesa(Base):
    """Mesa física del restaurante."""

    __tablename__ = "mesas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    numero = Column(String(10), unique=True, nullable=False, index=True)
    capacidad = Column(Integer, nullable=False, default=2)
    area = Column(String(50), nullable=False, default="Sala principal")

    # Relación con reservas
    reservas = relationship("Reserva", back_populates="mesa")


class Reserva(Base):
    """Reserva de una mesa para una fecha y hora concretas."""

    __tablename__ = "reservas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    codigo = Column(String(20), unique=True, nullable=False, index=True)
    cliente_nombre = Column(String(150), nullable=False)
    cliente_telefono = Column(String(20), nullable=True)
    fecha = Column(Date, nullable=False, index=True)
    hora = Column(String(5), nullable=False, index=True)
    comensales = Column(Integer, nullable=False, default=1)
    mesa_id = Column(Integer, ForeignKey("mesas.id"), nullable=False)
    estado = Column(String(20), nullable=False, default="confirmada")
    notas = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    mesa = relationship("Mesa", back_populates="reservas")