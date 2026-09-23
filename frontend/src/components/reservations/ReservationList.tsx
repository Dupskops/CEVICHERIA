/**
 * ReservationList — Listado de reservas del día seleccionado.
 * Permite cancelar reservas con confirmación y retroalimentación.
 */

import { TABLES } from "../../data/tables";
import type { Reservation } from "../../types/reservations";
import { timeTo12h } from "../../utils/format";

interface ReservationListProps {
  reservations: Reservation[];
  onCancel: (id: string) => void;
}

export default function ReservationList({
  reservations,
  onCancel,
}: ReservationListProps) {
  if (reservations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-center text-sm text-slate-500">
        No hay reservas registradas para esta fecha.
      </div>
    );
  }

  return (
    <ul className="space-y-2.5">
      {reservations.map((r) => {
        const table = TABLES.find((t) => t.id === r.tableId);
        return (
          <li
            key={r.id}
            className="rounded-xl bg-white/70 backdrop-blur-sm border border-slate-200/60 shadow-sm p-3.5"
          >
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {r.customerName}
                </p>
                <p className="text-[11px] text-slate-500">
                  {timeTo12h(r.time)} · {r.guests} {r.guests === 1 ? "persona" : "personas"} · Mesa {table?.number}
                  {table ? ` (${table.area})` : ""}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {r.phone}
                  {r.notes ? ` · ${r.notes}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
                  {r.code}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        `¿Cancelar la reserva ${r.code} a nombre de ${r.customerName}?`
                      )
                    ) {
                      onCancel(r.id);
                    }
                  }}
                  className="text-[11px] text-rose-600 hover:text-rose-800 underline"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}