/**
 * types/pintor.ts
 * Tipos del pintor. Deben coincidir con los schemas del backend.
 * El par ECDSA se genera en el frontend; el servidor recibe y persiste solo la pública.
 */
export interface PintorCreate {
  nombre: string;
  seudonimo: string;
  email: string;
  contrasena: string;
  clave_publica_ecdsa: string;
  foto_perfil_b64: string | null;
}

export interface PintorResponse {
  id: string;
  email: string;
  clave_publica_ecdsa: string;
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
  tipo_mime: string;
  hash_pintura_cifrada: string;
  firma_consentimiento: string;
}

/** GET /api/pinturas/mis-obras */
export interface MisObrasResponse {
  total_slots: number;
  obras: PinturaResponse[];
}
