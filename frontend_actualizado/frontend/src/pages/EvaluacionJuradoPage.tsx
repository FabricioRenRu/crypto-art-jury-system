/**
 * pages/EvaluacionJuradoPage.tsx
 * Página "Tribunal de Jueces · Mesa de Calificación" (migrada de Interfaces/PanelJuradoGOD).
 *
 * El jurado ve una obra anonima, elige de 1 a 3 estrellas, escribe un comentario y guarda.
 * Las obras son las reales del juez: useJuryQueue las baja cifradas, abre cada sobre
 * RSA-OAEP con la llave privada del juez y las descifra en el worker.
 * La logica de calificacion (obra actual, borradores, guardado) vive en useJuryEvaluation.
 */
import JuryProgressHeader from '../components/jury/JuryProgressHeader';
import ArtworkViewer from '../components/jury/ArtworkViewer';
import ScoreSheet from '../components/jury/ScoreSheet';
import QueueStrip from '../components/jury/QueueStrip';
import Icon from '../components/ui/Icon';
import { useJuryEvaluation } from '../hooks/useJuryEvaluation';
import { useJuryQueue } from '../hooks/useJuryQueue';
import { STAR_OPTIONS } from '../data/juryQueue';
import type { JuryArtwork } from '../types';

function MensajeMesa({ icono, texto, onReintentar }: { icono: string; texto: string; onReintentar?: () => void }) {
  return (
    <section className="w-full px-gutter py-space-xl">
      <div className="max-w-3xl mx-auto flex flex-col items-center gap-space-md text-center bg-surface-container rounded-xl p-space-xl">
        <Icon name={icono} className="text-primary text-[40px]" />
        <p className="font-body-md text-body-md text-on-surface-variant">{texto}</p>
        {onReintentar && (
          <button
            type="button"
            onClick={onReintentar}
            className="px-space-md py-space-sm rounded bg-primary-container text-on-primary font-label-md text-label-md"
          >
            Reintentar
          </button>
        )}
      </div>
    </section>
  );
}

function MesaCalificacion({ queue, initialRatedIds }: { queue: JuryArtwork[]; initialRatedIds: string[] }) {
  const {
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
  } = useJuryEvaluation(queue, initialRatedIds);

  return (
    <>
      <JuryProgressHeader completed={ratedIds.length} assigned={queue.length} />

      <section className="w-full px-gutter py-space-xl">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
          <ArtworkViewer key={currentArtwork.id} artwork={currentArtwork} />
          <ScoreSheet
            options={STAR_OPTIONS}
            draft={currentDraft}
            saveStatus={saveStatus}
            onChangeStars={(stars) => updateDraft({ stars })}
            onChangeComment={(comment) => updateDraft({ comment })}
            onSave={saveRating}
            onNext={goNext}
          />
        </div>
      </section>

      <QueueStrip
        queue={queue}
        currentIndex={currentIndex}
        ratedIds={ratedIds}
        onSelect={goTo}
        onPrevious={goPrevious}
        onNext={goNext}
      />
    </>
  );
}

export default function EvaluacionJuradoPage() {
  const { queue, ratedIds, isLoading, error, recargar } = useJuryQueue();

  let contenido;
  if (isLoading) {
    contenido = <MensajeMesa icono="lock_open" texto="Abriendo los sobres RSA-OAEP y descifrando las obras asignadas..." />;
  } else if (error) {
    contenido = <MensajeMesa icono="error" texto={error} onReintentar={recargar} />;
  } else if (queue.length === 0) {
    contenido = <MensajeMesa icono="inbox" texto="Todavía no hay obras con un sobre para ti." />;
  } else {
    contenido = <MesaCalificacion queue={queue} initialRatedIds={ratedIds} />;
  }

  return (
    <div className="flex flex-col w-full">
      {contenido}
    </div>
  );
}
