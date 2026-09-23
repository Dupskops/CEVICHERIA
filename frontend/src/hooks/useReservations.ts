/**
 * Hook personalizado del módulo de Reservas.
 * Gestiona el calendario, la disponibilidad "en tiempo real" de las mesas
 * (simulado con ocupación determinista por fecha/hora) y el CRUD de reservas,
 * con persistencia en localStorage.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { TABLES, TOTAL_TABLES } from "../data/tables";
import type {
  CreateReservationInput,
  CreateReservationResult,
  DayAvailability,
  Reservation,
  ReservationStatus,
  TableStatus,
} from "../types/reservations";
import { todayISO } from "../utils/format";
import { generateCode, generateId } from "../utils/id";

const STORAGE_KEY = "cevicheria.reservations.v1";

/** Hora de referencia para medir la ocupación diaria en el calendario. */
const CALENDAR_REFERENCE_TIME = "20:00";

/** Genera un hash determinista a partir de un string. */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Simula mesas ocupadas por clientes presentes (sin reserva) de forma
 * determinista por fecha + hora + mesa. Representa la afluencia en tiempo real
 * hasta que el backend provea disponibilidad real.
 */
function isSimulatedOccupied(dateISO: string, time: string, tableId: string): boolean {
  const n = hashString(`${dateISO}|${time}|${tableId}`);
  return n % 3 === 0;
}

/** Lee las reservas persistidas en localStorage. */
function loadReservations(): Reservation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Reservation[]) : [];
  } catch {
    return [];
  }
}

export function useReservations() {
  const [reservations, setReservations] = useState<Reservation[]>(loadReservations);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);

  /** Persiste las reservas en cada cambio. */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
  }, [reservations]);

  /** Estado en tiempo real de una mesa para una fecha y hora. */
  const getTableStatus = useCallback(
    (tableId: string, dateISO: string, time: string): TableStatus => {
      const booked = reservations.some(
        (r) =>
          r.date === dateISO &&
          r.time === time &&
          r.tableId === tableId &&
          r.status === "confirmada"
      );
      if (booked) return "reservada";
      if (isSimulatedOccupied(dateISO, time, tableId)) return "ocupada";
      return "disponible";
    },
    [reservations]
  );

  /** Cantidad de mesas disponibles para una fecha y hora. */
  const getAvailableCount = useCallback(
    (dateISO: string, time: string): number =>
      TABLES.filter((t) => getTableStatus(t.id, dateISO, time) === "disponible")
        .length,
    [getTableStatus]
  );

  /** Cantidad de mesas disponibles que admiten un número de comensales. */
  const getAvailableForGuests = useCallback(
    (dateISO: string, time: string, guests: number): number =>
      TABLES.filter(
        (t) => t.capacity >= guests && getTableStatus(t.id, dateISO, time) === "disponible"
      ).length,
    [getTableStatus]
  );

  /** Disponibilidad agregada de un día (para el calendario mensual). */
  const getDayAvailability = useCallback(
    (dateISO: string): DayAvailability => {
      const available = getAvailableCount(dateISO, CALENDAR_REFERENCE_TIME);
      return { available, total: TOTAL_TABLES };
    },
    [getAvailableCount]
  );

  /** Reservas activas de una fecha ordenadas por hora. */
  const getReservationsByDate = useCallback(
    (dateISO: string): Reservation[] =>
      reservations
        .filter((r) => r.date === dateISO && r.status === "confirmada")
        .sort((a, b) => a.time.localeCompare(b.time)),
    [reservations]
  );

  /** Reservas activas de la fecha seleccionada. */
  const reservationsByDate = useMemo(
    () => getReservationsByDate(selectedDate),
    [getReservationsByDate, selectedDate]
  );

  /** Valida el formulario y crea la reserva. */
  const createReservation = useCallback(
    (input: CreateReservationInput): CreateReservationResult => {
      const table = TABLES.find((t) => t.id === input.tableId);
      if (!table) {
        return { ok: false, error: "Selecciona una mesa disponible." };
      }

      if (input.guests < 1 || input.guests > table.capacity) {
        return {
          ok: false,
          error: `La mesa elegida admite entre 1 y ${table.capacity} comensales.`,
        };
      }

      const start = new Date(`${input.date}T${input.time}:00`);
      if (start.getTime() < Date.now()) {
        return { ok: false, error: "No puedes reservar en una fecha u hora pasada." };
      }

      const status = getTableStatus(input.tableId, input.date, input.time);
      if (status !== "disponible") {
        return {
          ok: false,
          error:
            status === "reservada"
              ? "Esa mesa ya fue reservada para ese horario."
              : "Esa mesa está ocupada en ese horario. Elige otra mesa u otro horario.",
        };
      }

      const dailyNumber =
        reservations.filter((r) => r.date === input.date).length + 1;
      const reservation: Reservation = {
        id: generateId("res"),
        code: generateCode("RST", dailyNumber),
        customerName: input.customerName.trim(),
        phone: input.phone.trim(),
        date: input.date,
        time: input.time,
        guests: input.guests,
        tableId: input.tableId,
        status: "confirmada" as ReservationStatus,
        notes: input.notes?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      setReservations((prev) => [...prev, reservation]);
      return { ok: true, reservation };
    },
    [getTableStatus, reservations]
  );

  /** Cancela una reserva (se mantiene en el historial como cancelada). */
  const cancelReservation = useCallback((id: string) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "cancelada" as const } : r))
    );
  }, []);

  return {
    reservations,
    selectedDate,
    setSelectedDate,
    getTableStatus,
    getAvailableCount,
    getAvailableForGuests,
    getDayAvailability,
    getReservationsByDate,
    reservationsByDate,
    createReservation,
    cancelReservation,
  };
}