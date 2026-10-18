/**
 * components/approval/ArtworkTable.tsx
 * Tabla de obras en revisión anónima. Pinta la cabecera de columnas (solo en pantallas grandes)
 * y una <ArtworkRow> por cada obra. No guarda estado propio: lo recibe por props.
 */
import Icon from '../ui/Icon';
import ArtworkRow from './ArtworkRow';
import type { Artwork } from '../../types';

interface ArtworkTableProps {
  artworks: Artwork[];
  isSelected: (id: string) => boolean;
  onToggle: (id: string) => void;
}

export default function ArtworkTable({ artworks, isSelected, onToggle }: ArtworkTableProps) {
  return (
    <div className="w-full rounded-xl bg-surface-container border border-outline-variant/20 overflow-hidden shadow-xl">
      {/* Cabecera de columnas (oculta en móvil) */}
      <div className="hidden lg:grid grid-cols-12 gap-space-sm px-space-md py-space-sm bg-surface-container-high font-label-md text-label-md text-on-surface-variant uppercase tracking-wider items-center">
        <div className="col-span-1 flex items-center justify-center">
          <Icon name="check_box" className="text-[18px]" />
        </div>
        <div className="col-span-2">ID Anónimo</div>
        <div className="col-span-4">Título de la Obra</div>
        <div className="col-span-2">Categoría</div>
        <div className="col-span-1 text-center">Puntuación</div>
        <div className="col-span-2 text-right">Estado</div>
      </div>

      <div className="divide-y divide-outline-variant/20">
        {artworks.map((artwork) => (
          <ArtworkRow
            key={artwork.id}
            artwork={artwork}
            selected={isSelected(artwork.id)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}
