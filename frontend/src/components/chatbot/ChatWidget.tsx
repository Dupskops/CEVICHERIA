/**
 * ChatWidget — Widget flotante completo del chatbot.
 * Integra todos los subcomponentes: Header, Messages, Input.
 * Se muestra como un botón FAB que expande un panel de chat.
 */

import { useChatbot } from "../../hooks/useChatbot";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";

export default function ChatWidget() {
  const {
    messages,
    isLoading,
    error,
    isOpen,
    toggleChat,
    sendUserMessage,
    resetChat,
    messagesEndRef,
  } = useChatbot();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* ===== Panel de Chat ===== */}
      {isOpen && (
        <div
          className="w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-6rem)] flex flex-col rounded-2xl shadow-2xl shadow-sky-500/10 border border-slate-200/60 bg-gradient-to-b from-slate-50 to-white overflow-hidden animate-slide-up"
          role="dialog"
          aria-label="Chat con el asistente de la Cevichería D'Peñas"
        >
          {/* Header */}
          <ChatHeader onClose={toggleChat} onReset={resetChat} />

          {/* Mensajes */}
          <div
            className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scroll-smooth"
            aria-live="polite"
            aria-label="Historial de mensajes"
          >
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {/* Indicador de "escribiendo..." */}
            {isLoading && (
              <div className="flex items-center gap-2 mb-3 animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center text-sm shrink-0 shadow-md">
                  🐟
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl rounded-bl-md px-4 py-3 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            {/* Mensaje de error */}
            {error && (
              <div className="mx-2 mb-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs animate-fade-in">
                ⚠️ {error}
              </div>
            )}

            {/* Referencia para auto-scroll */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <ChatInput onSend={sendUserMessage} isLoading={isLoading} />
        </div>
      )}

      {/* ===== Botón FAB ===== */}
      <button
        onClick={toggleChat}
        className={`group w-14 h-14 rounded-full shadow-xl shadow-sky-500/25 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-sky-500/30 active:scale-95 ${
          isOpen
            ? "bg-slate-600 rotate-0"
            : "bg-gradient-to-r from-sky-600 to-cyan-500"
        }`}
        title={isOpen ? "Cerrar chat" : "Abrir chat con el asistente"}
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat con el asistente"}
        id="chatbot-toggle-button"
      >
        {isOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 text-white group-hover:scale-110 transition-transform"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
            <path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z" />
          </svg>
        )}
      </button>
    </div>
  );
}
