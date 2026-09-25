from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth import oauth2_scheme
from app.models.models import Reserva
from pydantic import BaseModel
from datetime import date, time

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

class ReservaOut(ReservaBase):
    idReserva: int
    class Config:
        from_attributes = True

@router.get("/", response_model=list[ReservaOut])
def listar_reservas(db: Session = Depends(get_db)):
    reservas = db.query(Reserva).all()
    return reservas

@router.post("/", response_model=ReservaOut)
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
        estado=payload.estado
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

@router.delete("/{id}")
def eliminar_reserva(id: int, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    reserva = db.query(Reserva).filter(Reserva.idReserva == id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    db.delete(reserva)
    db.commit()
    return {"message": "Reserva eliminada"}