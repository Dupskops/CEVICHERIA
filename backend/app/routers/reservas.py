from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth import oauth2_scheme
from app.models.models import Reserva
from pydantic import BaseModel
from datetime import date, time
from jose import JWTError, jwt
from app.services.auth import ALGORITHM, SECRET_KEY
from app.models.models import Usuario


def require_staff(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # Compatibilidad con el login administrativo actual (usuarios.py).
        if payload.get("sub") == "admin@dpenas.pe":
            return payload
        user = db.query(Usuario).filter(Usuario.usuario == payload.get("sub")).first()
        if not user or user.rol not in ("admin", "empleado"):
            raise HTTPException(403, "Acceso reservado al personal")
        return user
    except JWTError:
        raise HTTPException(401, "Sesión inválida")

router = APIRouter(
    prefix="/api/reservas",
    tags=["Reservas"]
)

class ReservaBase(BaseModel):
    nombre: str
    fecha: date
    hora: time
    descripcion: str | None = None
    estado: str = "confirmada"
    Usuarios_idUsuario: int = 1 # Admin predeterminado
    mesa_id: str | None = "t1"
    telefono: str | None = None
    comensales: int | None = 2

class ReservaOut(ReservaBase):
    idReserva: int
    class Config:
        from_attributes = True

@router.get("", response_model=list[ReservaOut])
def listar_reservas(db: Session = Depends(get_db)):
    reservas = db.query(Reserva).all()
    return reservas

@router.post("", response_model=ReservaOut)
def crear_reserva(
    payload: ReservaBase,
    db: Session = Depends(get_db), 
    token: str = Depends(oauth2_scheme)
):
    nueva = Reserva(
        Usuarios_idUsuario=payload.Usuarios_idUsuario,
        nombre=payload.nombre,
        fecha=payload.fecha,
        hora=payload.hora,
        descripcion=payload.descripcion,
        estado=payload.estado,
        mesa_id=payload.mesa_id,
        telefono=payload.telefono,
        comensales=payload.comensales
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@router.post("/{id}/check-in", response_model=ReservaOut)
def check_in(id: int, db: Session = Depends(get_db), staff=Depends(require_staff)):
    return transition_reservation(db, id, "confirmada", "ocupada")


@router.post("/{id}/check-out", response_model=ReservaOut)
def check_out(id: int, db: Session = Depends(get_db), staff=Depends(require_staff)):
    return transition_reservation(db, id, "ocupada", "completada")


def transition_reservation(db: Session, id: int, source: str, target: str):
    # La condición en UPDATE evita carreras con la revisión de inasistencias.
    count = db.query(Reserva).filter(Reserva.idReserva == id, Reserva.estado == source).update(
        {Reserva.estado: target}, synchronize_session=False
    )
    if not count:
        db.rollback()
        raise HTTPException(409, "La reserva cambió de estado. Actualiza el listado.")
    db.commit()
    return db.query(Reserva).filter(Reserva.idReserva == id).one()

@router.delete("/{id}")
def eliminar_reserva(id: int, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    reserva = db.query(Reserva).filter(Reserva.idReserva == id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    db.delete(reserva)
    db.commit()
    return {"message": "Reserva eliminada"}
