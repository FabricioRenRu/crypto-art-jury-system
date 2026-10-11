/**
 * routes/paths.ts
 * Rutas (URLs) de la aplicación centralizadas en un solo lugar.
 * Así, si cambia una URL, solo se modifica aquí y no en cada componente.
 */
export const PATHS = {
  inicio: '/',
  registroPintor: '/registro-pintor',
  registroJurado: '/registro-jurado',
  panelPintor: '/panel-pintor',
  evaluacionJurado: '/evaluacion-jurado',
  vistoBuenoPresidente: '/visto-bueno-presidente',
  resultados: '/resultados',
} as const;
