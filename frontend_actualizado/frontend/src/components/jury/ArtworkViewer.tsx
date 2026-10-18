/**
 * components/jury/ArtworkViewer.tsx
 * Visor de la obra anonima con acercar, alejar y pantalla completa.
 * La pagina le pasa key={artwork.id}, asi el zoom se reinicia al cambiar de obra.
 */
import { useRef, useState } from 'react';
import Icon from '../ui/Icon';
import type { JuryArtwork } from '../../types';

interface ArtworkViewerProps {
  artwork: JuryArtwork;
}

const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.5;

const toolButton =
  'w-8 h-8 rounded flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-bright transition-colors';

export default function ArtworkViewer({ artwork }: ArtworkViewerProps) {
  /** STATE: nivel de zoom de la imagen. */
  const [zoom, setZoom] = useState(ZOOM_MIN);

  /** Referencia al contenedor para pedirle pantalla completa al navegador. */
  const frameRef = useRef<HTMLDivElement>(null);

  const zoomIn = () => setZoom((actual) => Math.min(actual + ZOOM_STEP, ZOOM_MAX));
  const zoomOut = () => setZoom((actual) => Math.max(actual - ZOOM_STEP, ZOOM_MIN));

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }
    frameRef.current?.requestFullscreen();
  };

  return (
    <div className="lg:col-span-7 flex flex-col gap-space-md">
      <div className="flex items-center justify-between bg-surface-container px-space-md py-space-sm rounded-lg">
        <div className="flex items-center gap-space-sm">
          <Icon name="palette" className="text-primary text-[20px]" />
          <div>
            <h2 className="font-title-lg text-title-lg text-on-surface">{artwork.title}</h2>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Código Anónimo: {artwork.id}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" title="Acercar" onClick={zoomIn} disabled={zoom >= ZOOM_MAX} className={`${toolButton} disabled:opacity-40`}>
            <Icon name="zoom_in" className="text-[20px]" />
          </button>
          <button type="button" title="Alejar" onClick={zoomOut} disabled={zoom <= ZOOM_MIN} className={`${toolButton} disabled:opacity-40`}>
            <Icon name="zoom_out" className="text-[20px]" />
          </button>
          <button
            type="button"
            title="Pantalla Completa"
            onClick={toggleFullscreen}
            className="flex items-center gap-1 text-on-surface-variant hover:text-primary font-label-sm text-label-sm uppercase tracking-wider py-1 px-2 rounded hover:bg-surface-bright transition-colors"
          >
            <Icon name="fullscreen" className="text-[18px]" />
            <span className="hidden sm:inline">Pantalla Completa</span>
          </button>
        </div>
      </div>

      <div className="relative bg-surface-container-lowest rounded-xl overflow-hidden shadow-2xl flex flex-col border border-outline-variant/20">
        <div
          ref={frameRef}
          className="relative w-full aspect-[16/10] overflow-hidden flex items-center justify-center bg-[#0d0d0d]"
        >
          <img
            alt={artwork.title}
            className="w-full h-full object-cover transition-transform duration-300"
            style={{ transform: `scale(${zoom})` }}
            src={artwork.imageUrl}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm px-1">
        <span>Lienzo Digital 8192 × 4608 px</span>
        <span>· Verificado 100% Humano</span>
      </div>
    </div>
  );
}
