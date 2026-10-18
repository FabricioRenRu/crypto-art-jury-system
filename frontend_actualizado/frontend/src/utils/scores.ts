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
