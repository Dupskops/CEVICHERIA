/**
 * TableGrid — Tablero de mesas con su estado "en tiempo real".
 * Permite seleccionar una mesa disponible para la reserva.
 * Incluye una región aria-live que anuncia la disponibilidad actual.
 */

import { TABLES } from "../../data/tables";
import type { TableInfo, TableStatus } from "../../types/reservations";
import { formatDateShort, timeTo12h } from "../../utils/format";

interface TableGridProps {
  date: string;
  time: string;
  selectedTableId: string | null;
  onSelectTable: (tableId: string | null) => void;
  getTableStatus: (tableId: string, dateISO: string, time: string) => TableStatus;
}

const STATUS_META: Record<TableStatus, { label: string; card: string; badge: string }> = {
  disponible: {
    label: "Disponible",
    card: "bg-white border-emerald-200 hover:border-emerald-400 hover:shadow-md cursor-pointer",
    badge: "bg-emerald-100 text-emerald-700",
  },
  reservada: {
    label: "Reservada",
    card: "bg-rose-50 border-rose-200 cursor-not-allowed",
    badge: "bg-rose-100 text-rose-700",
  },
  ocupada: {
    label: "Ocupada",
    card: "bg-slate-100 border-slate-200 cursor-not-allowed",
    badge: "bg-slate-200 text-slate-600",
  },
};

function TableCard({
  table,
  status,
  selected,
  onToggle,
}: {
  table: TableInfo;
  status: TableStatus;
  selected: boolean;
  onToggle: () => void;
}) {
  const meta = STATUS_META[status];
  const disabled = status !== "disponible";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      aria-pressed={selected}
      aria-label={`Mesa ${table.number}: ${meta.label}, capacidad para ${table.capacity} personas en ${table.area}`}
      className={`group relative rounded-xl border p-3 text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 ${
        meta.card
      } ${selected ? "ring-2 ring-sky-500 shadow-lg shadow-sky-500/20" : ""} ${
        disabled ? "opacity-80" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-500">Mesa</span>
        <span className="text-sm font-extrabold text-slate-700">{table.number}</span>
      </div>

      {/* Dibujo de mesa */}
      <div
        className={`w-full h-9 rounded-lg border-2 flex items-center justify-center mx-auto mb-2 ${
          selected
            ? "border-sky-500 bg-sky-50"
            : disabled
              ? "border-slate-300 bg-slate-200/60"
              : "border-emerald-300 bg-emerald-50"
        }`}
        aria-hidden="true"
      >
        <span className="text-xs">🪑 × {table.capacity}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${meta.badge}`}>
          {meta.label}
        </span>
        <span className="text-[10px] text-slate-400">{table.area}</span>
      </div>
    </button>
  );
}

export default function TableGrid({
  date,
  time,
  selectedTableId,
  onSelectTable,
  getTableStatus,
}: TableGridProps) {
  const statuses = TABLES.map((t) => ({ table: t, status: getTableStatus(t.id, date, time) }));
  const availableCount = statuses.filter((s) => s.status === "disponible").length;

  return (
    <section aria-label="Disponibilidad de mesas en tiempo real">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="font-semibold text-slate-800 text-sm">
          Disponibilidad en tiempo real
        </h3>
        <p className="text-xs text-slate-500">
          {formatDateShort(date)} · {timeTo12h(time)}
        </p>
      </div>

      {/* Anuncio de disponibilidad (aria-live) */}
      <p
        aria-live="polite"
        className="mb-3 px-3 py-2 rounded-xl bg-sky-50 border border-sky-100 text-xs text-sky-800"
      >
        {availableCount} de {TABLES.length} mesas disponibles
        {selectedTableId
          ? ` · mesa seleccionada: ${selectedTableId}`
          : ": selecciona una mesa disponible para continuar"}
      </p>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-3 mb-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-400" aria-hidden="true" />
          Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-400" aria-hidden="true" />
          Reservada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-slate-400" aria-hidden="true" />
          Ocupada
        </span>
      </div>

      {/* Tablero de mesas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
        {statuses.map(({ table, status }) => (
          <TableCard
            key={table.id}
            table={table}
            status={status}
            selected={selectedTableId === table.id}
            onToggle={() =>
              onSelectTable(selectedTableId === table.id ? null : table.id)
            }
          />
        ))}
      </div>
    </section>
  );
}