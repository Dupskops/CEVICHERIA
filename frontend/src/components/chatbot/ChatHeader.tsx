/**
 * ChatHeader — Cabecera del panel de chat.
 * Muestra el nombre del asistente, estado y botones de control.
 */

interface ChatHeaderProps {
  onClose: () => void;
  onReset: () => void;
}

export default function ChatHeader({ onClose, onReset }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-sky-600 to-cyan-500 rounded-t-2xl">
      {/* Avatar e info */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl">
            🐟
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-sky-600" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-sm leading-tight">
            Asistente D'Peñas
          </h2>
          <p className="text-sky-100 text-xs">En línea</p>
        </div>
      </div>

      {/* Botones de control */}
      <div className="flex items-center gap-1">
        {/* Reiniciar conversación */}
        <button
          onClick={onReset}
          className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title="Reiniciar conversación"
          aria-label="Reiniciar conversación"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>

        {/* Cerrar panel */}
        <button
          onClick={onClose}
          className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title="Cerrar chat"
          aria-label="Cerrar chat"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
