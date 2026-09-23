/**
 * Utilidades de formato (moneda, fechas y horas) — Cevichería D'Peñas.
 */

/** Formatea un número como soles peruanos. */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(value);
}

/** Fecha local en formato ISO (YYYY-MM-DD). */
export function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Formatea una fecha ISO a una etiqueta legible (p. ej. "mié 3 ago"). */
export function formatDateShort(dateISO: string): string {
  try {
    const [y, m, d] = dateISO.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("es-PE", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateISO;
  }
}

/** Formatea una fecha completa (p. ej. "Lunes, 3 de agosto"). */
export function formatDateLong(dateISO: string): string {
  try {
    const [y, m, d] = dateISO.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("es-PE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateISO;
  }
}

/** Convierte "HH:mm" a formato de 12 horas (p. ej. "8:30 p. m."). */
export function timeTo12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h)) return time;
  const period = h >= 12 ? "p. m." : "a. m.";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

/** Formatea un timestamp ISO legible. */
export function formatDateTime(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleString("es-PE", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}