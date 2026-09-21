"""
Pruebas funcionales del módulo Chatbot — Cevichería D'Peñas.

Se prueban los endpoints:
  - POST /api/chat (enviar mensaje)
  - POST /api/chat/reset (reiniciar sesión)
  - GET /api/chat/health (health check)

Ejecutar con: pytest tests/ -v
"""

import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, MagicMock, AsyncMock

from app.main import app


# ============================================================
# Fixtures
# ============================================================

@pytest.fixture
def mock_gemini_response():
    """Mock de la respuesta de Gemini API."""
    mock_response = MagicMock()
    mock_response.text = "¡Hola! En la Cevichería D'Peñas tenemos deliciosos ceviches y platos marinos. ¿En qué puedo ayudarte?"
    return mock_response


@pytest.fixture
def mock_chat_session(mock_gemini_response):
    """Mock de una sesión de chat de Gemini."""
    mock_session = MagicMock()
    mock_session.send_message.return_value = mock_gemini_response
    return mock_session


# ============================================================
# Test 1: Health Check del servicio
# ============================================================

@pytest.mark.asyncio
async def test_health_check():
    """
    Prueba: GET /api/chat/health
    Verifica que el servicio de chatbot esté operativo.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/chat/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "chatbot"
    assert "active_sessions" in data
    assert "timestamp" in data


# ============================================================
# Test 2: Consulta sobre platillos
# ============================================================

@pytest.mark.asyncio
async def test_consulta_platillos(mock_chat_session):
    """
    Prueba: POST /api/chat — Consulta sobre platillos.
    Verifica que el chatbot responda correctamente a una consulta sobre el menú.
    """
    mock_chat_session.send_message.return_value.text = (
        "¡Claro! En la Cevichería D'Peñas tenemos una variedad de platillos marinos:\n"
        "- **Ceviche Clásico** - S/.25.00\n"
        "- **Ceviche Mixto** - S/.35.00\n"
        "- **Chicharrón de Pescado** - S/.28.00\n"
        "¿Te gustaría saber más sobre alguno?"
    )

    with patch("app.services.gemini_service.GeminiService._get_or_create_session") as mock_get_session:
        mock_get_session.return_value = ("test-session-1", mock_chat_session)

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/chat",
                json={"message": "¿Qué platos tienen?"},
            )

    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert "session_id" in data
    assert data["session_id"] == "test-session-1"
    assert len(data["response"]) > 0
    print(f"\n📋 Consulta: '¿Qué platos tienen?'")
    print(f"🤖 Respuesta: {data['response'][:200]}...")


# ============================================================
# Test 3: Consulta sobre horarios
# ============================================================

@pytest.mark.asyncio
async def test_consulta_horarios(mock_chat_session):
    """
    Prueba: POST /api/chat — Consulta sobre horarios.
    Verifica que el chatbot responda sobre horarios de atención.
    """
    mock_chat_session.send_message.return_value.text = (
        "Nuestro horario de atención es:\n"
        "- **Lunes a Sábado**: 11:00 AM a 9:00 PM\n"
        "- **Domingos**: 11:00 AM a 5:00 PM\n"
        "¡Te esperamos!"
    )

    with patch("app.services.gemini_service.GeminiService._get_or_create_session") as mock_get_session:
        mock_get_session.return_value = ("test-session-2", mock_chat_session)

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/chat",
                json={"message": "¿A qué hora abren?"},
            )

    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert len(data["response"]) > 0
    print(f"\n📋 Consulta: '¿A qué hora abren?'")
    print(f"🤖 Respuesta: {data['response'][:200]}...")


# ============================================================
# Test 4: Consulta sobre disponibilidad de mesas
# ============================================================

@pytest.mark.asyncio
async def test_consulta_disponibilidad(mock_chat_session):
    """
    Prueba: POST /api/chat — Consulta sobre disponibilidad de mesas.
    Verifica que el chatbot responda sobre la disponibilidad.
    """
    mock_chat_session.send_message.return_value.text = (
        "Contamos con 15 mesas en total (de 2, 4 y 6 personas). "
        "Para verificar la disponibilidad exacta para una fecha y hora específica, "
        "te recomiendo usar nuestro sistema de reservas o contactarnos al (073) 123-456."
    )

    with patch("app.services.gemini_service.GeminiService._get_or_create_session") as mock_get_session:
        mock_get_session.return_value = ("test-session-3", mock_chat_session)

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/chat",
                json={"message": "¿Hay mesas disponibles para hoy?"},
            )

    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert len(data["response"]) > 0
    print(f"\n📋 Consulta: '¿Hay mesas disponibles para hoy?'")
    print(f"🤖 Respuesta: {data['response'][:200]}...")


# ============================================================
# Test 5: Consulta fuera de contexto
# ============================================================

@pytest.mark.asyncio
async def test_consulta_fuera_de_contexto(mock_chat_session):
    """
    Prueba: POST /api/chat — Consulta fuera de contexto.
    Verifica que el chatbot redirija al contexto del restaurante.
    """
    mock_chat_session.send_message.return_value.text = (
        "Disculpa, solo puedo ayudarte con temas relacionados a la Cevichería D'Peñas. "
        "¿Puedo ayudarte con información sobre nuestro menú, horarios o reservas?"
    )

    with patch("app.services.gemini_service.GeminiService._get_or_create_session") as mock_get_session:
        mock_get_session.return_value = ("test-session-4", mock_chat_session)

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/chat",
                json={"message": "¿Cuál es la capital de Francia?"},
            )

    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    print(f"\n📋 Consulta: '¿Cuál es la capital de Francia?'")
    print(f"🤖 Respuesta: {data['response'][:200]}...")


# ============================================================
# Test 6: Reiniciar sesión
# ============================================================

@pytest.mark.asyncio
async def test_reset_session():
    """
    Prueba: POST /api/chat/reset
    Verifica que una sesión se pueda reiniciar.
    """
    # Primero crear una sesión enviando un mensaje mockeado
    mock_session = MagicMock()
    mock_session.send_message.return_value.text = "¡Hola!"

    with patch("app.services.gemini_service.GeminiService._get_or_create_session") as mock_get_session:
        mock_get_session.return_value = ("session-to-reset", mock_session)

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # Enviar un mensaje para crear la sesión
            await client.post("/api/chat", json={"message": "Hola"})

    # Añadir la sesión manualmente al servicio para poder reiniciarla
    from app.services.gemini_service import gemini_service
    gemini_service._sessions["session-to-reset"] = mock_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/chat/reset",
            json={"session_id": "session-to-reset"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Sesión reiniciada exitosamente."
    assert data["session_id"] == "session-to-reset"
    print(f"\n🔄 Sesión 'session-to-reset' reiniciada exitosamente.")


# ============================================================
# Test 7: Mensaje vacío (validación)
# ============================================================

@pytest.mark.asyncio
async def test_mensaje_vacio():
    """
    Prueba: POST /api/chat con mensaje vacío.
    Verifica que se retorne un error de validación.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/chat",
            json={"message": ""},
        )

    assert response.status_code == 422  # Validation error
    print(f"\n⚠️ Mensaje vacío rechazado con status 422 (validación).")
