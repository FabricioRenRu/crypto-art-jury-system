/**
 * components/jury/PublicationBanner.tsx
 * Franja con el estado de la firma ciega de las evaluaciones del juez y el botón para
 * publicar las que el presidente ya firmó (pasos 7-9).
 */
import Icon from '../ui/Icon';

interface PublicationBannerProps {
  esperando: number;          // ESPERANDO_FIRMA
  firmadas: number;           // FIRMADO (listas para publicar)
  publicadas: number;         // PUBLICADO
  ultimasPublicadas: number;  // publicadas en el último intento
  isPublishing: boolean;
  error: string | null;
  onPublicar: () => void;
  onRefrescar: () => void;
}

export default function PublicationBanner({
  esperando, firmadas, publicadas, ultimasPublicadas, isPublishing, error, onPublicar, onRefrescar,
}: PublicationBannerProps) {
  if (esperando + firmadas + publicadas === 0) return null;

  return (
    <section className="w-full px-gutter pt-space-lg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-space-md bg-surface-container rounded-xl p-space-md border border-outline-variant/20">
        <div className="flex flex-wrap items-center gap-space-md font-label-md text-label-md uppercase tracking-wider">
          <span className="flex items-center gap-1.5 text-on-surface-variant">
            <Icon name="hourglass_top" className="text-[18px]" /> {esperando} esperando firma
          </span>
          <span className="flex items-center gap-1.5 text-primary">
            <Icon name="approval" className="text-[18px]" /> {firmadas} firmadas por el presidente
          </span>
          <span className="flex items-center gap-1.5 text-on-surface-variant">
            <Icon name="public" className="text-[18px]" /> {publicadas} publicadas
          </span>
        </div>

        <div className="flex items-center gap-space-sm">
          <button
            type="button"
            onClick={onRefrescar}
            disabled={isPublishing}
            className="px-3 py-2 rounded bg-surface-bright text-on-surface font-label-sm text-label-sm uppercase flex items-center gap-1 disabled:opacity-50"
          >
            <Icon name="refresh" className="text-[16px]" /> Actualizar
          </button>
          <button
            type="button"
            onClick={onPublicar}
            disabled={firmadas === 0 || isPublishing}
            className="px-4 py-2 rounded bg-primary-container text-on-primary font-label-md text-label-md uppercase tracking-wider flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name={isPublishing ? 'sync' : 'verified'} className={`text-[18px] ${isPublishing ? 'animate-spin' : ''}`} />
            {isPublishing ? 'Descegando y firmando...' : `Publicar ${firmadas} evaluación(es)`}
          </button>
        </div>
      </div>

      {error && (
        <p className="max-w-7xl mx-auto mt-2 font-body-sm text-body-sm text-error">{error}</p>
      )}
      {!error && ultimasPublicadas > 0 && (
        <p className="max-w-7xl mx-auto mt-2 font-body-sm text-body-sm text-primary">
          Se publicaron {ultimasPublicadas} evaluación(es) con la firma del presidente y la tuya.
        </p>
      )}
    </section>
  );
}