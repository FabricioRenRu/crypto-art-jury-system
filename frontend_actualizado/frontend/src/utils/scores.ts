/**
 * utils/scores.ts
 * Calculos de calificaciones del podio.
 */

/**
 * Promedio de las calificaciones de los jurados, redondeado a 1 decimal.
 * Ejemplo: [8.8, 8.9, 8.7] -> 8.8
 */
export function averageScore(scores: number[]): number {
  if (scores.length === 0) {
    return 0;
  }
  const suma = scores.reduce((acumulado, valor) => acumulado + valor, 0);
  return Math.round((suma / scores.length) * 10) / 10;
}

/** Máximo de estrellas que da cada juez. */
export const MAX_ESTRELLAS_POR_JUEZ = 3;

/** Suma de estrellas de todos los jueces (criterio del ranking). Ej: [2, 1, 2] -> 5 */
export function totalStars(scores: number[]): number {
  return scores.reduce((acumulado, valor) => acumulado + valor, 0);
}

/** Máximo posible para esa obra. Ej: 3 jueces -> 9 */
export function maxStars(scores: number[]): number {
  return scores.length * MAX_ESTRELLAS_POR_JUEZ;
}
