/**
 * pages/PanelPintorPage.tsx
 * Página "Panel del Pintor" (migrada de Interfaces/PanelPintor).
 *
 * Muestra el perfil del pintor, sus obras en competencia y un modal
 * para subir una nueva pintura. Los datos vienen del backend (hook usePainterPanel):
 * el cifrado AES-256-GCM, la firma ECDSA del consentimiento y los sobres de llave
 * los hace el servidor al recibir la obra.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import ArtworkCard from '../components/painter/ArtworkCard';
import UploadArtworkModal from '../components/painter/UploadArtworkModal';
import { usePainterPanel } from '../hooks/usePainterPanel';
import { PATHS } from '../routes/paths';

export default function PanelPintorPage() {
  /** STATE: controla si el modal de subida esta abierto. */
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const navigate = useNavigate();
  const { profile, artworks, totalSlots, error, uploadArtwork } = usePainterPanel();

  /** Sin JWT no hay panel: se manda al inicio de sesión. */
  useEffect(() => {
    if (!sessionStorage.getItem('access_token')) {
      navigate(PATHS.sesion);
    }
  }, [navigate]);

  const nextSlot = Math.min(artworks.length + 1, totalSlots);
  const slotLabel = `Slot ${String(nextSlot).padStart(2, '0')} de ${String(totalSlots).padStart(2, '0')}`;

  return (
    <div className="flex flex-col w-full">
      {/* Banner de perfil */}
      <section className="w-full bg-surface-container-low px-gutter py-space-lg relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md relative z-10">
          <div className="flex items-center gap-space-md">
            <div className="relative">
              <div
                className="w-16 h-16 rounded-xl bg-cover bg-center ring-2 ring-primary-container/60 shadow-lg"
                style={{ backgroundImage: `url("${profile.avatarUrl}")` }}
              />
              <span className="absolute -bottom-1 -right-1 bg-surface-container-highest text-primary px-1 py-0.5 rounded shadow flex items-center gap-0.5">
                <Icon name="verified" className="text-[14px]" />
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs flex-wrap">
                <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                  {profile.name}
                </h1>
                <span className="bg-primary-container/15 text-primary font-label-sm text-label-sm px-2 py-0.5 rounded uppercase tracking-wider font-semibold">
                  Artista Verificado
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-secondary mt-0.5">
                {profile.tournament}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-space-md shrink-0 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center justify-center gap-space-xs px-6 py-3 bg-primary-container hover:bg-tertiary-container text-on-primary font-label-md text-label-md uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(255,107,0,0.35)] font-bold cursor-pointer"
            >
              <Icon name="add" className="text-[20px]" />
              <span>Subir Nueva Pintura</span>
            </button>
          </div>
        </div>
      </section>

      {/* Obras en competencia */}
      <div className="max-w-7xl mx-auto w-full px-gutter py-space-xl">
        <div className="flex flex-col gap-space-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pb-2">
            <div className="flex items-center gap-space-xs">
              <Icon name="gallery_thumbnail" className="text-primary text-[24px]" />
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Mis Obras en Competencia
              </h2>
            </div>
            <div className="flex items-center gap-space-sm bg-surface-container-high px-4 py-2 rounded-lg text-secondary font-label-sm text-label-sm">
              <Icon name="info" className="text-primary text-[18px]" />
              <span>Requisitos clave: Mín. 4000x3000px (300 DPI) • Sin marcas de agua</span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-space-sm p-space-sm rounded-lg bg-error-container text-on-error-container font-body-md text-body-md">
              <Icon name="error" className="text-[20px]" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
            {artworks.map((obra) => (
              <ArtworkCard key={obra.id} artwork={obra} />
            ))}
          </div>
        </div>
      </div>

      <UploadArtworkModal
        isOpen={isUploadOpen}
        slotLabel={slotLabel}
        onClose={() => setIsUploadOpen(false)}
        onSubmit={uploadArtwork}
      />
    </div>
  );
}
