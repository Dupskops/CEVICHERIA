/**
 * ChatMessage — Burbuja de mensaje individual.
 * Diferencia visualmente mensajes del usuario y del asistente.
 */

import type { ChatMessage as ChatMessageType } from "../../types/chatbot";

interface ChatMessageProps {
  message: ChatMessageType;
}

/** Formatea el timestamp a hora legible */
function formatTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/** Convierte **texto** en negritas y saltos de línea */
function formatContent(content: string): string {
  return content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br />");
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3 animate-fade-in`}
    >
      {/* Avatar del asistente */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center text-sm mr-2 mt-1 shrink-0 shadow-md">
          🐟
        </div>
      )}

      <div className={`max-w-[80%] ${isUser ? "order-1" : ""}`}>
        {/* Burbuja del mensaje */}
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
            isUser
              ? "bg-gradient-to-r from-sky-600 to-cyan-500 text-white rounded-br-md"
              : "bg-white/80 backdrop-blur-sm text-slate-700 rounded-bl-md border border-slate-100"
          }`}
          dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
        />

        {/* Hora */}
        <p
          className={`text-[10px] mt-1 text-slate-400 ${
            isUser ? "text-right mr-1" : "ml-1"
          }`}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
