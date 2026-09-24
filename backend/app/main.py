"""
Aplicación principal FastAPI — Cevichería D'Peñas.

Punto de entrada del backend. Configura CORS, incluye los routers
y expone la documentación automática en /docs.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import chatbot, reports, platillos, usuarios, reservas, ventas

settings = get_settings()

# ============================================================
# Crear la aplicación FastAPI
# ============================================================
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "API REST del sistema de gestión administrativa de la Cevichería D'Peñas. "
        "Incluye el módulo de Chatbot con Google Gemini para asistencia al cliente."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# ============================================================
# Configuración de CORS
# ============================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# Incluir Routers
# ============================================================
app.include_router(chatbot.router)
app.include_router(reports.router)
app.include_router(platillos.router)
app.include_router(usuarios.router)
app.include_router(reservas.router)
app.include_router(ventas.router)


# ============================================================
# Endpoint raíz
# ============================================================
@app.get("/", tags=["Root"])
async def root():
    """Endpoint raíz de la API."""
    return {
        "message": f"Bienvenido a la API de {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }
