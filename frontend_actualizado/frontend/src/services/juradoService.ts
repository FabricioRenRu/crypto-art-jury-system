/**
 * services/juradoService.ts
 * Peticiones relacionadas con el jurado: llaves públicas para los sobres y
 * descarga de la obra cifrada con el sobre de cada juez.
 */
import { apiRequest } from '../api/apiClient';
import { ENDPOINTS } from '../api/apiEndpoints';
import type {
  LlavesPublicasJuradoResponse,
  MisPinturasJuezResponse,
  PinturaCifradaJuezResponse,
} from '../types/jurado';

export const juradoService = {
  /** Llaves públicas RSA de los jueces; con ellas el worker envuelve K_AES. */
  obtenerLlavesPublicas: () =>
    apiRequest<LlavesPublicasJuradoResponse>(ENDPOINTS.JURADO.LLAVES_PUBLICAS),

  /** Obras que tienen un sobre para el juez en sesión. */
  listarMisPinturas: () =>
    apiRequest<MisPinturasJuezResponse>(ENDPOINTS.JURADO.MIS_PINTURAS),

  /** Obra cifrada y sobre del juez en sesión; se abren en el worker (ABRIR_SOBRE). */
  descargarPintura: (idPintura: string) =>
    apiRequest<PinturaCifradaJuezResponse>(ENDPOINTS.PINTURAS.DESCARGAR(idPintura)),
};
