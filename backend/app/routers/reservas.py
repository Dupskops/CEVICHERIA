"""
Router del módulo de Reservas.
Expone el CRUD de reservas, la disponibilidad de mesas y la cancelación.
"""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.reserva import Mesa, Reserva
from app.schemas.reservas import (
    DisponibilidadResponse,
    MesaDisponibleSchema,
    MesaSchema,
    ReservaCancelResponse,
    ReservaCreate,
    ReservaSchema,
)
from app.services.reserva_service import (
    calcular_disponibilidad,
    es_hora_pasada,
    generar_codigo,
    reserva_to_schema,
    verificar_conflicto,
)

HORA_PATTERN = "^([01]\\d|2[0-3]):[0-5]\\d$"

router = APIRouter(
    prefix="/api/reservas",
    tags=["Reservas"],
    responses={
        500: {"description": "Error interno del servidor"},
    },
)


# ============================================================
# Mesas
# ============================================================
@router.get(
    "/mesas",
    response_model=list[MesaSchema],
    summary="Listar mesas del restaurante",
    description="Retorna las 15 mesas configuradas con su capacidad y área.",
)
def listar_mesas(db: Session = Depends(get_db)):
    """Lista todas las mesas ordenadas por número."""
    return db.query(Mesa).order_by(Mesa.numero).all()


@router.get(
    "/disponibilidad",
    response_model=DisponibilidadResponse,
    summary="Consultar disponibilidad de mesas",
    description=(
        "Retorna las mesas disponibles para una fecha y hora concretas. "
        "Si se indica comensales, solo se listan mesas con esa capacidad."
    ),
)
def disponibilidad(
    fecha: date = Query(..., description="Fecha en formato YYYY-MM-DD"),
    hora: str = Query(..., pattern=HORA_PATTERN, description="Hora en formato HH:MM"),
    comensales: int | None = Query(None, ge=1, le=20, description="Número de comensales"),
    db: Session = Depends(get_db),
):
    """Consulta la disponibilidad de mesas para un slot."""
    mesas, disponibles, total = calcular_disponibilidad(
        db, fecha=fecha, hora=hora, comensales=comensales
    )
    return DisponibilidadResponse(
        fecha=fecha,
        hora=hora,
        comensales=comensales,
        total=total,
        disponibles=disponibles,
        mesas=[MesaDisponibleSchema(**m) for m in mesas],
    )


# ============================================================
# CRUD de Reservas
# ============================================================
@router.get(
    "",
    response_model=list[ReservaSchema],
    summary="Listar reservas",
    description="Lista todas las reservas, opcionalmente filtradas por fecha.",
)
def listar_reservas(
    fecha: date | None = Query(None, description="Filtrar por fecha YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """Lista las reservas ordenadas por fecha y hora."""
    query = db.query(Reserva).order_by(Reserva.fecha, Reserva.hora)
    if fecha:
        query = query.filter(Reserva.fecha == fecha)
    return [reserva_to_schema(r) for r in query.all()]


@router.get(
    "/{reserva_id}",
    response_model=ReservaSchema,
    summary="Obtener una reserva",
    description="Retorna una reserva por su id.",
)
def obtener_reserva(reserva_id: int, db: Session = Depends(get_db)):
    """Obtiene una reserva específica."""
    reserva = db.query(Reserva).filter(Reserva.id == reserva_id).first()
    if not reserva:
        raise HTTPException(
            status_code=404,
            detail=f"Reserva con id {reserva_id} no encontrada.",
        )
    return reserva_to_schema(reserva)


@router.post(
    "",
    response_model=ReservaSchema,
    status_code=201,
    summary="Crear reserva",
    description=(
        "Crea una reserva validando la mesa, la capacidad, el horario "
        "y que no exista un conflicto de disponibilidad."
    ),
)
def crear_reserva(data: ReservaCreate, db: Session = Depends(get_db)):
    """Crea una reserva de mesa."""
    mesa = db.query(Mesa).filter(Mesa.id == data.mesa_id).first()
    if not mesa:
        raise HTTPException(
            status_code=404,
            detail=f"Mesa con id {data.mesa_id} no encontrada.",
        )

    if data.comensales > mesa.capacidad:
        raise HTTPException(
            status_code=400,
            detail=(
                f"La mesa {mesa.numero} admite hasta {mesa.capacidad} "
                f"comensales y la reserva es de {data.comensales}."
            ),
        )

    if es_hora_pasada(data.fecha, data.hora):
        raise HTTPException(
            status_code=400,
            detail="No se puede reservar en una fecha u hora pasada.",
        )

    if verificar_conflicto(db, data.mesa_id, data.fecha, data.hora):
        raise HTTPException(
            status_code=409,
            detail=(
                f"La mesa {mesa.numero} ya está reservada para "
                f"{data.fecha} a las {data.hora}."
            ),
        )

    reserva = Reserva(
        codigo=generar_codigo(db, data.fecha),
        cliente_nombre=data.cliente_nombre,
        cliente_telefono=data.cliente_telefono,
        fecha=data.fecha,
        hora=data.hora,
        comensales=data.comensales,
        mesa_id=data.mesa_id,
        notas=data.notas,
        estado="confirmada",
    )
    reserva.mesa = mesa

    db.add(reserva)
    db.commit()
    db.refresh(reserva)

    return reserva_to_schema(reserva)


@router.post(
    "/{reserva_id}/cancelar",
    response_model=ReservaCancelResponse,
    summary="Cancelar reserva",
    description="Cancela una reserva (baja lógica: estado 'cancelada').",
)
def cancelar_reserva(reserva_id: int, db: Session = Depends(get_db)):
    """Cancela una reserva existente."""
    reserva = db.query(Reserva).filter(Reserva.id == reserva_id).first()
    if not reserva:
        raise HTTPException(
            status_code=404,
            detail=f"Reserva con id {reserva_id} no encontrada.",
        )

    if reserva.estado == "cancelada":
        raise HTTPException(
            status_code=400,
            detail=f"La reserva {reserva.codigo} ya está cancelada.",
        )

    reserva.estado = "cancelada"
    db.commit()
    db.refresh(reserva)

    return ReservaCancelResponse(
        message=f"Reserva {reserva.codigo} cancelada exitosamente.",
        reserva=reserva_to_schema(reserva),
    )


@router.delete(
    "/{reserva_id}",
    status_code=204,
    summary="Eliminar reserva",
    description="Elimina físicamente una reserva de la base de datos.",
)
def eliminar_reserva(reserva_id: int, db: Session = Depends(get_db)):
    """Elimina una reserva de forma permanente."""
    reserva = db.query(Reserva).filter(Reserva.id == reserva_id).first()
    if not reserva:
        raise HTTPException(
            status_code=404,
            detail=f"Reserva con id {reserva_id} no encontrada.",
        )
    db.delete(reserva)
    db.commit()