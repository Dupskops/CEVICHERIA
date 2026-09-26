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
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);

  // Cargar reservas desde el backend
  useEffect(() => {
    import("../services/managementApi").then(({ listReservations }) => {
      listReservations().then((data: any) => {
        const mapped: Reservation[] = data.map((r: any) => ({
          id: r.idReserva.toString(),
          code: `RST-${r.idReserva}`,
          customerName: r.nombre,
          phone: r.telefono || "",
          date: r.fecha,
          time: typeof r.hora === 'string' ? r.hora.slice(0, 5) : r.hora,
          guests: r.comensales || 2,
          tableId: (r.mesa_id === "t1" || !r.mesa_id) ? "M-01" : r.mesa_id,
          status: r.estado,
          notes: r.descripcion,
          createdAt: r.fecha
        }));
        setReservations(mapped);
      }).catch(console.error);
    });
  }, []);

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
    async (input: CreateReservationInput): Promise<CreateReservationResult> => {
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

      try {
        const { createReservation: apiCreateRes } = await import("../services/managementApi");
        const payload = {
          nombre: input.customerName.trim(),
          fecha: input.date,
          hora: input.time,
          descripcion: input.notes?.trim() || "",
          estado: "confirmada",
          Usuarios_idUsuario: 1, // Admin
          mesa_id: input.tableId,
          telefono: input.phone.trim(),
          comensales: input.guests
        };
        const saved = await apiCreateRes(payload);

        const reservation: Reservation = {
          id: saved.idReserva.toString(),
          code: `RST-${saved.idReserva}`,
          customerName: saved.nombre,
          phone: input.phone.trim(),
          date: saved.fecha,
          time: input.time,
          guests: input.guests,
          tableId: input.tableId,
          status: "confirmada" as ReservationStatus,
          notes: saved.descripcion,
          createdAt: new Date().toISOString(),
        };

        setReservations((prev) => [...prev, reservation]);
        return { ok: true, reservation };
      } catch (error) {
        console.error(error);
        return { ok: false, error: "Error al registrar la reserva en la Base de Datos." };
      }
    },
    [getTableStatus]
  );

  /** Cancela una reserva (se mantiene en el historial como cancelada). */
  const cancelReservation = useCallback(async (id: string) => {
    try {
      const { deleteReservation } = await import("../services/managementApi");
      await deleteReservation(id);
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "cancelada" as const } : r))
      );
    } catch (error) {
      console.error(error);
      alert("No se pudo cancelar la reserva en la Base de Datos.");
    }
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