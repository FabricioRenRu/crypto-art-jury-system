/**
 * components/home/PhaseCard.tsx
 * Tarjeta de una fase del concurso: número (01, 02...), título y descripción.
 */
import type { ContestPhase } from '../../types';

interface PhaseCardProps {
  phase: ContestPhase;
}

export default function PhaseCard({ phase }: PhaseCardProps) {
  return (
    <div className="bg-surface-container-high p-8 rounded-xl flex flex-col justify-between border border-outline-variant/20">
      <div>
        <span className="font-label-lg text-headline-sm text-primary-container font-bold block mb-4">
          {phase.number}
        </span>
        <h3 className="font-title-lg text-title-lg text-on-surface mb-2 font-semibold">{phase.title}</h3>
        <p className="font-body-sm text-body-sm text-secondary leading-relaxed">{phase.description}</p>
      </div>
    </div>
  );
}
