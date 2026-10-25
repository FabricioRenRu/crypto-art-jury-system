/**
 * components/painter/ArtworkCard.tsx
 * Tarjeta del "Slot 01 de 01": la obra del pintor, o un espacio vacío si aún no sube ninguna.
 * (Tarjeta de "Mis Obras en Competencia" del HTML original.)
 */
import Icon from '../ui/Icon';
import type { ObraCifrada } from '../../types/painterPanel';

interface ArtworkCardProps {
  obra: ObraCifrada | null;
  onSubir: () => void;
  onVerDetalles: () => void;
}

const botonTarjeta =
  'px-3.5 py-1.5 bg-surface-container hover:bg-surface-bright text-on-surface font-label-sm text-label-sm rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer';

export default function ArtworkCard({ obra, onSubir, onVerDetalles }: ArtworkCardProps) {
  if (!obra) {
    return (
      <div className="bg-surface-container-high rounded-xl overflow-hidden shadow-lg flex flex-col">
        <div className="w-full h-96 bg-surface-container-lowest flex flex-col items-center justify-center gap-space-sm text-center p-space-lg">
          <Icon name="add_photo_alternate" className="text-[48px] text-outline" />
          <span className="font-title-md text-title-md text-on-surface">Slot vacío</span>
          <span className="font-body-sm text-body-sm text-secondary max-w-[240px]">
            Sube tu pintura: se cifrará con AES-256-GCM y se firmará tu consentimiento antes de salir del
            navegador.
          </span>
        </div>
        <div className="p-5 flex items-center justify-between gap-space-md">
          <span className="font-label-sm text-label-sm text-secondary">Slot 01 de 01</span>
          <button onClick={onSubir} className={botonTarjeta}>
            <Icon name="upload" className="text-[16px]" />
            Subir obra
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-high rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl flex flex-col group">
      <div className="relative w-full h-96 overflow-hidden bg-surface-container-lowest">
        <div
          className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url("${obra.previewUrl}")` }}
        />
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 rounded-full shadow">
          <Icon name="lock" className="text-[14px] text-tertiary" />
          <span className="font-label-sm text-label-sm font-semibold text-tertiary uppercase tracking-wider">
            Cifrada y firmada
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col justify-between flex-1 gap-space-md">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-secondary font-label-sm text-label-sm">
            <span>Slot 01 de 01</span>
          </div>
          <h3 className="font-title-lg text-title-lg text-on-surface font-bold">{obra.titulo}</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mt-1">
            {obra.descripcion}
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20">
          <button onClick={onVerDetalles} className={botonTarjeta}>
            <Icon name="visibility" className="text-[16px]" />
            Ver detalles
          </button>
          <button onClick={onSubir} className={botonTarjeta}>
            <Icon name="edit" className="text-[16px]" />
            Editar
          </button>
        </div>
      </div>
    </div>
  );
}
