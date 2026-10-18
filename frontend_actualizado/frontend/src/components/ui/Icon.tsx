/**
 * components/ui/Icon.tsx
 * Componente pequeño para mostrar íconos de Google Material Symbols.
 * Evita repetir <span className="material-symbols-outlined">...</span> en todos lados.
 *
 * Ejemplo: <Icon name="brush" className="text-[20px]" />
 * Con relleno: <Icon name="star" filled />
 */
interface IconProps {
  /** Nombre del ícono en Material Symbols (ej. "lock", "brush", "gavel"). */
  name: string;
  className?: string;
  /** Si es true, el ícono se dibuja relleno (FILL 1) en lugar de contorno. */
  filled?: boolean;
}

export default function Icon({ name, className = '', filled = false }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={filled ? { fontVariationSettings: '"FILL" 1' } : undefined}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
