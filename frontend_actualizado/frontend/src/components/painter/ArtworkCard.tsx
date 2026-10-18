/**
 * components/painter/ArtworkCard.tsx
 * Tarjeta de una obra del pintor: imagen, estado, titulo, descripcion y acciones.
 */
import Icon from '../ui/Icon';
import type { PainterArtwork } from '../../types';

interface ArtworkCardProps {
  artwork: PainterArtwork;
}

const actionButton =
  'px-3.5 py-1.5 bg-surface-container hover:bg-surface-bright text-on-surface font-label-sm text-label-sm rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer';

export default function ArtworkCard({ artwork }: ArtworkCardProps) {
  const slot = String(artwork.slot).padStart(2, '0');
  const total = String(artwork.totalSlots).padStart(2, '0');

  return (
    <div className="bg-surface-container-high rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl flex flex-col group">
      <div className="relative w-full h-96 overflow-hidden bg-surface-container-lowest">
        <div
          className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url("${artwork.imageUrl}")` }}
        />
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 rounded-full shadow">
          <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
          <span className="font-label-sm text-label-sm font-semibold text-tertiary uppercase tracking-wider">
            {artwork.status}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col justify-between flex-1 gap-space-md">
        <div className="flex flex-col gap-1">
          <span className="text-secondary font-label-sm text-label-sm">
            Slot {slot} de {total}
          </span>
          <h3 className="font-title-lg text-title-lg text-on-surface font-bold">{artwork.title}</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mt-1">
            {artwork.description}
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20">
          <button type="button" className={actionButton}>
            <Icon name="visibility" className="text-[16px]" />
            Ver detalles
          </button>
          <button type="button" className={actionButton}>
            <Icon name="edit" className="text-[16px]" />
            Editar
          </button>
        </div>
      </div>
    </div>
  );
}
