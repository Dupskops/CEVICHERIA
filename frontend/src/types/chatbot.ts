/**
 * Tipos TypeScript para el módulo de Chatbot.
 */

/** Mensaje individual en el historial del chat */
export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: string;
}

/** Request para enviar un mensaje al chatbot */
export interface ChatRequest {
  message: string;
  session_id?: string | null;
}

/** Response del endpoint /api/chat */
export interface ChatResponse {
  response: string;
  session_id: string;
  timestamp: string;
}

/** Request para reiniciar la sesión */
export interface ChatResetRequest {
  session_id: string;
}

/** Response del endpoint /api/chat/reset */
export interface ChatResetResponse {
  message: string;
  session_id: string;
}

/** Response del health check */
export interface ChatHealthResponse {
  status: string;
  service: string;
  active_sessions: number;
  timestamp: string;
}

/** Estado del hook useChatbot */
export interface ChatState {
  messages: ChatMessage[];
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;
}
