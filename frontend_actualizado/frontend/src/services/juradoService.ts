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
  LlavePublicaResponse
} from '../types/jurado';
import type {
  BlindEvaluationCreate,
  BlindEvaluationResponse,
  FirmasMasivasRequest,
  FirmasMasivasResponse,
  HashPendiente,
  MisEvaluacionesResponse,
  PublicarEvaluacionRequest,
  PublicarEvaluacionResponse
  
} from '../types/evaluacion'

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

  /*Lo usa el juez para obtener la llave publica del presidente, sirve para la firma ciega */
  obtenerLlavePresidente: () => 
    apiRequest<LlavePublicaResponse>(ENDPOINTS.PRESIDENTE.LLAVE_PUBLICA),

  /* Lo usa el juez para subir el hash/evaluacion cegada */
  enviarEvaluacionCegada: (data: BlindEvaluationCreate) =>
    apiRequest<BlindEvaluationResponse>(
      ENDPOINTS.EVALUACIONES.SUBIR_EVALUACION_CEGADA,
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    ),
  
  /* Lo usa el presidente para obtener todos los hashes cegados que faltan por firmar */
  obtenerHashesPendientes: () => 
    apiRequest<HashPendiente[]>(ENDPOINTS.PRESIDENTE.LISTAR_VOTOS_PENDIENTES),


  enviarFirmasMasivas: (data: FirmasMasivasRequest) => 
    apiRequest<FirmasMasivasResponse>(
      ENDPOINTS.PRESIDENTE.SUBIR_FIRMAS_CIEGAS,
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    ),

    /* evaluaciones del juez en sesión; las FIRMADO traen s' y su evaluación cifrada. */
  misEvaluaciones: () =>
    apiRequest<MisEvaluacionesResponse>(ENDPOINTS.EVALUACIONES.MIS_EVALUACIONES),

  /**  publica la evaluación en claro con la firma descegada y la firma PSS del juez. */
  publicarEvaluacion: (data: PublicarEvaluacionRequest) =>
    apiRequest<PublicarEvaluacionResponse>(ENDPOINTS.EVALUACIONES.PUBLICAR, {
      method: 'POST',
      body: JSON.stringify(data),
    }),


};
