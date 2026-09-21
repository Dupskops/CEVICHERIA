/**
 * App.tsx — Componente raíz de la aplicación.
 * Integra el widget de chatbot de la Cevichería D'Peñas.
 */

import ChatWidget from "./components/chatbot/ChatWidget";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-50">
      {/* ===== Página de demostración ===== */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-sky-100 text-sky-700 rounded-full text-sm font-medium mb-6">
            <span>🐟</span>
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
              desc: "Gestiona la disponibilidad de mesas en tiempo real.",
            },
            {
              icon: "🍽️",
              title: "Platillos",
              desc: "Catálogo completo de nuestra carta marina.",
            },
            {
              icon: "💰",
              title: "Ventas",
              desc: "Control y registro de ventas del día.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="group p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg hover:shadow-sky-500/5 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-100 to-cyan-100 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                {card.icon}
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">
                {card.title}
              </h3>
              <p className="text-sm text-slate-500">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Indicador del chatbot */}
        <div className="text-center">
          <p className="text-sm text-slate-400">
            💬 Haz clic en el botón de chat en la esquina inferior derecha para
            hablar con nuestro asistente IA
          </p>
        </div>
      </div>

      {/* ===== Widget del Chatbot ===== */}
      <ChatWidget />
    </div>
  );
}

export default App;
