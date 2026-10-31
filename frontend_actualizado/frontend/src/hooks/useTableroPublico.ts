/**
 * hooks/useTableroPublico.ts
 * Paso 10: descarga el tablero público y lo adapta a la forma Finalist que ya usan
 * PodiumCard y ResultsTable.
 */
import { useEffect, useMemo, useState } from 'react';
import { resultadosService } from '../services/resultadosService';
import { OBRA_PROTEGIDA_URL } from '../data/assets';
import type { Finalist } from '../types';
import type { TableroPublicoResponse } from '../types/evaluacion';

export function useTableroPublico() {
  /** STATE: respuesta completa del backend (evaluaciones, firmas y llaves públicas). */
  const [tablero, setTablero] = useState<TableroPublicoResponse | null>(null);
  /** STATE: true mientras se descarga. */
  const [isLoading, setIsLoading] = useState(true);
  /** STATE: mensaje si la descarga falla. */
  const [error, setError] = useState<string | null>(null);

  /** EFFECT: descarga el tablero una vez al entrar. */
  useEffect(() => {
    resultadosService
      .obtenerTablero()
      .then(setTablero)
      .catch((err) => setError(err.message || 'No se pudieron cargar los resultados.'))
      .finally(() => setIsLoading(false));
  }, []);

  /** Valor derivado: obras en el formato de los componentes del podio. */
  const finalistas: Finalist[] = useMemo(
    () =>
      (tablero?.obras ?? []).map((obra) => ({
        position: obra.posicion,
        id: obra.codigo_anonimo,
        title: obra.titulo,
        artist: obra.seudonimo,
        country: '—',
        imageUrl: OBRA_PROTEGIDA_URL, // la imagen sigue cifrada: solo los jueces pueden verla
        juryScores: obra.evaluaciones.map((e) => e.estrellas),
        juryComments: obra.evaluaciones.map((e) => e.comentario),
        prize: null,
      })),
    [tablero],
  );

  return { tablero, finalistas, isLoading, error };
}