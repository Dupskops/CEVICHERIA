import { useEffect, useState, useMemo, FormEvent } from "react";
import type { UserRecord, UserPayload, UserRole } from "../../types/management";
import { listUsers, createUser, updateUser, deleteUser } from "../../services/managementApi";

const blankUser: UserPayload = { name: "", email: "", password: "", role: "employee", phone: "", active: true };

function UserModal({ initial, onClose, onSave }: { initial: UserRecord | null; onClose: () => void; onSave: (payload: UserPayload) => Promise<void> }) { 
  const [form, setForm] = useState<UserPayload>(initial ? { name: initial.name, email: initial.email, role: initial.role, phone: initial.phone || "", active: initial.active } : { ...blankUser }); 
  const [saving, setSaving] = useState(false); 
  
  const submit = async (event: FormEvent) => { 
    event.preventDefault(); 
    setSaving(true); 
    try { 
      await onSave(form); 
    } finally { 
      setSaving(false); 
    } 
  }; 
  
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <p className="text-xs font-bold text-sky-600 tracking-wider">GESTIÓN</p>
            <h3 className="text-xl font-bold text-slate-800">{initial ? "Editar usuario" : "Nuevo usuario"}</h3>
          </div>
          <button className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors" onClick={onClose} aria-label="Cerrar">
             ✕
          </button>
        </div>
        
        <form className="p-6 space-y-4" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
            <input required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
            <input required type="email" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          {!initial && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <input required type="password" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
              <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500" value={form.role} onChange={e => setForm({ ...form, role: e.target.value as UserRole })}>
                <option value="employee">Empleado</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
              <input className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> 
              Usuario activo
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
            <button type="button" className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors" onClick={onClose}>Cancelar</button>
            <button className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50" disabled={saving}>
              {saving ? "Guardando..." : "Guardar usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  ); 
}

export default function UsersModule() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<UserRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    listUsers()
      .then(setUsers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = useMemo(() => 
    users.filter(item => `${item.name} ${item.email}`.toLowerCase().includes(query.toLowerCase())), 
    [users, query]
  );

  const handleSave = async (payload: UserPayload) => {
    const next = editing ? await updateUser(editing.id, payload) : await createUser(payload);
    setUsers(items => editing ? items.map(item => item.id === next.id ? next : item) : [next, ...items]);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: number | string) => {
    if (!window.confirm("¿Confirmas que deseas eliminar este registro?")) return;
    try {
      await deleteUser(id);
      setUsers(items => items.filter(item => item.id !== id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo eliminar el registro.");
    }
  };

  const openModal = (item?: UserRecord) => {
    setEditing(item || null);
    setIsModalOpen(true);
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Cargando usuarios...</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <p className="text-xs font-bold text-sky-600 tracking-wider">ADMINISTRACIÓN</p>
          <h2 className="text-3xl font-bold text-slate-800">Usuarios</h2>
          <p className="text-slate-500">Gestiona los perfiles y permisos de tu equipo.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <input 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            placeholder="Buscar usuario..." 
            className="flex-1 md:w-64 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
          />
          <button 
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors shrink-0" 
            onClick={() => openModal()}
          >
            + Nuevo usuario
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-500">
              <th className="px-6 py-4">USUARIO</th>
              <th className="px-6 py-4">ROL</th>
              <th className="px-6 py-4">CONTACTO</th>
              <th className="px-6 py-4">ESTADO</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map(item => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-100 to-cyan-100 flex items-center justify-center text-sky-700 font-bold">
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{item.name}</div>
                      <div className="text-sm text-slate-500">{item.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                    {item.role === "admin" ? "Administrador" : "Empleado"}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{item.phone || "—"}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${item.active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${item.active ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    {item.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" onClick={() => openModal(item)}>✏️</button>
                    <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" onClick={() => handleDelete(item.id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="p-12 text-center text-slate-500">No hay usuarios para mostrar.</div>
        )}
      </div>

      {isModalOpen && <UserModal initial={editing} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
    </div>
  );
}
