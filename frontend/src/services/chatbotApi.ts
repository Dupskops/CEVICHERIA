/**
 * Servicio API para comunicarse con el backend del chatbot.
 * Centraliza todas las llamadas HTTP al endpoint /api/chat.
 */

import type {
  ChatRequest,
  ChatResponse,
  ChatResetRequest,
  ChatResetResponse,
  ChatHealthResponse,
} from "../types/chatbot";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Helper para realizar peticiones HTTP al backend.
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.detail?.message ||
        errorData?.detail ||
        `Error ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Envía un mensaje al chatbot y recibe la respuesta.
 */
export async function sendMessage(
  request: ChatRequest
): Promise<ChatResponse> {
  return apiRequest<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Reinicia una sesión de chat.
 */
export async function resetSession(
  request: ChatResetRequest
): Promise<ChatResetResponse> {
  return apiRequest<ChatResetResponse>("/api/chat/reset", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Verifica el estado del servicio de chatbot.
 */
export async function checkHealth(): Promise<ChatHealthResponse> {
  return apiRequest<ChatHealthResponse>("/api/chat/health", {
    method: "GET",
  });
}
