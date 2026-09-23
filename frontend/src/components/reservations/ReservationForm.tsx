/**
 * ReservationForm — Formulario de reserva de mesa.
 * Muestra fecha, hora y mesa seleccionadas; valida los datos con
 * retroalimentación accesible (aria-describedby y aria-live).
 */

import { useState, type FormEvent } from "react";
import { TABLES } from "../../data/tables";
import type {
  CreateReservationInput,
  CreateReservationResult,
  TableInfo,
} from "../../types/reservations";
import { formatDateLong, timeTo12h } from "../../utils/format";

interface ReservationFormProps {
  date: string;
  time: string;
  table: TableInfo | null;
  onSubmit: (input: CreateReservationInput) => CreateReservationResult;
  onClearSelection: () => void;
}

const PHONE_PATTERN = /^[0-9+\-() ]{6,16}$/;

export default function ReservationForm({
  date,
  time,
  table,
  onSubmit,
  onClearSelection,
}: ReservationFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState(1);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; phone?: string; guests?: string }>({});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const nextErrors: typeof fieldErrors = {};
    if (!table) nextErrors.name = ""; // no aplica
    if (name.trim().length < 2) nextErrors.name = "Ingresa el nombre del cliente.";
    if (!PHONE_PATTERN.test(phone.trim())) {
      nextErrors.phone = "Ingresa un teléfono válido (mínimo 6 dígitos).";
    }
    setFieldErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean) || !table) {
      if (!table) setError("Selecciona una mesa disponible en el tablero.");
      return;
    }

    const result = onSubmit({
      customerName: name,
      phone,
      date,
      time,
      guests,
      tableId: table.id,
      notes: notes || undefined,
    });

    if (result.ok) {
      setName("");
      setPhone("");
      setNotes("");
      setGuests(1);
    } else {
      setError(result.error ?? "No se pudo registrar la reserva.");
    }
  };

  const buscaMesa = (guestsToFit: number) =>
    TABLES.filter((t) => t.capacity >= guestsToFit).length;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-5"
      aria-label="Formulario de nueva reserva"
    >
      <h3 className="font-semibold text-slate-800 text-sm mb-4">
        Nueva reserva
      </h3>

      {/* Resumen de selección */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="col-span-2 sm:col-span-1 rounded-xl bg-sky-50 border border-sky-100 px-3 py-2">
          <span className="text-[10px] uppercase tracking-wide text-sky-500 font-semibold block">
            Fecha
          </span>
          <span className="text-sm font-medium text-slate-700 capitalize">
            {formatDateLong(date)}
          </span>
        </div>
        <div className="rounded-xl bg-sky-50 border border-sky-100 px-3 py-2">
          <span className="text-[10px] uppercase tracking-wide text-sky-500 font-semibold block">
            Hora
          </span>
          <span className="text-sm font-medium text-slate-700">{timeTo12h(time)}</span>
        </div>
      </div>

      {/* Mesa seleccionada */}
      {table ? (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span aria-hidden="true">🪑</span>
            <div>
              <p className="text-sm font-semibold text-emerald-800">
                Mesa {table.number} · {table.area}
              </p>
              <p className="text-[11px] text-emerald-700">
                Capacidad para {table.capacity} personas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClearSelection}
            className="text-[11px] text-emerald-700 underline hover:text-emerald-900"
          >
            Cambiar
          </button>
        </div>
      ) : (
        <div className="mb-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
          Selecciona una mesa disponible en el tablero para continuar.
        </div>
      )}

      <div className="space-y-3">
        {/* Nombre */}
        <div>
          <label htmlFor="res-name" className="block text-xs font-medium text-slate-600 mb-1">
            Nombre del cliente *
          </label>
          <input
            id="res-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="P. ej. María Fernández"
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "res-name-error" : undefined}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400"
          />
          {fieldErrors.name && (
            <p id="res-name-error" className="mt-1 text-xs text-rose-600">
              {fieldErrors.name}
            </p>
          )}
        </div>

        {/* Teléfono */}
        <div>
          <label htmlFor="res-phone" className="block text-xs font-medium text-slate-600 mb-1">
            Teléfono de contacto *
          </label>
          <input
            id="res-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="P. ej. 987 654 321"
            aria-invalid={Boolean(fieldErrors.phone)}
            aria-describedby={fieldErrors.phone ? "res-phone-error" : undefined}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400"
          />
          {fieldErrors.phone && (
            <p id="res-phone-error" className="mt-1 text-xs text-rose-600">
              {fieldErrors.phone}
            </p>
          )}
        </div>

        {/* Comensales */}
        <div>
          <label htmlFor="res-guests" className="block text-xs font-medium text-slate-600 mb-1">
            Nº de comensales
          </label>
          <div className="flex items-center gap-2">
            <input
              id="res-guests"
              type="number"
              min={1}
              max={table?.capacity ?? 6}
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value) || 1)}
              className="w-24 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400"
            />
            <span className="text-[11px] text-slate-400">
              Hay {buscaMesa(guests)} mesas que admiten {guests}{" "}
              {guests === 1 ? "comensal" : "comensales"}.
            </span>
          </div>
          {fieldErrors.guests && (
            <p id="res-guests-error" className="mt-1 text-xs text-rose-600">
              {fieldErrors.guests}
            </p>
          )}
        </div>

        {/* Notas */}
        <div>
          <label htmlFor="res-notes" className="block text-xs font-medium text-slate-600 mb-1">
            Notas (opcional)
          </label>
          <textarea
            id="res-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="P. ej. celebración de cumpleaños, solicitud de ventana..."
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400"
          />
        </div>
      </div>

      {/* Errores del servidor / conflicto de disponibilidad */}
      <div aria-live="polite">
        {error && (
          <p role="alert" className="mt-3 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            ⚠️ {error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={!table}
        className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:hover:scale-100 transition-all"
      >
        Confirmar reserva
      </button>
    </form>
  );
}