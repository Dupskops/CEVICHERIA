import { useEffect, useState, useMemo, FormEvent } from "react";
import type { DishRecord, DishPayload } from "../../types/management";
import { listDishes, createDish, updateDish, deleteDish } from "../../services/managementApi";

const blankDish: DishPayload = { name: "", description: "", price: 0, category: "Ceviches", image_url: "", available: true };

function DishModal({ initial, onClose, onSave }: { initial: DishRecord | null; onClose: () => void; onSave: (payload: DishPayload) => Promise<void> }) { 
  const [form, setForm] = useState<DishPayload>(initial ? { name: initial.name, description: initial.description, price: initial.price, category: initial.category, image_url: initial.image_url || "", available: initial.available } : { ...blankDish }); 
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
            <h3 className="text-xl font-bold text-slate-800">{initial ? "Editar platillo" : "Nuevo platillo"}</h3>
          </div>
          <button className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <form className="p-6 space-y-4" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del platillo</label>
            <input required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
              <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option>Ceviches</option>
                <option>Mariscos</option>
                <option>Arroces</option>
                <option>Bebidas</option>
                <option>Entradas</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Precio (S/)</label>
              <input required min="0" step="0.01" type="number" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <textarea rows={3} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">URL de imagen</label>
            <input type="url" placeholder="https://..." className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} />
          </div>
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" checked={form.available} onChange={e => setForm({ ...form, available: e.target.checked })} /> 
              Disponible en carta
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
            <button type="button" className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors" onClick={onClose}>Cancelar</button>
            <button className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50" disabled={saving}>
              {saving ? "Guardando..." : "Guardar platillo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  ); 
}

export default function DishesModule() {
  const [dishes, setDishes] = useState<DishRecord[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<DishRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    listDishes()
      .then(setDishes)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredDishes = useMemo(() => 
    dishes.filter(item => `${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase())), 
    [dishes, query]
  );

  const handleSave = async (payload: DishPayload) => {
    const next = editing ? await updateDish(editing.id, payload) : await createDish(payload);
    setDishes(items => editing ? items.map(item => item.id === next.id ? next : item) : [next, ...items]);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: number | string) => {
    if (!window.confirm("¿Confirmas que deseas eliminar este platillo?")) return;
    try {
      await deleteDish(id);
      setDishes(items => items.filter(item => item.id !== id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo eliminar el platillo.");
    }
  };

  const openModal = (item?: DishRecord) => {
    setEditing(item || null);
    setIsModalOpen(true);
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Cargando catálogo...</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <p className="text-xs font-bold text-sky-600 tracking-wider">ADMINISTRACIÓN</p>
          <h2 className="text-3xl font-bold text-slate-800">Platillos</h2>
          <p className="text-slate-500">Cuida cada detalle de la carta de D'Peñas.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <input 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            placeholder="Buscar platillo..." 
            className="flex-1 md:w-64 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
          />
          <button 
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors shrink-0" 
            onClick={() => openModal()}
          >
            + Nuevo platillo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDishes.map(item => (
          <article key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group flex flex-col hover:shadow-md transition-shadow">
            <div className="h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center text-5xl">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <span className="opacity-50">🐟</span>
              )}
              <div className="absolute top-3 right-3">
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm ${item.available ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                  {item.available ? 'Disponible' : 'Agotado'}
                </span>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <span className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">{item.category}</span>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{item.name}</h3>
              <p className="text-sm text-slate-500 flex-1">{item.description || "Sin descripción."}</p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <strong className="text-xl font-bold text-slate-800">S/ {Number(item.price).toFixed(2)}</strong>
                <div className="flex gap-2">
                  <button className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" onClick={() => openModal(item)}>✏️</button>
                  <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" onClick={() => handleDelete(item.id)}>🗑️</button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
      
      {filteredDishes.length === 0 && (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">No hay platillos para mostrar.</div>
      )}

      {isModalOpen && <DishModal initial={editing} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
    </div>
  );
}
