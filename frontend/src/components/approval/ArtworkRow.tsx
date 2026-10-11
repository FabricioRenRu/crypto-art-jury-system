/**
 * components/approval/ArtworkRow.tsx
 * Una fila de la tabla de validación: checkbox, ID anónimo, título, categoría,
 * puntuación y estado. En móvil se apila en una columna con etiquetas visibles.
 */
import Icon from '../ui/Icon';
import type { Artwork } from '../../types';

interface ArtworkRowProps {
  artwork: Artwork;
  /** Si la fila está marcada (viene del hook useArtworkSelection). */
  selected: boolean;
  /** Se llama al hacer clic en el checkbox. */
  onToggle: (id: string) => void;
}

export default function ArtworkRow({ artwork, selected, onToggle }: ArtworkRowProps) {
  return (
    <div className="hover:bg-surface-bright/50 transition-colors p-space-md grid grid-cols-1 lg:grid-cols-12 gap-space-sm items-center">
      {/* Checkbox personalizado */}
      <div className="col-span-1 flex items-center justify-between lg:justify-center">
        <span className="font-label-sm text-label-sm text-on-surface-variant lg:hidden">Selección</span>
        <label className="relative flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggle(artwork.id)}
            aria-label={`Seleccionar ${artwork.title}`}
            className="peer h-5 w-5 rounded bg-surface-container-lowest checked:bg-primary-container cursor-pointer appearance-none transition-all"
          />
          <Icon
            name="done"
            className="absolute pointer-events-none text-on-primary text-[18px] opacity-0 peer-checked:opacity-100 left-0.5 top-0.5"
          />
        </label>
      </div>

      {/* ID anónimo */}
      <div className="col-span-2 flex items-center gap-1.5">
        <span className="px-2.5 py-1 bg-surface-container-lowest text-primary font-mono text-label-md rounded font-bold uppercase tracking-wider">
          {artwork.id}
        </span>
        <Icon name="lock" className="text-[16px] text-on-surface-variant" />
      </div>

      {/* Título */}
      <div className="col-span-4">
        <span className="font-title-lg text-title-lg text-on-surface block">{artwork.title}</span>
      </div>

      {/* Categoría */}
      <div className="col-span-2">
        <span className="px-2.5 py-1 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase">
          {artwork.category}
        </span>
      </div>

      {/* Puntuación */}
      <div className="col-span-1 flex items-center justify-start lg:justify-center">
        <div className="flex items-baseline gap-1 bg-surface-container-lowest px-2.5 py-1 rounded">
          <span className="font-headline-sm text-headline-sm text-primary">{artwork.score.toFixed(1)}</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">/10</span>
        </div>
      </div>

      {/* Estado */}
      <div className="col-span-2 flex items-center justify-between lg:justify-end gap-1.5">
        <span className="font-label-sm text-label-sm text-on-surface-variant lg:hidden">Estado:</span>
        <span className="px-2.5 py-1 rounded bg-primary-container/10 font-label-sm text-label-sm text-primary uppercase flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
          {artwork.status}
        </span>
      </div>
    </div>
  );
}
