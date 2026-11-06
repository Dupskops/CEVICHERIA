"""Operaciones internas para el planificador n8n; horario de Perú."""
import logging
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import and_, or_, update
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models.models import Reserva

router = APIRouter(prefix="/api/automation", tags=["Automatización"])
LIMA = timezone(timedelta(hours=-5))
logger = logging.getLogger(__name__)


def require_automation_key(x_automation_key: str = Header(default="")):
    expected = get_settings().AUTOMATION_API_KEY
    if not expected:
        raise HTTPException(503, "Automatización sin configurar")
    if not secrets.compare_digest(x_automation_key.encode(), expected.encode()):
        raise HTTPException(401, "Credencial de automatización inválida")


def release_no_shows(db: Session, now: datetime) -> list[int]:
    """Cambio atómico: solo confirmadas vencidas; repetir no altera otras reservas."""
    cutoff = now.astimezone(LIMA) - timedelta(minutes=15)
    statement = (
        update(Reserva)
        .where(
            Reserva.estado == "confirmada",
            Reserva.fecha.is_not(None),
            Reserva.hora.is_not(None),
            or_(Reserva.fecha < cutoff.date(), and_(
                Reserva.fecha == cutoff.date(), Reserva.hora <= cutoff.time().replace(tzinfo=None)
            )),
            ~Reserva.ventas.any(),
        )
        .values(estado="no_asistio")
        .returning(Reserva.idReserva)
    )
    ids = list(db.scalars(statement))
    db.commit()
    logger.info("Liberación por inasistencia: %s", ids)
    return ids


@router.post("/reservas/no-show", dependencies=[Depends(require_automation_key)])
def process_no_shows(db: Session = Depends(get_db)):
    now = datetime.now(LIMA)
    ids = release_no_shows(db, now)
    return {"procesado_en": now.isoformat(), "liberadas": len(ids), "reservas": ids}
