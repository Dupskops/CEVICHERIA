"""
Schemas Pydantic para el módulo de Reportes.
"""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class VentaDetalleSchema(BaseModel):
    """Esquema de un ítem del comprobante."""

    platillo_nombre: str
    cantidad: int
    precio_unitario: Decimal
    subtotal: Decimal


class VentaSchema(BaseModel):
    """Esquema de una venta completa para los reportes."""

    id: int
    numero: str
    fecha: datetime
    cliente_nombre: str | None = None
    cliente_documento: str | None = None
    subtotal: Decimal
    igv: Decimal
    total: Decimal
    estado: str
    detalles: list[VentaDetalleSchema] = []

    model_config = {"from_attributes": True}


class VentaResumen(BaseModel):
    """Esquema resumido para listados de ventas."""

    id: int
    numero: str
    fecha: datetime
    cliente_nombre: str | None = None
    total: Decimal
    estado: str

    model_config = {"from_attributes": True}


class ReporteResponse(BaseModel):
    """Respuesta al solicitar un reporte PDF."""

    message: str
    filename: str
    venta_id: int
