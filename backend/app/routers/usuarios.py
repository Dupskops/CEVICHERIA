from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth import verificar_password, crear_token_acceso

router = APIRouter(
    prefix="/api/usuarios",
    tags=["Usuarios"]
)

@router.get("/")
def listar_usuarios(db: Session = Depends(get_db)):
    # Aquí el equipo programará la lógica real consultando la BD
    return {"mensaje": "Endpoint de usuarios en construcción"}

@router.post("/login")
def iniciar_sesion(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Aquí el equipo programará la consulta a Supabase para buscar al form_data.username
    # Luego usarán verificar_password(form_data.password, clave_hasheada_de_la_bd)
    
    # Simulamos un login exitoso por ahora para probar el sistema:
    if form_data.username == "admin" and form_data.password == "123456":
        token_jwt = crear_token_acceso(data={"sub": form_data.username})
        return {"access_token": token_jwt, "token_type": "bearer"}
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Usuario o contraseña incorrectos",
        headers={"WWW-Authenticate": "Bearer"},
    )