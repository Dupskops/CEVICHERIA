/**
 * App.tsx — Componente raíz de la aplicación.
 * Integra los módulos de Reservas, Ventas y el widget del chatbot
 * de la Cevichería D'Peñas, con navegación accesible.
 */

import { useState, useEffect } from "react";
import ChatWidget from "./components/chatbot/ChatWidget";
import AppHeader, { type ModuleId } from "./components/layout/AppHeader";
import ReservationsModule from "./components/reservations/ReservationsModule";
import SalesModule from "./components/sales/SalesModule";

import LoginScreen from "./components/auth/LoginScreen";
import UsersModule from "./components/users/UsersModule";
import DishesModule from "./components/dishes/DishesModule";
import { getCurrentUser } from "./services/managementApi";
import type { AuthUser } from "./types/management";

function HomePage({ onNavigate }: { onNavigate: (module: ModuleId) => void }) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* Hero */}
      <header className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-sky-100 text-sky-700 rounded-full text-sm font-medium mb-6">
          <span aria-hidden="true">🐟</span>
          <span>Sistema de Gestión Administrativa</span>
        </div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-sky-700 via-cyan-600 to-teal-600 bg-clip-text text-transparent mb-4">
          Cevichería D'Peñas
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Plataforma de gestión para la cevichería más deliciosa de Talara, Piura.
          Gestiona reservas, platillos, ventas y mucho más.
        </p>
      </header>

      {/* Cards de módulos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {[
          {
            icon: "📋",
            title: "Reservas",
            desc: "Calendario y disponibilidad de mesas en tiempo real.",
            module: "reservas" as ModuleId,
          },
          {
            icon: "🐟",
            title: "Carta",
            desc: "Mantén actualizado el catálogo de platillos.",
            module: "platillos" as ModuleId,
          },
          {
            icon: "💰",
            title: "Ventas",
            desc: "Punto de venta y control de ingresos del día.",
            module: "ventas" as ModuleId,
          },
        ].map((card) => (
          <button
            key={card.title}
            type="button"
            onClick={() => onNavigate(card.module)}
            className="group p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg hover:shadow-sky-500/5 hover:-translate-y-1 transition-all duration-300 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-100 to-cyan-100 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              <span aria-hidden="true">{card.icon}</span>
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">{card.title}</h3>
            <p className="text-sm text-slate-500">{card.desc}</p>
          </button>
        ))}
      </div>

      {/* Indicador del chatbot */}
      <p className="text-center text-sm text-slate-400" aria-live="polite">
        💬 Haz clic en el botón de chat en la esquina inferior derecha para
        hablar con nuestro asistente IA
      </p>
    </div>
  );
}

function App() {
  const [module, setModule] = useState<ModuleId>("inicio");
  const [user, setUser] = useState<AuthUser | null>(null);
  
  useEffect(() => {
    const token = localStorage.getItem("cevicheria_token");
    if (token) {
      getCurrentUser()
        .then(setUser)
        .catch(() => localStorage.removeItem("cevicheria_token"));
    }
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem("cevicheria_token");
    setUser(null);
  };

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-50">
      <AppHeader active={module} onNavigate={setModule} user={user} onLogout={handleLogout} />

      <main id="main-content">
        {module === "inicio" && <HomePage onNavigate={setModule} />}
        {module === "reservas" && <ReservationsModule />}
        {module === "ventas" && <SalesModule />}
        {module === "usuarios" && user.role === "admin" && <UsersModule />}
        {module === "platillos" && <DishesModule />}
      </main>

      {/* Widget del chatbot */}
      <ChatWidget />
    </div>
  );
}

export default App;