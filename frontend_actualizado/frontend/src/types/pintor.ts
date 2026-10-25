/**
 * types/pintor.ts
 * Tipos del pintor. Deben coincidir con los schemas del backend.
 * El par ECDSA lo genera el servidor al registrar: guarda solo la pública y entrega la
 * privada UNA vez para que el usuario la descargue (el servidor no la persiste).
 */
export interface PintorCreate {
  nombre: string;
  seudonimo: string;
  email: string;
  contrasena: string;
  foto_perfil_b64: string | null;
}

export interface PintorResponse {
  id: string;
  email: string;
  clave_publica_ecdsa: string;
}

/** Respuesta del registro: incluye la privada una sola vez. */
export interface PintorRegistroResponse extends PintorResponse {
  clave_privada_pem: string;
}

export interface EstadoLlaveResponse {
  lista: boolean;
}

/** GET /api/pintores/me */
export interface PerfilPintorResponse {
  nombre: string;
  seudonimo: string;
  torneo: string;
  foto_perfil: string | null;
}

/** Una obra tal como la devuelve el backend. */
export interface PinturaResponse {
  id: string;
  slot: number;
  total_slots: number;
  titulo: string;
  descripcion: string;
  estado: string;
  hash_pintura_cifrada: string;
  firma_consentimiento: string;
}

/** GET /api/pinturas/mis-obras */
export interface MisObrasResponse {
  total_slots: number;
  obras: PinturaResponse[];
}
