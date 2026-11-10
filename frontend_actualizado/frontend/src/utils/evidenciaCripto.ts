import type { SeccionCripto } from '../types';

export async function describirCripto(
  ejecutarAccion: (accion: string, payload?: any) => Promise<any>,
  accion: string,
  payload?: any,
): Promise<SeccionCripto[]> {
  try {
    const resultado = await ejecutarAccion(accion, payload);
    return (resultado?.secciones ?? []) as SeccionCripto[];
  } catch (error) {
    console.warn(`No se pudo describir ${accion}:`, error);
    return [];
  }
}
