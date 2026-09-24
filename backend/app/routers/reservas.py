from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth import oauth2_scheme

router = APIRouter(
    prefix="/api/reservas",
    tags=["Reservas"]
)

@router.get("/")
def listar_reservas(db: Session = Depends(get_db)):
    # Aquí el equipo programará la lógica real consultando la BD
    return {"mensaje": "Endpoint de ventas en construcción"}

@router.post("/")
def crear_reserva(
    db: Session = Depends(get_db), 
    token: str = Depends(oauth2_scheme) # <--- Esta línea protege la ruta
):
    return {"mensaje": "Reserva creada exitosamente", "token_usado": token}