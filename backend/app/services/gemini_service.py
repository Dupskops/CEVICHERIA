"""
Servicio de integración con Google Gemini API.
Gestiona la comunicación con el modelo de IA, el system prompt
y el historial de conversación por sesión.
"""

import uuid
from datetime import datetime

import google.generativeai as genai

from app.config import get_settings

settings = get_settings()

# Configurar la API de Gemini con la clave
genai.configure(api_key=settings.GEMINI_API_KEY)

# ============================================================
# System Prompt — Rol del Asistente D'Peñas
# ============================================================
SYSTEM_PROMPT = """
Eres el **Asistente Virtual de la Cevichería D'Peñas**, un restaurante especializado 
en comida marina ubicado en Talara, Piura, Perú.

## Tu personalidad
- Eres amable, cálido y profesional.
- Usas un tono cercano pero respetuoso.
- Respondes en español.
- Eres entusiasta al hablar de los platillos de la cevichería.

## Información del restaurante
- **Nombre**: Cevichería D'Peñas
- **Ubicación**: Talara, Piura, Perú
- **Horario de atención**: Lunes a Sábado de 11:00 AM a 9:00 PM. Domingos de 11:00 AM a 5:00 PM.
- **Teléfono de contacto**: (073) 123-456
- **Capacidad**: 15 mesas disponibles (de 2, 4 y 6 personas)

## Menú de platillos
| Platillo | Descripción | Precio (S/.) |
|---|---|---|
| Ceviche Clásico | Pescado fresco marinado en limón con cebolla, ají y cilantro | 25.00 |
| Ceviche Mixto | Mezcla de pescado, conchas, camarones y pulpo | 35.00 |
| Chicharrón de Pescado | Trozos de pescado empanizados y fritos, acompañados de yuca | 28.00 |
| Arroz con Mariscos | Arroz guisado con camarones, conchas, pulpo y calamar | 32.00 |
| Jalea Mixta | Fritura de pescado y mariscos con yuca y salsa criolla | 38.00 |
| Leche de Tigre | Clásico jugo de ceviche con trozos de pescado | 15.00 |
| Sudado de Pescado | Pescado cocido al vapor con tomate, cebolla y ají amarillo | 30.00 |
| Parihuela | Sopa concentrada de mariscos y pescado | 35.00 |
| Tiradito de Pescado | Láminas de pescado con salsa de ají amarillo | 28.00 |
| Chupe de Camarones | Sopa espesa de camarones con queso, leche y huevo | 33.00 |

## Tus capacidades
1. **Información del menú**: Puedes describir platillos, recomendar platos y dar precios.
2. **Horarios de atención**: Informar horarios de apertura y cierre.
3. **Disponibilidad de mesas**: Informar sobre la disponibilidad general de mesas.
4. **Estado de reservas**: Orientar sobre cómo consultar el estado de una reserva.
5. **Información general**: Ubicación, teléfono de contacto, servicios del restaurante.

## Restricciones
- **NO** procesas pagos ni aceptas pedidos directamente.
- **NO** proporcionas información que no esté relacionada con el restaurante.
- Si te preguntan algo fuera de tu contexto, responde amablemente que solo puedes 
  ayudar con temas relacionados a la Cevichería D'Peñas.
- **NO** inventas información que no esté en tus datos.
- Si no sabes algo específico (como la disponibilidad exacta en un día), sugiere 
  contactar al restaurante directamente o usar el sistema de reservas.
"""


class GeminiService:
    """
    Servicio que gestiona la interacción con la API de Google Gemini.
    Mantiene un historial de conversación por sesión.
    """

    def __init__(self):
        """Inicializa el servicio con el modelo de Gemini configurado."""
        self.model = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            system_instruction=SYSTEM_PROMPT,
            safety_settings={
                genai.types.HarmCategory.HARM_CATEGORY_HATE_SPEECH: genai.types.HarmBlockThreshold.BLOCK_NONE,
                genai.types.HarmCategory.HARM_CATEGORY_HARASSMENT: genai.types.HarmBlockThreshold.BLOCK_NONE,
                genai.types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: genai.types.HarmBlockThreshold.BLOCK_NONE,
                genai.types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: genai.types.HarmBlockThreshold.BLOCK_NONE,
            }
        )
        # Almacén de sesiones de chat activas: {session_id: ChatSession}
        self._sessions: dict[str, genai.ChatSession] = {}

    def _get_or_create_session(self, session_id: str | None = None) -> tuple[str, genai.ChatSession]:
        """
        Obtiene una sesión existente o crea una nueva.

        Args:
            session_id: ID de sesión existente, o None para crear una nueva.

        Returns:
            Tupla (session_id, chat_session).
        """
        if session_id and session_id in self._sessions:
            return session_id, self._sessions[session_id]

        # Crear nueva sesión
        new_id = session_id or str(uuid.uuid4())
        chat = self.model.start_chat(history=[])
        self._sessions[new_id] = chat
        return new_id, chat

    async def generate_response(self, message: str, session_id: str | None = None) -> dict:
        """
        Genera una respuesta del chatbot a partir del mensaje del usuario.

        Args:
            message: Mensaje enviado por el usuario.
            session_id: ID de la sesión de conversación (opcional).

        Returns:
            Diccionario con la respuesta, session_id y timestamp.
        """
        sid, chat = self._get_or_create_session(session_id)

        try:
            response = await chat.send_message_async(message)
            return {
                "response": response.text,
                "session_id": sid,
                "timestamp": datetime.now().isoformat(),
            }
        except Exception as e:
            error_str = str(e)
            print(f"Gemini API Error: {error_str}")
            
            # Detectar límite de cuota (Rate Limit) de la capa gratuita
            if "429" in error_str or "exceeded your current quota" in error_str.lower():
                user_msg = (
                    "¡Uy! Has hecho muchas consultas muy rápido y mi servicio gratuito "
                    "necesita un respiro. 🛑 Por favor, espera 30 segundos e intenta de nuevo."
                )
            else:
                user_msg = (
                    "Lo siento, en este momento no puedo procesar tu consulta. "
                    "Por favor intenta de nuevo en unos momentos o contacta "
                    "directamente al restaurante al (073) 123-456."
                )

            return {
                "response": user_msg,
                "session_id": sid,
                "timestamp": datetime.now().isoformat(),
                "error": error_str,
            }

    def reset_session(self, session_id: str) -> bool:
        """
        Elimina una sesión de chat para reiniciar la conversación.

        Args:
            session_id: ID de la sesión a reiniciar.

        Returns:
            True si la sesión existía y fue eliminada, False si no existía.
        """
        if session_id in self._sessions:
            del self._sessions[session_id]
            return True
        return False

    def get_active_sessions_count(self) -> int:
        """Retorna la cantidad de sesiones activas."""
        return len(self._sessions)

    async def generate_emoji_for_dish(self, dish_name: str) -> str:
        """
        Usa Gemini para determinar un emoji adecuado para el nombre de un platillo.
        """
        prompt = f"Eres un clasificador de platillos. Devuelve ÚNICAMENTE un (1) emoji que represente mejor este platillo: '{dish_name}'. No escribas texto adicional, solo el emoji."
        try:
            response = await self.model.generate_content_async(prompt)
            emoji = response.text.strip()
            if len(emoji) > 0 and len(emoji) <= 10:
                return emoji
            return "🍲"
        except Exception as e:
            return "🍲"


# Instancia singleton del servicio
gemini_service = GeminiService()
