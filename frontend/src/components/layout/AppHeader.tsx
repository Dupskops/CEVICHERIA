/**
 * AppHeader — Navegación principal entre módulos del sistema.
 * Responsivo y accesible (aria-current en el módulo activo).
 */
import type { AuthUser } from "../../types/management";

export type ModuleId = "inicio" | "reservas" | "ventas" | "usuarios" | "platillos";

interface AppHeaderProps {
  active: ModuleId;
  onNavigate: (module: ModuleId) => void;
  user: AuthUser | null;
  onLogout: () => void;
}

export default function AppHeader({ active, onNavigate, user, onLogout }: AppHeaderProps) {
  const NAV_ITEMS = [
    { id: "inicio" as ModuleId, label: "Inicio", icon: "🏠" },
    { id: "reservas" as ModuleId, label: "Reservas", icon: "📋" },
    { id: "ventas" as ModuleId, label: "Ventas", icon: "💰" },
    { id: "platillos" as ModuleId, label: "Platillos", icon: "🐟" },
    ...(user?.role === "admin" ? [{ id: "usuarios" as ModuleId, label: "Usuarios", icon: "👥" }] : []),
  ];

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

        {/* Navegación y Usuario */}
        <div className="flex items-center gap-4">
          <nav
            className="flex items-center gap-1 bg-slate-100/80 rounded-xl p-1 overflow-x-auto"
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
          
          {user && (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-slate-700 leading-tight">{user.name.split(" ")[0]}</p>
                <p className="text-xs text-slate-500">{user.role === 'admin' ? 'Administrador' : 'Empleado'}</p>
              </div>
              <button 
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}