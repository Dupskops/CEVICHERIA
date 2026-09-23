/**
 * Tipos TypeScript para el módulo de Reservas.
 */

/** Mesa física del restaurante. */
export interface TableInfo {
  id: string;
  number: number;
  capacity: number;
  area: string;
}

/** Estado en tiempo real de una mesa en un horario concreto. */
export type TableStatus = "disponible" | "reservada" | "ocupada";

/** Estado de una reserva. */
export type ReservationStatus = "confirmada" | "cancelada";

/** Reserva registrada en el sistema. */
export interface Reservation {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  tableId: string;
  status: ReservationStatus;
  notes?: string;
  createdAt: string;
}

/** Datos necesarios para crear una reserva. */
export interface CreateReservationInput {
  customerName: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  tableId: string;
  notes?: string;
}

/** Resultado de la creación de una reserva. */
export interface CreateReservationResult {
  ok: boolean;
  error?: string;
  reservation?: Reservation;
}

/** Disponibilidad agregada de un día. */
export interface DayAvailability {
  available: number;
  total: number;
}