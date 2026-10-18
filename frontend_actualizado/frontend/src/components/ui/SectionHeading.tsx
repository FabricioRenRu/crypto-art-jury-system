/**
 * components/ui/SectionHeading.tsx
 * Título + subtítulo centrado que se repite al inicio de las secciones
 * de la página de Inicio ("Categorías Oficiales", "Fases del Concurso").
 */
interface SectionHeadingProps {
  title: string;
  subtitle: string;
}

export default function SectionHeading({ title, subtitle }: SectionHeadingProps) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-16">
      <h2 className="font-headline-lg text-headline-lg text-on-surface uppercase tracking-tight">
        {title}
      </h2>
      <p className="font-body-md text-body-md text-secondary mt-3">{subtitle}</p>
    </div>
  );
}
