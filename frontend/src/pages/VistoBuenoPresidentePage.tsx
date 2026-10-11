/**
 * pages/VistoBuenoPresidentePage.tsx
 * Página "Validación y Visto Bueno Oficial" (migrada de visto-bueno-presidente.html).
 *
 * El presidente revisa las obras de forma anónima, marca cuáles aprueba,
 * firma el visto bueno en un modal y los resultados se publican en el podio.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import ArtworkTable from '../components/approval/ArtworkTable';
import SignatureModal from '../components/approval/SignatureModal';
import { useArtworkSelection } from '../hooks/useArtworkSelection';
import { ARTWORKS_FOR_APPROVAL } from '../data/artworks';
import { PATHS } from '../routes/paths';

export default function VistoBuenoPresidentePage() {
  /** HOOK: maneja los checkboxes (qué obras están seleccionadas, marcar/desmarcar todas). */
  const { selectedCount, allSelected, toggleOne, toggleAll, isSelected } =
    useArtworkSelection(ARTWORKS_FOR_APPROVAL);

  /** STATE: controla si el modal de firma está abierto o cerrado. */
  const [isModalOpen, setIsModalOpen] = useState(false);

  /** STATE: true cuando ya se confirmó la firma; el modal cambia a la vista de éxito. */
  const [isPublished, setIsPublished] = useState(false);

  /** HOOK de React Router: para redirigir a Resultados al pulsar "Aceptar". */
  const navigate = useNavigate();

  const total = ARTWORKS_FOR_APPROVAL.length;
  const hasSelection = selectedCount > 0;

  /** Cierra el modal y lo regresa a su estado inicial. */
  const closeModal = () => {
    setIsModalOpen(false);
    setIsPublished(false);
  };

  /**
   * Confirma la firma. Aquí es donde, con backend, se mandaría
   * la lista de obras seleccionadas a la API antes de marcar como publicado.
   */
  const confirmSignature = () => {
    setIsPublished(true);
  };

  /** "Aceptar" en la vista de éxito: cierra y lleva al podio (antes hacía window.location.reload()). */
  const goToResults = () => {
    closeModal();
    navigate(PATHS.resultados);
  };

  return (
    <div className="flex flex-col w-full">
      <div className="relative w-full max-w-5xl mx-auto px-gutter py-space-xl flex flex-col gap-space-lg">
        {/* Encabezado de la página */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md border-b border-outline-variant/20 pb-space-lg">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-primary uppercase tracking-wider mb-2">
              <Icon name="visibility_off" className="text-[16px]" />
              <span>Evaluación Anónima Garantizada</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Validación y Visto Bueno Oficial
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1 max-w-2xl">
              Revisión final de obras antes de proclamación de resultados. Toda información de
              identidad permanece reservada.
            </p>
          </div>

          <div className="flex items-center gap-space-sm">
            <button
              onClick={toggleAll}
              className="px-4 py-2 bg-surface-container hover:bg-surface-bright rounded-lg font-label-sm text-label-sm text-on-surface uppercase transition-colors flex items-center gap-1.5"
            >
              <Icon name={allSelected ? 'deselect' : 'select_all'} className="text-[18px] text-primary" />
              <span>{allSelected ? 'Desmarcar Todos' : 'Marcar Todos'}</span>
            </button>
          </div>
        </div>

        {/* Tabla de obras */}
        <ArtworkTable artworks={ARTWORKS_FOR_APPROVAL} isSelected={isSelected} onToggle={toggleOne} />

        {/* Botón de firma + contador */}
        <div className="w-full flex flex-col items-center justify-center pt-space-sm gap-space-sm">
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={!hasSelection}
            className="w-full max-w-xl py-4 px-space-lg bg-primary-container hover:bg-tertiary-container text-white font-title-lg text-title-lg uppercase tracking-wider rounded-xl shadow-[0_0_36px_rgba(255,107,0,0.45)] hover:shadow-[0_0_48px_rgba(255,107,0,0.65)] transition-all flex items-center justify-center gap-space-sm transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none"
          >
            <Icon name="approval" className="text-[26px]" />
            <span className="text-center font-bold">Firmar Visto Bueno y Publicar Resultados</span>
          </button>
          <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
            <Icon name="lock" className="text-[16px] text-primary" />
            <span>
              {selectedCount} de {total} obras seleccionadas
            </span>
          </div>
        </div>
      </div>

      <SignatureModal
        isOpen={isModalOpen}
        isPublished={isPublished}
        selectedCount={selectedCount}
        onClose={closeModal}
        onConfirm={confirmSignature}
        onAccept={goToResults}
      />
    </div>
  );
}
