/**
 * types/painter.ts
 * Tipos del registro de pintor. Deben coincidir con los schemas del backend.
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