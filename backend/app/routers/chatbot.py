"""
Router del módulo Chatbot.
Expone los endpoints para interactuar con el asistente IA de la Cevichería D'Peñas.
"""

from datetime import datetime

from fastapi import APIRouter, HTTPException

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


@router.post(
    "",
    response_model=ChatResponse,
    summary="Enviar mensaje al chatbot",
    description="Envía un mensaje del usuario al asistente IA y recibe la respuesta generada.",
)
async def send_message(request: ChatRequest):
    """
    Endpoint principal del chatbot.

    Recibe un mensaje del usuario, lo procesa con Google Gemini
    y retorna la respuesta del asistente.
    """
    result = await gemini_service.generate_response(
        message=request.message,
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
