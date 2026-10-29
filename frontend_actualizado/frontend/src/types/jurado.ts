/**
 * types/jurado.ts
 * Tipos del jurado. Deben coincidir con los schemas del backend (jurado_schemas.py).
 */

/** Llave pública RSA de un juez (PEM). La privada nunca sale de su archivo .pem. */
export interface LlavePublicaJuez {
  id: string;
  nombre: string;
  clave_publica_rsa: string;
  bits: number;
}

/** GET /api/jurado/llaves-publicas */
export interface LlavesPublicasJuradoResponse {
  jueces: LlavePublicaJuez[];
}

/** Una obra en la cola del juez (sin datos del pintor). */
export interface PinturaAsignada {
  id: string;
  codigo_anonimo: string;
  titulo: string;
  descripcion: string;
  tipo_mime: string;
  evaluada: boolean;
}

/** GET /api/jurado/mis-pinturas */
export interface MisPinturasJuezResponse {
  pinturas: PinturaAsignada[];
}

/** GET /api/pinturas/{id}/descargar: obra cifrada + sobre RSA-OAEP del juez en sesión. */
export interface PinturaCifradaJuezResponse {
  id_pintura: string;
  titulo: string;
  descripcion: string;
  tipo_mime: string;
  pintura_cifrada: string;
  hash_pintura_cifrada: string;
  sobre_llave: string;
}

/** Sobres armados en el worker: { id_juez: sobre_base64 }. */
export type SobresJurado = Record<string, string>;
