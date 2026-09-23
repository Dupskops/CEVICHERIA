/**
 * SalesDashboard — Control de ventas.
 * Indicadores del día, mercado por modalidad de atención e historial
 * con búsqueda y eliminación. Accesible (caption en tablas, aria-live).
 */

import { useMemo, useState } from "react";
import { PAYMENT_LABELS, SALE_TYPE_LABELS } from "../../data/menu";
import type { Sale, SaleStats, SaleType } from "../../types/sales";
import { formatCurrency, formatDateTime, todayISO } from "../../utils/format";

interface SalesDashboardProps {
  sales: Sale[];
  stats: SaleStats;
  onDelete: (id: string) => void;
}

const SALE_TYPES: SaleType[] = ["dine-in", "takeaway", "delivery"];

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-100 to-cyan-100 flex items-center justify-center text-xl shrink-0">
          <span aria-hidden="true">{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <p className="text-lg font-bold text-slate-800 truncate">{value}</p>
          {hint && <p className="text-[11px] text-slate-400 truncate">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

export default function SalesDashboard({ sales, stats, onDelete }: SalesDashboardProps) {
  const today = todayISO();
  const [search, setSearch] = useState("");

  const todayCountByType = useMemo(() => {
    const counts: Record<SaleType, number> = { "dine-in": 0, takeaway: 0, delivery: 0 };
    const revenue: Record<SaleType, number> = { "dine-in": 0, takeaway: 0, delivery: 0 };
    sales
      .filter((s) => s.saleDate.slice(0, 10) === today)
      .forEach((s) => {
        counts[s.orderType] += 1;
        revenue[s.orderType] += s.total;
      });
    return { counts, revenue, total: sales.filter((s) => s.saleDate.slice(0, 10) === today).length };
  }, [sales, today]);

  const filteredSales = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sales;
    return sales.filter(
      (s) =>
        s.code.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q)
    );
  }, [sales, search]);

  const maxType = Math.max(1, ...SALE_TYPES.map((t) => todayCountByType.counts[t]));

  const handleDelete = (sale: Sale) => {
    if (window.confirm(`¿Eliminar la venta ${sale.code} por ${formatCurrency(sale.total)}?`)) {
      onDelete(sale.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Indicadores */}
      <section aria-label="Indicadores del día" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          icon="💰"
          label="Ingresos de hoy"
          value={formatCurrency(stats.todayRevenue)}
        />
        <StatCard
          icon="🧾"
          label="Ventas de hoy"
          value={String(stats.todayCount)}
          hint={`${stats.totalSales} ventas registradas en total`}
        />
        <StatCard
          icon="🎟️"
          label="Ticket promedio"
          value={formatCurrency(stats.avgTicket)}
        />
        <StatCard
          icon="🏆"
          label="Plato más vendido"
          value={stats.bestSeller ? stats.bestSeller.name : "—"}
          hint={
            stats.bestSeller
              ? `${stats.bestSeller.quantity} unidades vendidas`
              : "Aún sin ventas"
          }
        />
      </section>

      {/* Distribución por modalidad */}
      <section
        className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-4"
        aria-label="Ventas por modalidad de atención"
      >
        <h3 className="font-semibold text-slate-800 text-sm mb-3">
          Ventas de hoy por modalidad
        </h3>
        <div className="space-y-2.5">
          {SALE_TYPES.map((t) => {
            const count = todayCountByType.counts[t];
            const revenue = todayCountByType.revenue[t];
            if (todayCountByType.total === 0) {
              return (
                <div key={t} className="flex items-center gap-3">
                  <span className="w-24 text-xs text-slate-500 shrink-0">
                    {SALE_TYPE_LABELS[t]}
                  </span>
                  <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full w-0 bg-sky-400 rounded-full" />
                  </div>
                  <span className="w-20 text-right text-[11px] text-slate-400 shrink-0">—</span>
                </div>
              );
            }
            return (
              <div key={t} className="flex items-center gap-3">
                <span className="w-24 text-xs text-slate-500 shrink-0">
                  {SALE_TYPE_LABELS[t]}
                </span>
                <div
                  className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={count}
                  aria-valuemin={0}
                  aria-valuemax={todayCountByType.total}
                  aria-label={`${SALE_TYPE_LABELS[t]}: ${count} ventas`}
                >
                  <div
                    className="h-full bg-sky-400 rounded-full transition-all"
                    style={{ width: `${(count / maxType) * 100}%` }}
                  />
                </div>
                <span className="w-24 text-right text-[11px] text-slate-500 shrink-0">
                  {count} · {formatCurrency(revenue)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Historial */}
      <section aria-labelledby="sales-history-title">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 flex-wrap">
          <h3 id="sales-history-title" className="font-semibold text-slate-800 text-sm">
            Historial de ventas
          </h3>
          <div className="relative">
            <label htmlFor="sales-search" className="sr-only">
              Buscar venta por código o cliente
            </label>
            <input
              id="sales-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código o cliente..."
              className="w-full sm:w-64 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400"
            />
          </div>
        </div>

        {filteredSales.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center text-sm text-slate-500">
            {sales.length === 0
              ? "Aún no hay ventas registradas. Registra tu primera venta en el punto de venta."
              : "No se encontraron ventas con ese criterio."}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-sm">
            <table className="w-full text-sm">
              <caption className="sr-only">Historial de ventas registradas</caption>
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-200/70">
                  <th className="px-4 py-3 font-semibold">Código</th>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Modalidad</th>
                  <th className="px-4 py-3 font-semibold text-right">Ítems</th>
                  <th className="px-4 py-3 font-semibold text-right">Total</th>
                  <th className="px-4 py-3 font-semibold">Pago</th>
                  <th className="px-4 py-3 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="border-b border-slate-100 last:border-0 hover:bg-sky-50/40">
                    <td className="px-4 py-3 font-semibold text-sky-700 whitespace-nowrap">
                      {sale.code}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {formatDateTime(sale.saleDate)}
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-[160px] truncate">
                      {sale.customerName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] whitespace-nowrap">
                        {SALE_TYPE_LABELS[sale.orderType]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 whitespace-nowrap">
                      {sale.items.reduce((sum, i) => sum + i.quantity, 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800 whitespace-nowrap">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {PAYMENT_LABELS[sale.paymentMethod]}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDelete(sale)}
                        className="text-xs text-rose-500 hover:text-rose-700 underline"
                        aria-label={`Eliminar venta ${sale.code}`}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}