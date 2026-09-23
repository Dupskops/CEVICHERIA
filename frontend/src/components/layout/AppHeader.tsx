/**
 * AppHeader — Navegación principal entre módulos del sistema.
 * Responsivo y accesible (aria-current en el módulo activo).
 */

export type ModuleId = "inicio" | "reservas" | "ventas";

interface AppHeaderProps {
  active: ModuleId;
  onNavigate: (module: ModuleId) => void;
}

const NAV_ITEMS: { id: ModuleId; label: string; icon: string }[] = [
  { id: "inicio", label: "Inicio", icon: "🏠" },
  { id: "reservas", label: "Reservas", icon: "📋" },
  { id: "ventas", label: "Ventas", icon: "💰" },
];

export default function AppHeader({ active, onNavigate }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        {/* Marca */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-cyan-500 flex items-center justify-center text-lg shadow-md shadow-sky-500/20 shrink-0">
            🐟
          </div>
          <div className="leading-tight">
            <p className="font-bold text-slate-800 text-sm sm:text-base">
              Cevichería D'Peñas
            </p>
            <p className="text-[11px] text-slate-500 -mt-0.5 hidden sm:block">
              Sistema de Gestión · Talara, Piura
            </p>
          </div>
        </div>

        {/* Navegación */}
        <nav
          className="flex items-center gap-1 bg-slate-100/80 rounded-xl p-1"
          aria-label="Navegación principal"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? "page" : undefined}
                aria-pressed={isActive}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-white text-sky-700 shadow-sm ring-1 ring-slate-200/80"
                    : "text-slate-600 hover:bg-white/70 hover:text-slate-800"
                }`}
              >
                <span aria-hidden="true" className="mr-1.5">
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}