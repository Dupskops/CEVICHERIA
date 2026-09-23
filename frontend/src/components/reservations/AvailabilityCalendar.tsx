/**
 * AvailabilityCalendar — Calendario mensual con disponibilidad agregada por día.
 * Cada día indica cuántas mesas están disponibles a la hora de mayor demanda (20:00).
 */

import { useState } from "react";
import type { DayAvailability } from "../../types/reservations";
import { formatDateLong, todayISO } from "../../utils/format";

interface AvailabilityCalendarProps {
  selectedDate: string;
  onSelectDate: (dateISO: string) => void;
  getDayAvailability: (dateISO: string) => DayAvailability;
}

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/** Color del día según disponibilidad de mesas. */
function dayBadgeColor(available: number, total: number): string {
  const ratio = available / total;
  if (ratio >= 0.5) return "bg-emerald-100 text-emerald-700";
  if (ratio >= 0.25) return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function AvailabilityCalendar({
  selectedDate,
  onSelectDate,
  getDayAvailability,
}: AvailabilityCalendarProps) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const today = todayISO();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // Mes de lunes a domingo
  const leadingBlanks = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("es-PE", {
    month: "long",
    year: "numeric",
  });

  const moveMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const jumpToToday = () => {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    onSelectDate(today);
  };

  const handleSelect = (day: number) => {
    const dateISO = toISO(viewYear, viewMonth + 1, day);
    if (dateISO >= today) onSelectDate(dateISO);
  };

  const cells: (number | null)[] = [
    ...Array.from<null>({ length: leadingBlanks }).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <section
      className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-4"
      aria-label="Calendario de disponibilidad de mesas"
    >
      {/* Cabecera del mes */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800 capitalize text-sm">
          {monthLabel}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Mes anterior"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={jumpToToday}
            className="px-2.5 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Mes siguiente"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Grid semanal */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-[11px] font-medium text-slate-400 py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} aria-hidden="true" />;
          }
          const dateISO = toISO(viewYear, viewMonth + 1, day);
          const isPast = dateISO < today;
          const isSelected = dateISO === selectedDate;
          const { available, total } = getDayAvailability(dateISO);
          const ratio = available / total;

          return (
            <button
              key={dateISO}
              type="button"
              disabled={isPast}
              onClick={() => handleSelect(day)}
              aria-pressed={isSelected}
              aria-label={`${formatDateLong(dateISO)}. ${available} de ${total} mesas disponibles a las 8 p. m.${isPast ? " (fecha pasada)" : ""}`}
              className={`relative flex flex-col items-center justify-center rounded-xl py-1.5 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 ${
                isPast
                  ? "opacity-35 cursor-not-allowed"
                  : isSelected
                    ? "bg-sky-600 text-white shadow-md shadow-sky-500/25"
                    : dayBadgeColor(available, total)
              }`}
            >
              <span className="text-sm font-semibold leading-none">{day}</span>
              {!isPast && (
                <span
                  className={`mt-1 text-[9px] font-medium px-1 rounded-full leading-none py-0.5 ${
                    isSelected ? "bg-white/20 text-white" : ratio >= 0.5 ? "bg-emerald-200/70" : ratio >= 0.25 ? "bg-amber-200/70" : "bg-rose-200/70"
                  }`}
                >
                  {available}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-slate-400 flex items-center gap-1.5">
        <span aria-hidden="true">💡</span>
        Cada día muestra las mesas libres a las 8 p. m. (hora de mayor demanda).
      </p>
    </section>
  );
}