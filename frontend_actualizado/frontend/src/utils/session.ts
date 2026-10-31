/**
 * utils/session.ts
 * Lee el JWT para saber el rol y a qué panel mandar al usuario.
 * OJO: esto es solo para la navegación; la autorización real la valida el backend.
 */
export type RolSesion = 'pintor' | 'jurado' | 'presidente';

interface PayloadJWT {
  sub: string;
  tipo_actor: 'PINTOR' | 'JURADO';
  rol_especifico: 'PINTOR' | 'JUEZ' | 'PRESIDENTE';
  exp: number;
}

export function leerPayloadJWT(): PayloadJWT | null {
  const segmento = sessionStorage.getItem('access_token')?.split('.')[1];
  if (!segmento) return null;
  try {
    const payload = JSON.parse(atob(segmento.replace(/-/g, '+').replace(/_/g, '/'))) as PayloadJWT;
    if (payload.exp * 1000 <= Date.now()) {
      sessionStorage.removeItem('access_token'); // token vencido
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function obtenerRolSesion(): RolSesion | null {
  switch (leerPayloadJWT()?.rol_especifico) {
    case 'PINTOR': return 'pintor';
    case 'JUEZ': return 'jurado';
    case 'PRESIDENTE': return 'presidente';
    default: return null;
  }
}