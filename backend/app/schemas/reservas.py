"""
Schemas Pydantic para el módulo de Reservas.
"""

import re
from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator

HORA_PATTERN = r"^([01]\d|2[0-3]):[0-5]\d$"


class MesaSchema(BaseModel):
    """Esquema de una mesa del restaurante."""

    id: int
    numero: str
    capacidad: int
    area: str

    model_config = {"from_attributes": True}


class MesaDisponibleSchema(BaseModel):
    """Mesa con su estado para una fecha y hora concretas."""

    id: int
    numero: str
    capacidad: int
    area: str
    estado: str  # "disponible" | "reservada"

    model_config = {"from_attributes": True}


class DisponibilidadResponse(BaseModel):
    """Disponibilidad de mesas para un slot (fecha + hora)."""

    fecha: date
    hora: str
    comensales: int | None = None
    total: int
    disponibles: int
    mesas: list[MesaDisponibleSchema] = []


class ReservaCreate(BaseModel):
    """Datos para crear una reserva."""

    cliente_nombre: str = Field(min_length=3, max_length=150)
    cliente_telefono: str | None = Field(default=None, max_length=20)
    fecha: date
    hora: str = Field(pattern=HORA_PATTERN)
    comensales: int = Field(ge=1, le=20)
    mesa_id: int
    notas: str | None = Field(default=None, max_length=255)

    @field_validator("cliente_nombre")
    @classmethod
    def _nombre_no_espacios(cls, v: str) -> str:
        nombre = v.strip()
        if not nombre:
            raise ValueError("El nombre del cliente no puede estar vacío.")
        return nombre


class ReservaSchema(BaseModel):
    """Esquema de una reserva completa."""

    id: int
    codigo: str
    cliente_nombre: str
    cliente_telefono: str | None = None
    fecha: date
    hora: str
    comensales: int
    mesa_id: int
    mesa_numero: str | None = None
    estado: str
    notas: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ReservaCancelResponse(BaseModel):
    """Respuesta al cancelar una reserva."""

    message: str
    reserva: "ReservaSchema"