/**
 * hooks/useJuryEvaluation.ts
 * Maneja la sesion de calificacion del jurado: obra actual, borrador de estrellas
 * y comentario por obra, obras ya calificadas y el estado del boton "Guardar".
 */
import { useEffect, useRef, useState } from 'react';
import type { JuryArtwork } from '../types';

/** Borrador de la calificacion de una obra. */
export interface JuryDraft {
  stars: number;
  comment: string;
}

/** Estado del boton de guardar: normal, enviando o guardado con exito. */
export type SaveStatus = 'idle' | 'sending' | 'saved';

const DEFAULT_DRAFT: JuryDraft = { stars: 3, comment: '' };
const SENDING_MS = 900;
const SAVED_MS = 2500;

export function useJuryEvaluation(queue: JuryArtwork[]) {
  /** STATE: posicion de la obra que se esta calificando. */
  const [currentIndex, setCurrentIndex] = useState(0);

  /** STATE: borradores (estrellas y comentario) por id de obra. */
  const [drafts, setDrafts] = useState<Record<string, JuryDraft>>({});

  /** STATE: ids de las obras ya calificadas en esta sesion. */
  const [ratedIds, setRatedIds] = useState<string[]>([]);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  /** Guarda los temporizadores para limpiarlos si el componente se desmonta. */
  const timers = useRef<number[]>([]);
  useEffect(() => {
    const pendientes = timers.current;
    return () => pendientes.forEach((id) => window.clearTimeout(id));
  }, []);

  const currentArtwork = queue[currentIndex];
  const currentDraft = drafts[currentArtwork.id] ?? DEFAULT_DRAFT;

  const updateDraft = (cambios: Partial<JuryDraft>) => {
    setDrafts((actuales) => ({
      ...actuales,
      [currentArtwork.id]: { ...currentDraft, ...cambios },
    }));
  };

  const goTo = (index: number) => {
    if (index < 0 || index >= queue.length) {
      return;
    }
    setCurrentIndex(index);
    setSaveStatus('idle');
  };

  const goNext = () => goTo((currentIndex + 1) % queue.length);
  const goPrevious = () => goTo((currentIndex - 1 + queue.length) % queue.length);

  /**
   * Guarda la calificacion. Aqui es donde, con backend, se mandarian
   * las estrellas y el comentario a la API; por ahora se simula la espera.
   */
  const saveRating = () => {
    if (saveStatus !== 'idle') {
      return;
    }
    setSaveStatus('sending');

    const idEnviando = window.setTimeout(() => {
      setRatedIds((actuales) =>
        actuales.includes(currentArtwork.id) ? actuales : [...actuales, currentArtwork.id],
      );
      setSaveStatus('saved');

      const idGuardado = window.setTimeout(() => setSaveStatus('idle'), SAVED_MS);
      timers.current.push(idGuardado);
    }, SENDING_MS);
    timers.current.push(idEnviando);
  };

  return {
    currentIndex,
    currentArtwork,
    currentDraft,
    ratedIds,
    saveStatus,
    updateDraft,
    goTo,
    goNext,
    goPrevious,
    saveRating,
  };
}
