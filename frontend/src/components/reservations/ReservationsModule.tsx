/**
 * ReservationsModule — Módulo de Reservas.
 * Integra calendario de disponibilidad, tablero de mesas en tiempo real,
 * formulario de reserva y listado del día. Cumple con accesibilidad
 * (aria-live) y responsividad.
 */

import { useEffect, useState } from "react";
import { TABLES, TIME_SLOTS } from "../../data/tables";
import { useReservations } from "../../hooks/useReservations";
import { todayISO } from "../../utils/format";
import type { CreateReservationInput } from "../../types/reservations";
import AvailabilityCalendar from "./AvailabilityCalendar";
import ReservationForm from "./ReservationForm";
import ReservationList from "./ReservationList";
import TableGrid from "./TableGrid";

export default function ReservationsModule() {
  const {
    selectedDate,
    setSelectedDate,
    getTableStatus,
    getDayAvailability,
    reservationsByDate,
    createReservation,
    cancelReservation,
  } = useReservations();

  const [selectedTime, setSelectedTime] = useState<string>(TIME_SLOTS[0]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  /** Limpia el anuncio accesible después de unos segundos. */
  useEffect(() => {
    if (!announcement) return;
    const t = setTimeout(() => setAnnouncement(""), 5000);
    return () => clearTimeout(t);
  }, [announcement]);

  const selectedTable = selectedTableId
    ? TABLES.find((t) => t.id === selectedTableId) ?? null
    : null;

  /** Marca los horarios ya pasados de hoy como no disponibles. */
  const isPastSlot = (time: string) => {
    if (selectedDate !== todayISO()) return false;
    const slot = new Date(`${selectedDate}T${time}:00`).getTime();
    const nowRef = new Date();
    return slot < nowRef.getTime();
  };

  const handleSubmit = (input: CreateReservationInput) => {
    const result = createReservation(input);
    if (result.ok) {
      setAnnouncement(
        `Reserva ${result.reservation!.code} confirmada: ${result.reservation!.customerName}, mesa ${result.reservation!.tableId} a las ${result.reservation!.time}.`
      );
      setSelectedTableId(null);
    }
    return result;
  };

  const handleCancel = (id: string) => {
    const res = reservationsByDate.find((r) => r.id === id);
    cancelReservation(id);
    if (res) {
      setAnnouncement(`Reserva ${res.code} a nombre de ${res.customerName} cancelada.`);
    }
  };

  // Semilla para el "contador" de disponibilidad por hora (aria-live resumen)
  const availableCount = TABLES.filter(
    (t) => getTableStatus(t.id, selectedDate, selectedTime) === "disponible"
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">📋 Módulo de Reservas</h2>
        <p className="text-sm text-slate-500 mt-1">
          Consulta la disponibilidad de mesas en tiempo real, selecciona una fecha y confirma tu reserva.
        </p>
      </header>

      {/* Región accesible de anuncios */}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Calendario de disponibilidad */}
          <AvailabilityCalendar
            selectedDate={selectedDate}
            onSelectDate={(d) => {
              setSelectedDate(d);
              setSelectedTableId(null);
            }}
            getDayAvailability={getDayAvailability}
          />

          {/* Franjas horarias */}
          <section aria-labelledby="time-slots-title" className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-4">
            <h3 id="time-slots-title" className="font-semibold text-slate-800 text-sm mb-3">
              Horario de reserva
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {TIME_SLOTS.map((time) => {
                const past = isPastSlot(time);
                const selected = time === selectedTime && !past;
                return (
                  <button
                    key={time}
                    type="button"
                    disabled={past}
                    onClick={() => {
                      setSelectedTime(time);
                      setSelectedTableId(null);
                    }}
                    aria-pressed={selected}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 ${
                      past
                        ? "opacity-35 cursor-not-allowed text-slate-400"
                        : selected
                          ? "bg-sky-600 text-white shadow-md shadow-sky-500/25"
                          : "bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-700"
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Tablero de mesas en tiempo real */}
          <TableGrid
            date={selectedDate}
            time={selectedTime}
            selectedTableId={selectedTableId}
            onSelectTable={setSelectedTableId}
            getTableStatus={getTableStatus}
          />

          {/* Reservas del día */}
          <section aria-labelledby="reserved-title">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 id="reserved-title" className="font-semibold text-slate-800 text-sm">
                Reservas del día ({availableCount}/{TABLES.length} mesas abiertas ahora)
              </h3>
            </div>
            <ReservationList reservations={reservationsByDate} onCancel={handleCancel} />
          </section>
        </div>

        {/* Formulario */}
        <aside className="lg:sticky lg:top-24">
          <ReservationForm
            key={`${selectedDate}-${selectedTime}-${selectedTableId ?? "none"}`}
            date={selectedDate}
            time={selectedTime}
            table={selectedTable}
            onSubmit={handleSubmit}
            onClearSelection={() => setSelectedTableId(null)}
          />
          <p className="mt-3 text-[11px] text-slate-400 text-center">
            Los horarios reservados se bloquean en tiempo real y se guardan en este dispositivo.
          </p>
        </aside>
      </div>

      {/* El contador de mesas abiertas se muestra en el encabezado de reservas del día */}
    </div>
  );
}