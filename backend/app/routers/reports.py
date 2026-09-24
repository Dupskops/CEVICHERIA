"""
Router del módulo de Reportes.
Expone los endpoints para generar comprobantes y tickets en PDF.
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Venta
from app.services.auth import oauth2_scheme
from app.services.report_service import (
    generar_comprobante_venta,
    generar_ticket_comanda,
)

router = APIRouter(
    prefix="/api/reports",
    tags=["Reportes"],
    responses={
        500: {"description": "Error al generar el reporte"},
    },
)


@router.get(
    "/sales/{venta_id}/comprobante",
    summary="Descargar comprobante de venta (PDF A4)",
    description="Genera y retorna el comprobante de venta en formato PDF A4.",
)
def get_comprobante(venta_id: int, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    """
    Genera el comprobante PDF de una venta específica.
    Retorna un StreamingResponse con el archivo PDF en memoria.
    """
    venta = (
        db.query(Venta)
        .filter(Venta.idVenta == venta_id)
        .first()
    )

    if not venta:
        raise HTTPException(
            status_code=404,
            detail=f"Venta con id {venta_id} no encontrada.",
        )

    pdf_bytes = generar_comprobante_venta(venta)
    filename = f"comprobante_{venta.numero}.pdf"

    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        },
    )


@router.get(
    "/sales/{venta_id}/ticket",
    summary="Descargar ticket de comanda (térmico 80mm)",
    description="Genera y retorna el ticket de comanda en formato térmico (80mm) como PDF.",
)
def get_ticket(venta_id: int, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    """
    Genera el ticket PDF de una venta específica.
    Retorna un StreamingResponse con el archivo PDF en memoria.
    """
    venta = (
        db.query(Venta)
        .filter(Venta.idVenta == venta_id)
        .first()
    )

    if not venta:
        raise HTTPException(
            status_code=404,
            detail=f"Venta con id {venta_id} no encontrada.",
        )

    pdf_bytes = generar_ticket_comanda(venta)
    filename = f"ticket_{venta.numero}.pdf"

    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        },
    )
