/**
 * components/ui/Icon.tsx
 * Componente pequeño para mostrar íconos de Google Material Symbols.
 * Evita repetir <span className="material-symbols-outlined">...</span> en todos lados.
 *
 * Ejemplo: <Icon name="brush" className="text-[20px]" />
 */
interface IconProps {
  /** Nombre del ícono en Material Symbols (ej. "lock", "brush", "gavel"). */
  name: string;
  className?: string;
}

export default function Icon({ name, className = '' }: IconProps) {
  return (
    <span className={`material-symbols-outlined ${className}`} aria-hidden="true">
      {name}
    </span>
  );
}
