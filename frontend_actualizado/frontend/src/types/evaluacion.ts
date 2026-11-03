/**
 * types/evaluacion.ts
 * Tipos de la evaluación con firma ciega. Deben coincidir con evaluacion_schemas.py y resultados_schemas.py.
 */

// ---- Paso 3: el juez sube su voto cegado ----
export interface BlindEvaluationCreate {
  id_pintura: string;
  hash_cegado: string;        // h' en decimal
  evaluacion_cifrada: string; // su evaluación cifrada para sí mismo (base64)
}

export interface BlindEvaluationResponse {
  id: string;
}

// ---- Pasos 4-6: bandeja y firmas del presidente ----
export interface HashPendiente {
  id_evaluacion: string;
  hash_cegado: string;
}

export interface FirmaCiegaCreate {
  id_evaluacion: string;
  firma_ciega_presi: string; // s' en decimal
}

export interface FirmasMasivasRequest {
  firmas: FirmaCiegaCreate[];
}

export interface FirmasMasivasResponse {
  status: string;
  message: string;
}

// ---- Paso 7: evaluaciones del juez ----
export type EstadoEvaluacion = 'ESPERANDO_FIRMA' | 'FIRMADO' | 'PUBLICADO';

export interface MiEvaluacion {
  id_evaluacion: string;
  id_pintura: string;
  estado: EstadoEvaluacion;
  firma_ciega_presi: string | null;
  evaluacion_cifrada: string | null;
}

export interface MisEvaluacionesResponse {
  evaluaciones: MiEvaluacion[];
}

// ---- Paso 9: publicación ----
export interface PublicarEvaluacionRequest {
  id_pintura: string;
  estrellas: number;
  comentario: string;
  firma_descegada: string; // s en decimal
  firma_juez: string;      // RSA-PSS en base64
  llave_aes: string;       // K_AES de la obra (revelación), base64
}

export interface PublicarEvaluacionResponse {
  id_evaluacion: string;
  estado: EstadoEvaluacion;
}

// ---- Paso 10: tablero público ----
export interface EvaluacionPublica {
  id_evaluacion: string;
  id_juez: string;
  juez: string;
  clave_publica_juez: string;
  estrellas: number;
  comentario: string;
  texto_canonico: string;
  hash_original: string;
  firma_descegada: string;
  firma_juez: string;
}

export interface ObraPublica {
  id_pintura: string;
  codigo_anonimo: string;
  titulo: string;
  seudonimo: string;
  total_estrellas: number;
  posicion: number;
  evaluaciones: EvaluacionPublica[];
  tipo_mime: string;
  llave_aes: string | null; // K_AES revelada: con ella cualquiera descifra la obra
}

export interface TableroPublicoResponse {
  llave_publica_presidente: string;
  obras: ObraPublica[];
}

/** Resultado de VERIFICAR_EVALUACION_PUBLICA en el worker. */
export interface ResultadoVerificacion {
  texto_coincide: boolean;
  hash_recalculado: string;
  firma_presidente_valida: boolean;
  firma_juez_valida: boolean;
}