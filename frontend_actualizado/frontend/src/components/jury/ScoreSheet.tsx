/**
 * components/jury/ScoreSheet.tsx
 * Hoja de calificacion: opciones de 1 a 3 estrellas, comentario del jurado
 * y botones de guardar y pasar a la siguiente pintura.
 */
import Icon from '../ui/Icon';
import type { StarOption } from '../../types';
import type { JuryDraft, SaveStatus } from '../../hooks/useJuryEvaluation';

interface ScoreSheetProps {
  options: StarOption[];
  draft: JuryDraft;
  saveStatus: SaveStatus;
  onChangeStars: (stars: number) => void;
  onChangeComment: (comment: string) => void;
  onSave: () => void;
  onNext: () => void;
}

export default function ScoreSheet({
  options,
  draft,
  saveStatus,
  onChangeStars,
  onChangeComment,
  onSave,
  onNext,
}: ScoreSheetProps) {
  const isSending = saveStatus === 'sending';
  const isSaved = saveStatus === 'saved';

  return (
    <div className="lg:col-span-5 flex flex-col gap-space-md bg-surface-variant/90 p-space-lg rounded-xl shadow-xl backdrop-blur-lg border border-outline-variant/20">
      {/* Titulo y estrellas elegidas */}
      <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-high">
        <div>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary">
            Panel de Jurado
          </span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Hoja de Calificación</h3>
        </div>
        <div className="flex items-center gap-space-sm bg-surface-container-lowest px-space-md py-1 rounded-xl border border-outline-variant/30">
          <div className="flex flex-col text-right">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Estrellas
            </span>
            <span className="font-headline-md text-headline-md font-bold text-primary">{draft.stars}</span>
          </div>
          <Icon name="star" filled className="text-primary-container text-[24px]" />
        </div>
      </div>

      <form
        className="flex flex-col gap-space-md"
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
      >
        {/* Opciones de estrellas */}
        {options.map((opcion) => {
          const selected = draft.stars === opcion.value;
          return (
            <label
              key={opcion.value}
              className={`group relative flex items-center justify-between p-space-md rounded-xl cursor-pointer transition-all ${
                selected
                  ? 'bg-surface-container-highest/80 border-2 border-primary-container shadow-lg'
                  : 'bg-surface-container-high/60 hover:bg-surface-container-high border border-outline-variant/20 hover:border-outline'
              }`}
            >
              <div className="flex items-center gap-space-md">
                <input
                  type="radio"
                  name="star_rating"
                  value={opcion.value}
                  checked={selected}
                  onChange={() => onChangeStars(opcion.value)}
                  className="accent-primary-container h-4 w-4 cursor-pointer"
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <div className={`flex ${selected ? 'text-primary-container' : 'text-primary'}`}>
                      {options.map((estrella) => (
                        <Icon
                          key={estrella.value}
                          name="star"
                          filled={estrella.value <= opcion.value}
                          className={`text-[18px] ${estrella.value <= opcion.value ? '' : 'opacity-30'}`}
                        />
                      ))}
                    </div>
                    <span className="font-title-md text-title-md text-on-surface font-semibold">
                      {opcion.label}
                    </span>
                  </div>
                  <span
                    className={`font-body-sm text-body-sm ${selected ? 'text-primary' : 'text-on-surface-variant'}`}
                  >
                    {opcion.description}
                  </span>
                </div>
              </div>
              {selected ? (
                <span className="font-label-sm text-label-sm text-on-primary bg-primary-container uppercase tracking-wider px-2 py-0.5 rounded font-bold">
                  Seleccionada
                </span>
              ) : (
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider px-2 py-0.5 rounded bg-surface-container-lowest">
                  Nivel {opcion.value}
                </span>
              )}
            </label>
          );
        })}

        {/* Comentario */}
        <div className="flex flex-col gap-space-xs">
          <label
            htmlFor="feedbackText"
            className="font-title-md text-title-md text-on-surface flex items-center gap-1"
          >
            <Icon name="rate_review" className="text-[18px] text-primary" />
            Comentario / Feedback del Jurado
          </label>
          <textarea
            id="feedbackText"
            rows={3}
            value={draft.comment}
            onChange={(e) => onChangeComment(e.target.value)}
            placeholder="Devolución técnica u observaciones opcionales..."
            className="w-full bg-surface-container-lowest text-on-surface font-body-md text-body-md p-3 rounded-lg border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary-container resize-none"
          />
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-space-sm pt-space-xs">
          <button
            type="submit"
            disabled={isSending}
            className={`w-full py-3.5 px-space-md font-label-md text-label-md uppercase tracking-wider rounded-lg shadow-lg flex items-center justify-center gap-space-sm transition-all transform active:scale-95 ${
              isSaved
                ? 'bg-surface-bright text-primary'
                : 'bg-primary-container hover:bg-tertiary-container text-on-primary'
            } ${isSending ? 'opacity-80 pointer-events-none' : ''}`}
          >
            {isSending && (
              <>
                <Icon name="sync" className="animate-spin text-[20px]" />
                Transmitiendo Veredicto...
              </>
            )}
            {isSaved && (
              <>
                <Icon name="done_all" className="text-[20px]" />
                ¡Calificación Asentada con Éxito!
              </>
            )}
            {saveStatus === 'idle' && (
              <>
                <Icon name="check_circle" className="text-[20px]" />
                Guardar Calificación
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onNext}
            className="w-full py-2.5 px-3 bg-surface-bright hover:bg-surface-container-highest text-on-surface font-label-sm text-label-sm uppercase tracking-wider rounded flex items-center justify-center gap-1 transition-colors"
          >
            <span>Siguiente Pintura</span>
            <Icon name="arrow_forward" className="text-[18px]" />
          </button>
        </div>
      </form>
    </div>
  );
}
