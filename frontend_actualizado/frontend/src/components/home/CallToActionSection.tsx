/**
 * components/home/CallToActionSection.tsx
 * Sección final de Inicio: "Participa en la Convocatoria" con botón "Ver Criterios".
 */
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import { PATHS } from '../../routes/paths';

export default function CallToActionSection() {
  return (
    <section className="w-full py-20 md:py-28 bg-surface-container-lowest border-t border-outline-variant/20">
      <div className="max-w-3xl mx-auto px-margin-mobile md:px-margin text-center flex flex-col items-center">
        <h2 className="font-display text-display-mobile md:text-headline-lg text-on-surface uppercase mb-4">
          Participa en la Convocatoria
        </h2>
        <p className="font-body-lg text-body-lg text-secondary max-w-xl mb-8 leading-relaxed">
          Inscríbete hoy y presenta tu obra ante una comunidad internacional de creadores y jueces de
          la industria.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 w-full sm:w-auto">
          <Link
            to={PATHS.evaluacionJurado}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-surface-container hover:bg-surface-bright text-on-surface border border-outline-variant/20 font-title-md text-title-md uppercase tracking-wider rounded transition-all"
          >
            <Icon name="gavel" className="text-[20px] text-primary" />
            <span>Ver Criterios</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
