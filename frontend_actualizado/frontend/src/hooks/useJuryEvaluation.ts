/**
 * hooks/useJuryEvaluation.ts
 * Maneja la sesión de calificación del jurado: obra actual, borrador de estrellas
 * y comentario por obra, obras ya calificadas y el estado del botón "Guardar".
 * Al guardar ejecuta los pasos 2 y 3 de la firma ciega: el worker ciega la evaluación
 * (h' = h·r^e mod n) y la cifra para el propio juez; se suben h' y la evaluación cifrada.
 */
import { useEffect, useRef, useState } from 'react';
import { useCryptoWorker } from './useCryptoWorker';
import type { JuryArtwork } from '../types';
import { Acciones } from '../workers/crypto.actions';
import { juradoService } from '../services/juradoService';
import { leerPayloadJWT } from '../utils/session';
import { describirCripto } from '../utils/evidenciaCripto';
import type { SeccionCripto } from '../types';

/** Borrador de la calificación de una obra. */
export interface JuryDraft {
  stars: number;
  comment: string;
}

/** Estado del botón de guardar. */
export type SaveStatus = 'idle' | 'sending' | 'saved' | 'error';

const DEFAULT_DRAFT: JuryDraft = { stars: 3, comment: '' };
const SAVED_MS = 2500;
export const MAX_COMENTARIO = 1000;

export function useJuryEvaluation(queue: JuryArtwork[], initialRatedIds: string[] = []) {
  const { ejecutarAccion } = useCryptoWorker();

  /** STATE: posición de la obra que se está calificando. */
  const [currentIndex, setCurrentIndex] = useState(0);
  /** STATE: borradores (estrellas y comentario) por id de obra. */
  const [drafts, setDrafts] = useState<Record<string, JuryDraft>>({});
  /** STATE: ids de las obras ya calificadas (no se pueden volver a enviar). */
  const [ratedIds, setRatedIds] = useState<string[]>(initialRatedIds);
  /** STATE: estado del botón de guardar. */
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  /** STATE: mensaje de error del último guardado. */
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [evidenciaCegado, setEvidenciaCegado] = useState<Record<string, SeccionCripto[]>>({});

  /** Guarda los temporizadores para limpiarlos si el componente se desmonta. */
  const timers = useRef<number[]>([]);

  /** EFFECT: limpia los temporizadores al desmontar. */
  useEffect(() => {
    const pendientes = timers.current;
    return () => pendientes.forEach((id) => window.clearTimeout(id));
  }, []);

  const currentArtwork = queue[currentIndex];
  const currentDraft = currentArtwork ? (drafts[currentArtwork.id] ?? DEFAULT_DRAFT) : DEFAULT_DRAFT;

  const updateDraft = (cambios: Partial<JuryDraft>) => {
    setDrafts((actuales) => ({
      ...actuales,
      [currentArtwork.id]: { ...currentDraft, ...cambios },
    }));
  };

  const goTo = (index: number) => {
    if (index < 0 || index >= queue.length) return;
    setCurrentIndex(index);
    setSaveStatus('idle');
    setErrorMessage(null);
  };

  const goNext = () => goTo((currentIndex + 1) % queue.length);
  const goPrevious = () => goTo((currentIndex - 1 + queue.length) % queue.length);

  /** Regresa el botón a "idle" después de un rato. */
  const volverAIdle = () => {
    timers.current.push(window.setTimeout(() => setSaveStatus('idle'), SAVED_MS));
  };

  /** Pasos 2 y 3: cegar la evaluación en el worker y subirla. */
  const saveRating = async () => {
    if (saveStatus !== 'idle' || !currentArtwork?.idPintura || ratedIds.includes(currentArtwork.id)) {
      return;
    }
    setSaveStatus('sending');
    setErrorMessage(null);

    try {
      const idJuez = leerPayloadJWT()?.sub;
      if (!idJuez) throw new Error('Tu sesión expiró. Inicia sesión de nuevo.');
      if (currentDraft.comment.trim().length > MAX_COMENTARIO) {
        throw new Error(`El comentario admite máximo ${MAX_COMENTARIO} caracteres.`);
      }

      // Paso 2 (worker): h' = FDH(evaluación)·r^e mod n  +  evaluación cifrada para el propio juez
      const { h_blinded, evaluacion_cifrada } = await ejecutarAccion(Acciones.CEGAR_EVALUACION, {
        id_pintura: currentArtwork.idPintura,
        id_juez: idJuez,
        estrellas: currentDraft.stars,
        comentario: currentDraft.comment,
      });
      const evidencia = await describirCripto(ejecutarAccion, Acciones.DESCRIBIR_CEGADO, {
        id_pintura: currentArtwork.idPintura,
        id_juez: idJuez,
        estrellas: currentDraft.stars,
        comentario: currentDraft.comment,
        h_blinded,
      });
      setEvidenciaCegado((actuales) => ({ ...actuales, [currentArtwork.id]: evidencia }));

      // Paso 3: el servidor guarda h' y la evaluación cifrada, sin poder leerla
      await juradoService.enviarEvaluacionCegada({
        id_pintura: currentArtwork.idPintura,
        hash_cegado: h_blinded,
        evaluacion_cifrada,
      });

      setRatedIds((actuales) =>
        actuales.includes(currentArtwork.id) ? actuales : [...actuales, currentArtwork.id],
      );
      setSaveStatus('saved');
      volverAIdle();
    } catch (error: any) {
      console.error('Error al guardar la evaluación:', error);
      setSaveStatus('error');
      setErrorMessage(error.message || 'Error al enviar la evaluación. Intenta de nuevo.');
      volverAIdle();
    }
  };

  return {
    currentIndex,
    currentArtwork,
    currentDraft,
    ratedIds,
    saveStatus,
    errorMessage,
    evidenciaCegado: currentArtwork ? (evidenciaCegado[currentArtwork.id] ?? []) : [],
    updateDraft,

    goTo,
    goNext,
    goPrevious,
    saveRating,
  };
}