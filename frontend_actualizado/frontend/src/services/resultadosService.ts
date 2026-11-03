/**
 * services/resultadosService.ts
 * Peticiones de la Zona de Verificación Pública (no requieren sesión).
 */
import { apiRequest, apiRequestBlob } from '../api/apiClient';
import { ENDPOINTS } from '../api/apiEndpoints';
import type { TableroPublicoResponse } from '../types/evaluacion';

export const resultadosService = {
  obtenerTablero: () => apiRequest<TableroPublicoResponse>(ENDPOINTS.RESULTADOS.TABLERO_PUBLICO),

  /** Paquete cifrado de una obra ya revelada; se descifra en el worker con la llave del tablero. */
  obtenerImagenCifrada: (idPintura: string) =>
    apiRequestBlob(ENDPOINTS.RESULTADOS.IMAGEN_CIFRADA(idPintura)),
};