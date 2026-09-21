"""
Schemas Pydantic para el módulo de Chatbot.
Definen la estructura de request/response de los endpoints del chat.
"""

from datetime import datetime
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Esquema de la solicitud de chat enviada por el usuario."""

    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Mensaje del usuario para el chatbot.",
        examples=["¿Qué platos tienen?"],
    )
    session_id: str | None = Field(
        default=None,
        description="ID de sesión para mantener el contexto de la conversación. "
        "Si es None, se crea una nueva sesión.",
    )


class ChatResponse(BaseModel):
    """Esquema de la respuesta del chatbot."""

    response: str = Field(
        ...,
        description="Respuesta generada por el asistente.",
    )
    session_id: str = Field(
        ...,
        description="ID de la sesión de conversación.",
    )
    timestamp: str = Field(
        ...,
        description="Marca de tiempo de la respuesta (ISO 8601).",
    )


class ChatResetRequest(BaseModel):
    """Esquema para reiniciar una sesión de chat."""

    session_id: str = Field(
        ...,
        description="ID de la sesión a reiniciar.",
    )


class ChatResetResponse(BaseModel):
    """Esquema de respuesta al reiniciar una sesión."""

    message: str = Field(
        ...,
        description="Mensaje de confirmación.",
    )
    session_id: str = Field(
        ...,
        description="ID de la sesión reiniciada.",
    )


class ChatHealthResponse(BaseModel):
    """Esquema de respuesta del health check del chatbot."""

    status: str = Field(
        ...,
        description="Estado del servicio: 'ok' o 'error'.",
    )
    service: str = Field(
        default="chatbot",
        description="Nombre del servicio.",
    )
    active_sessions: int = Field(
        ...,
        description="Número de sesiones de chat activas.",
    )
    timestamp: str = Field(
        ...,
        description="Marca de tiempo del health check.",
    )
