"""
Servicio del módulo de Reservas.
Lógica de negocio: generación de códigos, validación de conflictos
y cálculo de disponibilidad de mesas.
"""

from datetime import date, datetime

from sqlalchemy.orm import Session

from app.models.reserva import Mesa, Reserva
from app.schemas.reservas import ReservaSchema


# ============================================================
# Códigos de reserva
# ============================================================
def generar_codigo(db: Session, fecha: date) -> str:
    """
    Genera un código único para una reserva: RST-YYYYMMDD-NNN.
    El correlativo diario se calcula según las reservas ya registradas.
    """
    cantidad = (
        db.query(Reserva)
        .filter(Reserva.fecha == fecha)
        .count()
    )
    return f"RST-{fecha.strftime('%Y%m%d')}-{cantidad + 1:03d}"


# ============================================================
# Validaciones
# ============================================================
def es_hora_pasada(fecha: date, hora: str) -> bool:
    """Indica si el slot (fecha + hora) ya ocurrió en el pasado."""
    hora_obj = datetime.strptime(hora, "%H:%M").time()
    slot = datetime.combine(fecha, hora_obj)
    return slot < datetime.now()


def verificar_conflicto(db: Session, mesa_id: int, fecha: date, hora: str) -> bool:
    """
    Retorna True si existe una reserva confirmada que ya ocupa
    la mesa en la fecha y hora exactas (regla de franja de 30 min).
    """
    existente = (
        db.query(Reserva)
        .filter(
            Reserva.mesa_id == mesa_id,
            Reserva.fecha == fecha,
            Reserva.hora == hora,
            Reserva.estado == "confirmada",
        )
        .first()
    )
    return existente is not None


# ============================================================
# Disponibilidad
# ============================================================
def calcular_disponibilidad(
    db: Session,
    fecha: date,
    hora: str,
    comensales: int | None = None,
) -> tuple[list[dict], int, int]:
    """
    Calcula la disponibilidad de mesas para un slot.

    Returns:
        (mesas, disponibles, total): cada mesa es un dict con id, numero,
        capacidad, area y estado ('disponible' | 'reservada').
    """
    query = db.query(Mesa)
    if comensales:
        query = query.filter(Mesa.capacidad >= comensales)
    mesas = query.order_by(Mesa.numero).all()

    reservadas = {
        r.mesa_id
        for r in db.query(Reserva)
        .filter(
            Reserva.fecha == fecha,
            Reserva.hora == hora,
            Reserva.estado == "confirmada",
        )
        .all()
    }

    disponibles = 0
    resultado: list[dict] = []
    for mesa in mesas:
        estado = "reservada" if mesa.id in reservadas else "disponible"
        if estado == "disponible":
            disponibles += 1
        resultado.append(
            {
                "id": mesa.id,
                "numero": mesa.numero,
                "capacidad": mesa.capacidad,
                "area": mesa.area,
                "estado": estado,
            }
        )

    return resultado, disponibles, len(mesas)


# ============================================================
# Serialización
# ============================================================
def reserva_to_schema(reserva: Reserva) -> ReservaSchema:
    """Construye el schema de salida incluyendo el número de mesa."""
    return ReservaSchema(
        id=reserva.id,
        codigo=reserva.codigo,
        cliente_nombre=reserva.cliente_nombre,
        cliente_telefono=reserva.cliente_telefono,
        fecha=reserva.fecha,
        hora=reserva.hora,
        comensales=reserva.comensales,
        mesa_id=reserva.mesa_id,
        mesa_numero=reserva.mesa.numero if reserva.mesa else None,
        estado=reserva.estado,
        notas=reserva.notas,
        created_at=reserva.created_at,
    )