/**
 * components/podium/PodiumCard.tsx
 * Tarjeta del podio de honor. El primer lugar se dibuja mas grande y destacado;
 * el segundo (plata) y el tercero (bronce) usan el estilo compacto.
 */
import Icon from '../ui/Icon';
import { averageScore } from '../../utils/scores';
import type { Finalist } from '../../types';

interface PodiumCardProps {
  finalist: Finalist;
}

const MEDALS: Record<number, { label: string; text: string; badge: string }> = {
  2: { label: 'Plata', text: 'text-secondary', badge: '2º PUESTO' },
  3: { label: 'Bronce', text: 'text-tertiary', badge: '3er PUESTO' },
};

export default function PodiumCard({ finalist }: PodiumCardProps) {
  const isFirst = finalist.position === 1;
  const average = averageScore(finalist.juryScores).toFixed(1);
  const medal = MEDALS[finalist.position];

  if (isFirst) {
    return (
      <div className="order-1 md:order-2 flex flex-col items-center w-full -mt-6 md:-mt-10">
        <div className="w-full bg-surface-container-highest rounded-xl p-6 shadow-2xl flex flex-col relative ring-2 ring-primary-container/40">
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary-container text-on-primary font-label-md text-label-md uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_24px_rgba(255,107,0,0.5)] whitespace-nowrap">
            <Icon name="crown" filled className="text-[18px]" />
            <span>1er Lugar • Campeón Absoluta</span>
          </div>

          <div className="flex items-center justify-between mt-3 mb-3">
            <span className="font-label-md text-label-md px-3 py-1 rounded bg-primary-container text-on-primary font-bold">
              1er PUESTO
            </span>
            <div className="flex items-center gap-1 text-primary-fixed">
              <Icon name="workspace_premium" filled className="text-[22px]" />
              <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold">
                Oro Supremo
              </span>
            </div>
          </div>

          <div className="relative w-full aspect-video rounded overflow-hidden mb-4 shadow-md group">
            <img
              alt={finalist.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              src={finalist.heroImageUrl ?? finalist.imageUrl}
            />
            {finalist.category && (
              <span className="absolute bottom-2 left-2 font-label-sm text-label-sm text-on-primary bg-primary-container px-2 py-0.5 rounded font-bold uppercase">
                {finalist.category}
              </span>
            )}
          </div>

          <h2 className="font-headline-md text-headline-md text-on-surface line-clamp-1">{finalist.title}</h2>
          <p className="font-body-lg text-body-lg text-secondary mb-4">{finalist.artist}</p>

          <div className="bg-surface-variant rounded-lg p-4 flex items-center justify-between shadow-inner">
            <div>
              <span className="font-label-sm text-label-sm text-secondary uppercase block">Estrellas (1-9)</span>
              <div className="flex items-center gap-1.5 mt-1">
                <Icon name="star" filled className="text-[28px] text-primary" />
                <span className="font-display-mobile text-display-mobile text-primary font-bold leading-none">
                  {average}
                  <span className="font-headline-sm text-headline-sm text-secondary ml-1">/ 9</span>
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-label-sm text-label-sm text-secondary uppercase block">Premio Mayor</span>
              <span className="font-headline-sm text-headline-sm text-primary-container font-bold">
                {finalist.prize}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${finalist.position === 2 ? 'order-2 md:order-1' : 'order-3'} flex flex-col items-center w-full`}>
      <div className="w-full bg-surface-container-high rounded-xl p-5 shadow-xl flex flex-col border border-outline-variant/20">
        <div className="flex items-center justify-between mb-3">
          <span className="font-label-md text-label-md px-2.5 py-0.5 rounded bg-surface-variant text-on-surface font-bold">
            {medal.badge}
          </span>
          <div className={`flex items-center gap-1 ${medal.text}`}>
            <Icon name="military_tech" filled className="text-[20px]" />
            <span className="font-label-sm text-label-sm uppercase tracking-wider">{medal.label}</span>
          </div>
        </div>

        <div className="relative w-full aspect-video rounded overflow-hidden mb-4 shadow-sm group">
          <img
            alt={finalist.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            src={finalist.heroImageUrl ?? finalist.imageUrl}
          />
          {finalist.category && (
            <span className="absolute bottom-2 left-2 font-label-sm text-label-sm text-on-surface bg-surface-container-lowest/80 px-2 py-0.5 rounded">
              {finalist.category}
            </span>
          )}
        </div>

        <h3 className="font-title-lg text-title-lg text-on-surface line-clamp-1">{finalist.title}</h3>
        <p className="font-body-md text-body-md text-secondary mb-4">{finalist.artist}</p>

        <div className="bg-surface-variant/70 rounded p-3 flex items-center justify-between">
          <div>
            <span className="font-label-sm text-label-sm text-secondary uppercase block">Estrellas (1-9)</span>
            <div className="flex items-center gap-1 mt-0.5">
              <Icon name="star" filled className={`text-[20px] ${finalist.position === 2 ? 'text-primary' : 'text-tertiary'}`} />
              <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                {average}
                <span className="font-label-sm text-label-sm text-secondary ml-1">/ 9</span>
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="font-label-sm text-label-sm text-secondary uppercase block">Premio</span>
            <span className="font-title-md text-title-md text-primary font-bold">{finalist.prize}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
