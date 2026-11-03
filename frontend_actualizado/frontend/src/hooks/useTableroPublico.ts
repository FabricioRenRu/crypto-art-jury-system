/**
 * hooks/useTableroPublico.ts
 * Paso 10: descarga el tablero público, descifra en el worker las obras ya reveladas
 * y lo adapta a la forma Finalist que usan PodiumCard y ResultsTable.
 */
import { useEffect, useMemo, useState } from 'react';
import { useCryptoWorker } from './useCryptoWorker';
import { resultadosService } from '../services/resultadosService';
import { Acciones } from '../workers/crypto.actions';
import { OBRA_PROTEGIDA_URL } from '../data/assets';
import type { Finalist } from '../types';
import type { TableroPublicoResponse } from '../types/evaluacion';

export function useTableroPublico() {
  const { estaListo, ejecutarAccion } = useCryptoWorker();

  /** STATE: respuesta completa del backend (evaluaciones, firmas, llaves públicas y llaves AES reveladas). */
  const [tablero, setTablero] = useState<TableroPublicoResponse | null>(null);
  /** STATE: true mientras se descarga el tablero. */
  const [isLoading, setIsLoading] = useState(true);
  /** STATE: mensaje si la descarga falla. */
  const [error, setError] = useState<string | null>(null);
  /** STATE: imágenes ya descifradas, por id de pintura (object URLs). */
  const [imagenes, setImagenes] = useState<Record<string, string>>({});

  /** EFFECT: descarga el tablero una vez al entrar. */
  useEffect(() => {
    resultadosService
      .obtenerTablero()
      .then(setTablero)
      .catch((err) => setError(err.message || 'No se pudieron cargar los resultados.'))
      .finally(() => setIsLoading(false));
  }, []);

  /**
   * EFFECT: cuando ya hay tablero y el worker está listo, baja y descifra las obras reveladas
   * una por una. Al salir de la página se liberan los object URLs.
   */
  useEffect(() => {
    if (!tablero || !estaListo) return;
    let cancelado = false;
    const urls: string[] = [];

    (async () => {
      for (const obra of tablero.obras) {
        if (!obra.llave_aes) continue;
        try {
          const blob = await resultadosService.obtenerImagenCifrada(obra.id_pintura);
          const { datos } = await ejecutarAccion(Acciones.DESCIFRAR_OBRA_PUBLICA, {
            id_pintura: obra.id_pintura,
            llave_aes: obra.llave_aes,
            cifrado: new Uint8Array(await blob.arrayBuffer()),
          });
          if (cancelado) return;
          const bytes = new Uint8Array(datos);
          const copia = new ArrayBuffer(bytes.byteLength);
          new Uint8Array(copia).set(bytes);
          const url = URL.createObjectURL(new Blob([copia], { type: obra.tipo_mime }));
          urls.push(url);
          setImagenes((actuales) => ({ ...actuales, [obra.id_pintura]: url }));
        } catch (err) {
          console.warn(`No se pudo descifrar la obra ${obra.codigo_anonimo}:`, err);
        }
      }
    })();

    return () => {
      cancelado = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [tablero, estaListo, ejecutarAccion]);

  /** Valor derivado: obras en el formato de los componentes del podio. */
  const finalistas: Finalist[] = useMemo(
    () =>
      (tablero?.obras ?? []).map((obra) => ({
        position: obra.posicion,
        id: obra.codigo_anonimo,
        title: obra.titulo,
        artist: obra.seudonimo,
        country: '—',
        // Mientras se descifra (o si aún no se revela) se muestra el placeholder
        imageUrl: imagenes[obra.id_pintura] ?? OBRA_PROTEGIDA_URL,
        juryScores: obra.evaluaciones.map((e) => e.estrellas),
        juryComments: obra.evaluaciones.map((e) => e.comentario),
        prize: null,
      })),
    [tablero, imagenes],
  );

  return { tablero, finalistas, isLoading, error };
}