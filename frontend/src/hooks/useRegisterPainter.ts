/**
 * hooks/useRegisterPainter.ts
 * Maneja la petición de registro: carga, error y resultado.
 */
import { useState } from 'react';
import { painterService } from '../services/painterService';
import type { PainterCreate, PainterResponse } from '../types/painter';

export function useRegisterPainter() {
  /** STATE: true mientras se espera la respuesta del backend (para deshabilitar el botón). */
  const [isLoading, setIsLoading] = useState(false);

  /** STATE: mensaje de error si la petición falla; null si todo va bien. */
  const [error, setError] = useState<string | null>(null);

  /** STATE: respuesta exitosa del backend (contiene el ID anónimo). */
  const [result, setResult] = useState<PainterResponse | null>(null);

  const register = async (data: PainterCreate) => {
    setIsLoading(true);
    setError(null);
    try {
      setResult(await painterService.register(data));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return { register, isLoading, error, result };
}