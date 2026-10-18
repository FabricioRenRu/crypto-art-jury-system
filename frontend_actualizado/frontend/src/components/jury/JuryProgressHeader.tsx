/**
 * components/jury/JuryProgressHeader.tsx
 * Encabezado de la Sala de Deliberacion con el medidor circular de progreso del turno.
 */
interface JuryProgressHeaderProps {
  completed: number;
  assigned: number;
}

export default function JuryProgressHeader({ completed, assigned }: JuryProgressHeaderProps) {
  const percent = Math.round((completed / assigned) * 100);
  const pending = assigned - completed;

  return (
    <section className="w-full bg-surface-container-low px-gutter py-space-lg">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-start xl:items-center justify-between gap-space-lg">
        <div className="flex flex-col gap-space-xs max-w-xl">
          <div className="flex items-center gap-space-sm">
            <span className="px-2 py-0.5 bg-primary-container text-on-primary font-label-sm text-label-sm uppercase tracking-wider rounded">
              Sala de Deliberación
            </span>
          </div>
          <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight">
            Tribunal de Jueces · Mesa de Calificación
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Evaluación a doble ciego para garantizar imparcialidad total. Inspeccione el trazo y emita
            su veredicto ponderado.
          </p>
        </div>

        {/* Medidor de progreso */}
        <div className="flex items-center gap-space-md w-full xl:w-auto bg-surface-container-high/60 p-space-md rounded-xl backdrop-blur-md">
          <div className="relative w-16 h-16 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-surface-bright"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
              />
              <path
                className="text-primary-container transition-all duration-500"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeDasharray={`${percent}, 100`}
                strokeLinecap="round"
                strokeWidth="3.5"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-label-md text-label-md font-bold text-on-surface">
              {percent}%
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary">
              Progreso de Turno
            </span>
            <span className="font-title-lg text-title-lg text-on-surface">
              {completed} <span className="text-on-surface-variant font-normal">de {assigned} asignadas</span>
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {pending} obras pendientes en cola
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
