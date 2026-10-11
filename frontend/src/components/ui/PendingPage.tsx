/**
 * components/ui/PendingPage.tsx
 * Plantilla temporal para las páginas cuyo HTML original llegó vacío.
 * Muestra el título de la sección y un aviso de "en construcción".
 * Cuando tengan el diseño, se reemplaza el contenido de la página correspondiente en pages/.
 */
import Icon from './Icon';

interface PendingPageProps {
  title: string;
  description: string;
  icon: string;
}

export default function PendingPage({ title, description, icon }: PendingPageProps) {
  return (
    <div className="w-full max-w-3xl mx-auto px-gutter py-20 flex flex-col items-center text-center gap-space-md">
      <div className="w-16 h-16 rounded-xl bg-primary-container/15 flex items-center justify-center text-primary-container">
        <Icon name={icon} className="text-[36px]" />
      </div>
      <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface tracking-tight">
        {title}
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">{description}</p>
      <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary bg-surface-container px-3 py-1 rounded-full">
        Sección en construcción
      </span>
    </div>
  );
}
