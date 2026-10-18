/**
 * components/home/PhasesSection.tsx
 * Sección "Fases del Concurso": muestra los 4 pasos (Inscripción, Calificación, Validación, Podio).
 */
import SectionHeading from '../ui/SectionHeading';
import PhaseCard from './PhaseCard';
import { CONTEST_PHASES } from '../../data/phases';

export default function PhasesSection() {
  return (
    <section className="w-full py-20 bg-surface-container-low border-t border-outline-variant/20">
      <div className="max-w-[1400px] mx-auto px-margin-mobile md:px-margin">
        <SectionHeading
          title="Fases del Concurso"
          subtitle="Un circuito transparente de 4 pasos para garantizar una evaluación imparcial y profesional."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CONTEST_PHASES.map((phase) => (
            <PhaseCard key={phase.number} phase={phase} />
          ))}
        </div>
      </div>
    </section>
  );
}
