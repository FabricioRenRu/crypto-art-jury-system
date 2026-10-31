/**
 * services/resultadosService.ts
 * Peticiones de la Zona de Verificación Pública (no requieren sesión).
 */
import { apiRequest } from '../api/apiClient';
import { ENDPOINTS } from '../api/apiEndpoints';
import type { TableroPublicoResponse } from '../types/evaluacion';

export const resultadosService = {
  obtenerTablero: () => apiRequest<TableroPublicoResponse>(ENDPOINTS.RESULTADOS.TABLERO_PUBLICO),
};