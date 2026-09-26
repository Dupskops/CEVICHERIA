"""
Router del módulo Chatbot.
Expone los endpoints para interactuar con el asistente IA de la Cevichería D'Peñas.
"""

from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date

from app.database import get_db
from app.models.models import Platillo, Venta, Reserva

from app.schemas.chatbot import (
    ChatHealthResponse,
    ChatRequest,
    ChatResetRequest,
    ChatResetResponse,
    ChatResponse,
)
from app.services.gemini_service import gemini_service

router = APIRouter(
    prefix="/api/chat",
    tags=["Chatbot"],
    responses={
        500: {"description": "Error interno del servidor"},
    },
)

def get_realtime_context(db: Session) -> str:
    # 1. Platillos
    platillos = db.query(Platillo).all()
    lista_platillos = ", ".join([f"{p.nombre} (S/. {p.precio})" for p in platillos])
    
    # 2. Ventas
    hoy = date.today()
    ventas_hoy = db.query(Venta).filter(func.date(Venta.fecha) == hoy).all()
    total_ingresos = sum([v.total for v in ventas_hoy])
    cantidad_ventas = len(ventas_hoy)
    
    # 3. Reservas
    reservas_hoy = db.query(Reserva).filter(func.date(Reserva.fecha) == hoy, Reserva.estado == 'confirmada').count()
    
    context = (
        f"[INFO INTERNA BD: Platillos Carta: {lista_platillos}. "
        f"Métricas hoy: {cantidad_ventas} ventas (Ingresos S/. {total_ingresos:.2f}), "
        f"{reservas_hoy} reservas confirmadas.]"
    )
    return context


@router.post(
    "",
    response_model=ChatResponse,
    summary="Enviar mensaje al chatbot",
    description="Envía un mensaje del usuario al asistente IA y recibe la respuesta generada.",
)
async def send_message(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Endpoint principal del chatbot.

    Recibe un mensaje del usuario, le inyecta el contexto en tiempo real
    de la base de datos y retorna la respuesta del asistente.
    """
    # Construir el mensaje enriquecido con contexto RAG
    db_context = get_realtime_context(db)
    enriched_message = f"{request.message}\n\n{db_context}"

    result = await gemini_service.generate_response(
        message=enriched_message,
        session_id=request.session_id,
    )

    if "error" in result:
        raise HTTPException(
            status_code=503,
            detail={
                "message": result["response"],
                "error": result["error"],
            },
        )

    return ChatResponse(
        response=result["response"],
        session_id=result["session_id"],
        timestamp=result["timestamp"],
    )


@router.post(
    "/reset",
    response_model=ChatResetResponse,
    summary="Reiniciar sesión de chat",
    description="Elimina el historial de conversación de una sesión específica.",
)
async def reset_session(request: ChatResetRequest):
    """
    Reinicia una sesión de chat.

    Elimina el historial de conversación para que el usuario
    pueda empezar una nueva conversación limpia.
    """
    was_reset = gemini_service.reset_session(request.session_id)

    if not was_reset:
        raise HTTPException(
            status_code=404,
            detail=f"Sesión '{request.session_id}' no encontrada.",
        )

    return ChatResetResponse(
        message="Sesión reiniciada exitosamente.",
        session_id=request.session_id,
    )


@router.get(
    "/health",
    response_model=ChatHealthResponse,
    summary="Health check del chatbot",
    description="Verifica que el servicio de chatbot esté operativo.",
)
async def health_check():
    """
    Health check del servicio de chatbot.

    Retorna el estado del servicio y la cantidad de sesiones activas.
    """
    return ChatHealthResponse(
        status="ok",
        service="chatbot",
        active_sessions=gemini_service.get_active_sessions_count(),
        timestamp=datetime.now().isoformat(),
    )
