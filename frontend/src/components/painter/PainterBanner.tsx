/**
 * components/painter/PainterBanner.tsx
 * Franja superior del panel: avatar, nombre del pintor y botón "Subir Nueva Pintura".
 * (Sección "Profile & Quota Header Banner" del HTML original.)
 */
import Icon from '../ui/Icon';

interface PainterBannerProps {
  nombre: string;
  avatarUrl: string;
  onSubir: () => void;
}

export default function PainterBanner({ nombre, avatarUrl, onSubir }: PainterBannerProps) {
  return (
    <section className="w-full bg-surface-container-low px-gutter py-space-lg relative overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md relative z-10">
        <div className="flex items-center gap-space-md">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-xl bg-cover bg-center ring-2 ring-primary-container/60 shadow-lg"
              style={{ backgroundImage: `url("${avatarUrl}")` }}
            />
            <span className="absolute -bottom-1 -right-1 bg-surface-container-highest text-primary font-label-sm text-label-sm px-1 py-0.5 rounded shadow flex items-center gap-0.5">
              <Icon name="verified" className="text-[14px]" />
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-space-xs flex-wrap">
              <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                {nombre}
              </h1>
              <span className="bg-primary-container/15 text-primary font-label-sm text-label-sm px-2 py-0.5 rounded uppercase tracking-wider font-semibold">
                Artista Verificado
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-secondary mt-0.5">
              Torneo Internacional ArtClash Pro 2024
            </p>
          </div>
        </div>

        <div className="flex items-center gap-space-md shrink-0 w-full md:w-auto justify-end">
          <button
            onClick={onSubir}
            className="inline-flex items-center justify-center gap-space-xs px-6 py-3 bg-primary-container hover:bg-tertiary-container text-on-primary font-label-md text-label-md uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(255,107,0,0.35)] font-bold cursor-pointer"
          >
            <Icon name="add" className="text-[20px]" />
            <span>Subir Nueva Pintura</span>
          </button>
        </div>
      </div>
    </section>
  );
}
