from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth import oauth2_scheme

router = APIRouter(
    prefix="/api/platillos",
    tags=["Platillos"]
)

# Endpoint público
@router.get("/")
def listar_platillos(db: Session = Depends(get_db)):
    # Aquí el equipo programará la lógica real consultando la BD
    return {"mensaje": "Endpoint de platillos en construcción"}

# Endpoint PRIVADO (Solo administradores/empleados logueados pueden crear platillos)
@router.post("/")
def crear_platillo(
    db: Session = Depends(get_db), 
    token: str = Depends(oauth2_scheme) # <--- Esta línea protege la ruta
):
    return {"mensaje": "Platillo creado exitosamente", "token_usado": token}