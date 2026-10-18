/**
 * types/painter.ts
 * Tipos del registro de pintor. Deben coincidir con los schemas del backend.
 */
export interface PainterCreate {
  full_name: string;
  email: string;
  password: string;
  category: string;
}

export interface PainterResponse {
  anonymous_id: string;
  category: string;
  message: string;
}