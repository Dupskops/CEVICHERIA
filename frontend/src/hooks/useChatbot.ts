/**
 * Hook personalizado para gestionar el estado y la lógica del chatbot.
 * Encapsula mensajes, sesión, carga, errores y la comunicación con la API.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { ChatMessage, ChatState } from "../types/chatbot";
import { sendMessage, resetSession } from "../services/chatbotApi";

/** Genera un ID único para los mensajes */
function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/** Mensaje de bienvenida del asistente */
const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  content:
    "¡Hola! 👋 Soy el asistente virtual de la **Cevichería D'Peñas**. " +
    "Puedo ayudarte con información sobre nuestro menú, horarios, " +
    "disponibilidad de mesas y más. ¿En qué puedo ayudarte?",
  role: "assistant",
  timestamp: new Date().toISOString(),
};

export function useChatbot() {
  const [state, setState] = useState<ChatState>({
    messages: [WELCOME_MESSAGE],
    sessionId: null,
    isLoading: false,
    error: null,
    isOpen: false,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  /** Scroll automático al último mensaje */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages]);

  /** Alternar apertura/cierre del widget */
  const toggleChat = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: !prev.isOpen, error: null }));
  }, []);

  /** Enviar un mensaje al chatbot */
  const sendUserMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Agregar mensaje del usuario al historial
    const userMessage: ChatMessage = {
      id: generateId(),
      content: content.trim(),
      role: "user",
      timestamp: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      const response = await sendMessage({
        message: content.trim(),
        session_id: state.sessionId,
      });

      const assistantMessage: ChatMessage = {
        id: generateId(),
        content: response.response,
        role: "assistant",
        timestamp: response.timestamp,
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        sessionId: response.session_id,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al conectar con el asistente.",
      }));
    }
  }, [state.sessionId]);

  /** Reiniciar la conversación */
  const resetChat = useCallback(async () => {
    if (state.sessionId) {
      try {
        await resetSession({ session_id: state.sessionId });
      } catch {
        // Ignorar errores al reiniciar: podemos empezar una nueva sesión igualmente
      }
    }

    setState({
      messages: [WELCOME_MESSAGE],
      sessionId: null,
      isLoading: false,
      error: null,
      isOpen: true,
    });
  }, [state.sessionId]);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    isOpen: state.isOpen,
    toggleChat,
    sendUserMessage,
    resetChat,
    messagesEndRef,
  };
}
