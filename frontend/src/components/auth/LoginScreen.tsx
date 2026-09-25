import { FormEvent, useState } from "react";
import type { AuthUser } from "../../types/management";
import { login } from "../../services/managementApi";

export default function LoginScreen({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState(""); 
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState("");
  
  const submit = async (event: FormEvent) => { 
    event.preventDefault(); 
    setLoading(true); 
    setError(""); 
    try { 
      const result = await login(email, password); 
      localStorage.setItem("cevicheria_token", result.access_token); 
      onLogin(result.user); 
    } catch (cause) { 
      setError(cause instanceof Error ? cause.message : "No se pudo iniciar sesión."); 
    } finally { 
      setLoading(false); 
    } 
  };
  
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <section className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-sky-600 text-white rounded-xl flex items-center justify-center text-xl font-bold mx-auto mb-4">CP</div>
          <p className="text-xs font-semibold text-slate-400 tracking-wider mb-2">D'PEÑAS · PANEL ADMINISTRATIVO</p>
          <h2 className="text-2xl font-bold text-slate-800">Bienvenido de vuelta</h2>
          <p className="text-sm text-slate-500 mt-2">Ingresa con tus credenciales para continuar.</p>
        </div>
        
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
            <input 
              type="email" 
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="nombre@dpenas.pe" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input 
              type="password" 
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••" 
              required 
            />
          </div>
          
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
          
          <button 
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Validando..." : "Ingresar"}
          </button>
        </form>
        <p className="text-center text-xs text-slate-400 mt-8">Acceso protegido · Cevichería D'Peñas</p>
      </section>
    </main>
  );
}
