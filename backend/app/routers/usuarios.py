from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth import verificar_password, crear_token_acceso
from app.models.models import Usuario
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/usuarios",
    tags=["Usuarios"]
)

# --- Esquemas Pydantic para Usuarios ---
class UserBase(BaseModel):
    name: str
    email: str
    role: str
    active: bool
    phone: str | None = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    role: str | None = None
    active: bool | None = None
    phone: str | None = None
    password: str | None = None

class UserOut(UserBase):
    id: int
    class Config:
        from_attributes = True

@router.get("/", response_model=list[UserOut])
def listar_usuarios(db: Session = Depends(get_db)):
    usuarios_db = db.query(Usuario).all()
    # Transformar para que coincida con el frontend (name, email) en vez de (usuario, clave)
    result = []
    for u in usuarios_db:
        result.append({
            "id": u.idUsuario,
            "name": u.usuario, # Asumimos que "usuario" guarda el nombre
            "email": f"{u.usuario.lower().replace(' ', '')}@dpenas.pe", # Mock email
            "role": u.rol,
            "active": True,
            "phone": "+51 999 999 999"
        })
    return result

@router.post("/", response_model=UserOut)
def crear_usuario(payload: UserCreate, db: Session = Depends(get_db)):
    nuevo_usuario = Usuario(
        usuario=payload.name,
        clave=payload.password, # Ojo: en un entorno real debe hashearse
        rol=payload.role
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return {
        "id": nuevo_usuario.idUsuario,
        "name": nuevo_usuario.usuario,
        "email": payload.email,
        "role": nuevo_usuario.rol,
        "active": payload.active,
        "phone": payload.phone
    }

@router.delete("/{id}")
def eliminar_usuario(id: int, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.idUsuario == id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(usuario)
    db.commit()
    return {"message": "Usuario eliminado"}

@router.post("/login")
def iniciar_sesion(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Simulamos un login exitoso por ahora para probar el sistema:
    if form_data.username == "admin@dpenas.pe" and form_data.password == "Admin123!":
        token_jwt = crear_token_acceso(data={"sub": form_data.username})
        return {"access_token": token_jwt, "token_type": "bearer"}
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Usuario o contraseña incorrectos",
        headers={"WWW-Authenticate": "Bearer"},
    )