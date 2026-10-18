/**
 * pages/EvaluacionJuradoPage.tsx
 * Página "Tribunal de Jueces · Mesa de Calificación" (migrada de Interfaces/PanelJuradoGOD).
 *
 * El jurado ve una obra anonima, elige de 1 a 3 estrellas, escribe un comentario y guarda.
 * La logica (obra actual, borradores, guardado) vive en el hook useJuryEvaluation.
 */
import JuryProgressHeader from '../components/jury/JuryProgressHeader';
import ArtworkViewer from '../components/jury/ArtworkViewer';
import ScoreSheet from '../components/jury/ScoreSheet';
import QueueStrip from '../components/jury/QueueStrip';
import { useJuryEvaluation } from '../hooks/useJuryEvaluation';
import { JURY_QUEUE, JURY_TURN, STAR_OPTIONS } from '../data/juryQueue';

export default function EvaluacionJuradoPage() {
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
  } = useJuryEvaluation(JURY_QUEUE);

  return (
    <div className="flex flex-col w-full">
      <JuryProgressHeader
        completed={JURY_TURN.completed + ratedIds.length}
        assigned={JURY_TURN.assigned}
      />

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
        queue={JURY_QUEUE}
        currentIndex={currentIndex}
        ratedIds={ratedIds}
        onSelect={goTo}
        onPrevious={goPrevious}
        onNext={goNext}
      />
    </div>
  );
}
