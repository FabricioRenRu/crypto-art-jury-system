/**
 * components/jury/QueueStrip.tsx
 * Tira inferior con las obras en cola. Al hacer clic en una se carga en el visor.
 */
import Icon from '../ui/Icon';
import type { JuryArtwork } from '../../types';

interface QueueStripProps {
  queue: JuryArtwork[];
  currentIndex: number;
  ratedIds: string[];
  onSelect: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
}

const arrowButton =
  'w-8 h-8 rounded bg-surface-variant hover:bg-surface-bright text-on-surface flex items-center justify-center transition-colors';

export default function QueueStrip({
  queue,
  currentIndex,
  ratedIds,
  onSelect,
  onPrevious,
  onNext,
}: QueueStripProps) {
  const remaining = queue.length - ratedIds.length;

  return (
    <section className="w-full bg-surface-container-lowest py-space-md px-gutter border-t border-surface-variant/20">
      <div className="max-w-7xl mx-auto flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <Icon name="collections" className="text-primary text-[20px]" />
            <h4 className="font-title-md text-title-md text-on-surface">Obras en Cola</h4>
            <span className="font-label-sm text-label-sm px-2 py-0.5 bg-surface-variant text-on-surface-variant rounded">
              {remaining} restantes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Obra anterior" onClick={onPrevious} className={arrowButton}>
              <Icon name="chevron_left" className="text-[20px]" />
            </button>
            <button type="button" aria-label="Obra siguiente" onClick={onNext} className={arrowButton}>
              <Icon name="chevron_right" className="text-[20px]" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-space-sm overflow-x-auto pb-1">
          {queue.map((obra, index) => {
            const active = index === currentIndex;
            const rated = ratedIds.includes(obra.id);
            return (
              <button
                key={obra.id}
                type="button"
                onClick={() => onSelect(index)}
                className={`relative group rounded-lg overflow-hidden cursor-pointer p-1 flex flex-col gap-1.5 text-left transition-all ${
                  active
                    ? 'bg-surface-container-high ring-2 ring-primary-container'
                    : 'bg-surface-container hover:bg-surface-container-high'
                }`}
              >
                <div className="relative w-full aspect-video rounded overflow-hidden">
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url("${obra.imageUrl}")` }}
                  />
                  {rated && (
                    <span className="absolute top-1 right-1 bg-primary-container text-on-primary rounded-full w-5 h-5 flex items-center justify-center">
                      <Icon name="check" className="text-[14px]" />
                    </span>
                  )}
                </div>
                <div className="flex flex-col px-1">
                  <span
                    className={`font-body-sm text-[12px] truncate ${
                      active
                        ? 'font-semibold text-primary'
                        : 'text-on-surface-variant group-hover:text-on-surface'
                    }`}
                  >
                    {obra.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
