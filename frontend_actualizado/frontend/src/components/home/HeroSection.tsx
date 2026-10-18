/**
 * components/home/HeroSection.tsx
 * Portada principal de Inicio: etiqueta "Edición Oficial 2025", título grande,
 * descripción y botón "Inscribirse como Pintor".
 */
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import { PATHS } from '../../routes/paths';

export default function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden py-20 md:py-28 bg-surface-container-lowest">
      <div className="max-w-3xl mx-auto px-margin-mobile md:px-margin text-center relative z-10 flex flex-col items-center">
        <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold mb-4 bg-surface-container-high px-4 py-1.5 rounded-full">
          Edición Oficial 2025
        </span>

        <h1 className="font-display text-display-mobile md:text-display tracking-tight text-on-surface mb-6 uppercase leading-tight">
          Desafía tu <span className="text-primary-container inline-block">Imaginación</span> en el
          Lienzo Digital
        </h1>

        <p className="font-body-lg text-body-lg text-secondary max-w-2xl mb-10 leading-relaxed">
          La batalla creativa más prestigiosa del arte digital. Creadores de todo el mundo compiten
          en vivo evaluados por pioneros y directores de arte de la industria.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 w-full sm:w-auto">
          <Link
            to={PATHS.registroPintor}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-container hover:bg-tertiary-container text-on-primary font-title-md text-title-md uppercase tracking-wider rounded transition-all shadow-[0_0_24px_rgba(255,107,0,0.4)]"
          >
            <Icon name="brush" className="text-[20px]" />
            <span>Inscribirse como Pintor</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
