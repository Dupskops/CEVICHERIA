from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
import os

# Configuración
SECRET_KEY = os.environ.get("SECRET_KEY", "clave_de_respaldo_insegura")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Motor de encriptación de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Le indica a FastAPI dónde debe enviar el frontend las credenciales para obtener el token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/usuarios/login")

def verificar_password(plain_password, hashed_password):
    """Compara la contraseña en texto plano con la encriptada en la BD"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Encripta una contraseña nueva antes de guardarla en la BD"""
    return pwd_context.hash(password)

def crear_token_acceso(data: dict):
    """Genera el JWT válido por el tiempo definido"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt