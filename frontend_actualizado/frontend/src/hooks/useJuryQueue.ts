/**
 * hooks/useJuryQueue.ts
 * Arma la cola de la mesa de calificación con las obras reales del juez:
 * por cada obra baja la pintura cifrada y su sobre, abre el sobre con la llave
 * privada RSA del worker (RSA-OAEP) y descifra la imagen con AES-256-GCM.
 * K_AES y la imagen en claro nunca salen del navegador del juez.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { juradoService } from '../services/juradoService';
import { useCryptoWorker } from './useCryptoWorker';
import { Acciones } from '../workers/crypto.worker';
import type { JuryArtwork } from '../types';
import type { PinturaAsignada } from '../types/jurado';

function base64ABytes(texto: string): Uint8Array {
  const binario = atob(texto);
  const bytes = new Uint8Array(binario.length);
  for (let indice = 0; indice < binario.length; indice++) {
    bytes[indice] = binario.charCodeAt(indice);
  }
  return bytes;
}

export const useJuryQueue = () => {
  const { estaListo, ejecutarAccion } = useCryptoWorker();
  const [queue, setQueue] = useState<JuryArtwork[]>([]);
  const [ratedIds, setRatedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // object URLs de las imágenes descifradas; se liberan al desmontar
  const urlsRef = useRef<string[]>([]);

  /** Baja, abre el sobre y descifra una obra. */
  const abrirObra = useCallback(async (pintura: PinturaAsignada): Promise<JuryArtwork> => {
    const descarga = await juradoService.descargarPintura(pintura.id);

    // RSA-OAEP: el worker recupera K_AES con la llave privada del juez
    await ejecutarAccion(Acciones.ABRIR_SOBRE, {
      id_pintura: pintura.id,
      sobre: descarga.sobre_llave,
    });

    // AES-256-GCM: con K_AES ya en el worker se descifra la imagen
    const resultado = await ejecutarAccion(Acciones.DESCIFRAR_PINTURA, {
      id_pintura: pintura.id,
      cifrado: base64ABytes(descarga.pintura_cifrada),
    });
    const datos = new Uint8Array(resultado.datos);
    const imagen = new ArrayBuffer(datos.byteLength);
    new Uint8Array(imagen).set(datos);
    const imageUrl = URL.createObjectURL(new Blob([imagen], { type: pintura.tipo_mime }));
    urlsRef.current.push(imageUrl);

    return {
      id: pintura.codigo_anonimo,
      title: pintura.titulo,
      imageUrl,
      idPintura: pintura.id,
    };
  }, [ejecutarAccion]);

  const cargar = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { pinturas } = await juradoService.listarMisPinturas();
      // Una por una para no saturar la memoria del worker con varias imágenes a la vez
      const obras: JuryArtwork[] = [];
      for (const pintura of pinturas) {
        obras.push(await abrirObra(pintura));
      }
      setQueue(obras);
      setRatedIds(pinturas.filter((p) => p.evaluada).map((p) => p.codigo_anonimo));
    } catch (err: any) {
      setError(err.message || 'No se pudieron abrir las obras asignadas.');
    } finally {
      setIsLoading(false);
    }
  }, [abrirObra]);

  useEffect(() => {
    if (!estaListo) {
      return;
    }
    cargar();
    return () => urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
  }, [estaListo, cargar]);

  return { queue, ratedIds, isLoading: isLoading || !estaListo, error, recargar: cargar };
};
