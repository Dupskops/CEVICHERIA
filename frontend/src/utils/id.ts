/**
 * Generadores de IDs y códigos únicos legibles.
 */

/** Genera un ID único con prefijo legible. */
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

/** Genera un código correlativo (p. ej. "RST-0001"). */
export function generateCode(prefix: string, number: number): string {
  return `${prefix}-${String(number).padStart(4, "0")}`;
}