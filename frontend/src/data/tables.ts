/**
 * Configuración de mesas y horarios de la Cevichería D'Peñas.
 * 15 mesas: 6 de 2 personas, 6 de 4 personas y 3 de 6 personas.
 */

import type { TableInfo } from "../types/reservations";

const CAPACITIES = [2, 2, 2, 2, 2, 2, 4, 4, 4, 4, 4, 4, 6, 6, 6];
const AREAS = [
  "Terraza",
  "Terraza",
  "Terraza",
  "Sala principal",
  "Sala principal",
  "Sala principal",
  "Ventanal",
  "Ventanal",
  "Ventanal",
  "Sala principal",
  "Sala principal",
  "Terraza",
  "Ventanal",
  "Ventanal",
  "Sala principal",
];

/** Listado de mesas del restaurante. */
export const TABLES: TableInfo[] = CAPACITIES.map((capacity, i) => ({
  id: `M-${String(i + 1).padStart(2, "0")}`,
  number: i + 1,
  capacity,
  area: AREAS[i],
}));

/** Capacidad total de comensales del local. */
export const TOTAL_GUESTS_CAPACITY = TABLES.reduce(
  (sum, t) => sum + t.capacity,
  0
);

/** Total de mesas del restaurante. */
export const TOTAL_TABLES = TABLES.length;

/**
 * Horarios de atención: lunes a sábado 11:00–21:00; domingos 11:00–17:00.
 * Horarios de reserva en franjas de 30 minutos.
 */
export const TIME_SLOTS: readonly string[] = (() => {
  const slots: string[] = [];
  for (let h = 11; h < 21; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
})();