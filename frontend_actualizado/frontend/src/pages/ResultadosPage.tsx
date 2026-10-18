/**
 * pages/ResultadosPage.tsx
 * Página "Ganadores y Podio de Honor" (migrada de Interfaces/PodioGOD).
 *
 * Muestra el podio (top 3), el boton para verificar la firma ciega del presidente
 * y la tabla general de posiciones con buscador.
 * Los datos salen de data/podium.ts hasta que se conecte con el backend.
 */
import { useState } from 'react';
import Icon from '../components/ui/Icon';
import PodiumCard from '../components/podium/PodiumCard';
import ResultsTable from '../components/podium/ResultsTable';
import SignatureVerifyModal from '../components/podium/SignatureVerifyModal';
import { FINALISTS, PRESIDENT_SIGNATURE } from '../data/podium';

export default function ResultadosPage() {
  /** STATE: controla si el modal de verificacion de firma esta abierto. */
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);

  const topThree = FINALISTS.filter((finalista) => finalista.position <= 3);

  return (
    <div className="flex flex-col w-full">
      {/* Podio */}
      <div className="relative w-full overflow-hidden bg-surface-container-lowest px-gutter py-space-xl">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary-container/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto flex flex-col items-center">
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-surface-variant/80 text-primary font-label-sm text-label-sm tracking-widest uppercase mb-4 shadow-sm">
            <Icon name="emoji_events" filled className="text-[16px]" />
            <span>Gran Final • Temporada 2024</span>
          </div>
          <h1 className="font-display-mobile text-display-mobile md:font-display md:text-display text-center text-on-surface tracking-tight uppercase max-w-4xl">
            Ganadores y <span className="text-primary-container">Podio de Honor</span>
          </h1>
          <p className="font-body-lg text-body-lg text-secondary text-center max-w-2xl mt-2 mb-10">
            Celebración oficial de las obras maestras digitales premiadas en el certamen anual
            ArtClash Pro.
          </p>

          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
            {topThree.map((finalista) => (
              <PodiumCard key={finalista.id} finalist={finalista} />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-12 w-full">
            <button
              type="button"
              onClick={() => setIsVerifyOpen(true)}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-primary-container hover:bg-tertiary-container text-on-primary font-title-md text-title-md font-bold tracking-wider uppercase transition-all duration-200 shadow-[0_0_24px_rgba(255,107,0,0.45)] active:scale-95"
            >
              <Icon name="lock_person" filled className="text-[22px]" />
              <span>Verificar Firma Ciega del Presidente</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de posiciones */}
      <ResultsTable finalists={FINALISTS} />

      <SignatureVerifyModal
        isOpen={isVerifyOpen}
        finalists={FINALISTS}
        publicKey={PRESIDENT_SIGNATURE.publicKey}
        hash={PRESIDENT_SIGNATURE.hash}
        scheme={PRESIDENT_SIGNATURE.scheme}
        onClose={() => setIsVerifyOpen(false)}
      />
    </div>
  );
}
