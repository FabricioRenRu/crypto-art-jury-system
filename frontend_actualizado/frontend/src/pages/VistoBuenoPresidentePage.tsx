/**
 * pages/VistoBuenoPresidentePage.tsx
 * Página "Validación y Visto Bueno Oficial"
 */
import { useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import ArtworkTable from '../components/approval/ArtworkTable';
import SignatureModal from '../components/approval/SignatureModal';
import PanelCriptografico from '../components/crypto/PanelCriptografico';
import { usePresidentApproval } from '../hooks/usePresidentApproval';
import { PATHS } from '../routes/paths';

export default function VistoBuenoPresidentePage() {
  const navigate = useNavigate();
  
  // 🔥 Consumimos el custom hook
  const {
    evaluacionesPendientes,
    isLoading,
    isModalOpen,
    isPublished,
    isSigning,
    selection,
    openModal,
    closeModal,
    confirmSignature,
    llaveRsa,
    evidenciaFirma,
  } = usePresidentApproval();

  const total = evaluacionesPendientes.length;
  const hasSelection = selection.selectedCount > 0;

  const goToResults = () => {
    closeModal();
    navigate(PATHS.resultados);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Icon name="lock" className="text-primary text-4xl animate-pulse" />
        <p className="text-on-surface-variant">Cargando bandeja segura...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <div className="relative w-full max-w-5xl mx-auto px-gutter py-space-xl flex flex-col gap-space-lg">
        
        {/* Encabezado */}
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
              Revisión final de obras antes de proclamación de resultados. Toda información de identidad permanece reservada.
            </p>
          </div>

          <div className="flex items-center gap-space-sm">
            <button
              onClick={selection.toggleAll}
              className="px-4 py-2 bg-surface-container hover:bg-surface-bright rounded-lg font-label-sm text-label-sm text-on-surface uppercase transition-colors flex items-center gap-1.5"
            >
              <Icon name={selection.allSelected ? 'deselect' : 'select_all'} className="text-[18px] text-primary" />
              <span>{selection.allSelected ? 'Desmarcar Todos' : 'Marcar Todos'}</span>
            </button>
          </div>
        </div>

        {/* Tabla de obras dinámica */}
        <ArtworkTable 
          artworks={evaluacionesPendientes} 
          isSelected={selection.isSelected} 
          onToggle={selection.toggleOne} 
        />

        {/* Botón de firma */}
        <div className="w-full flex flex-col items-center justify-center pt-space-sm gap-space-sm">
          <button
            onClick={openModal}
            disabled={!hasSelection}
            className="w-full max-w-xl py-4 px-space-lg bg-primary-container hover:bg-tertiary-container text-white font-title-lg text-title-lg uppercase tracking-wider rounded-xl shadow-[0_0_36px_rgba(255,107,0,0.45)] hover:shadow-[0_0_48px_rgba(255,107,0,0.65)] transition-all flex items-center justify-center gap-space-sm transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none"
          >
            <Icon name="approval" className="text-[26px]" />
            <span className="text-center font-bold">Firmar Visto Bueno y Publicar Resultados</span>
          </button>
          <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
            <Icon name="lock" className="text-[16px] text-primary" />
            <span>
              {selection.selectedCount} de {total} obras seleccionadas
            </span>
          </div>
        </div>

        <PanelCriptografico titulo="Firmas ciegas emitidas: s' = h'^d mod n" secciones={evidenciaFirma} abierto />
        <PanelCriptografico titulo="Tu llave privada RSA: primos p, q y exponentes" secciones={llaveRsa} />

      </div>

      <SignatureModal
        isOpen={isModalOpen}
        isPublished={isPublished}
        selectedCount={selection.selectedCount}
        isSigning={isSigning}
        onClose={closeModal}
        onConfirm={confirmSignature}
        onAccept={goToResults}
      />
    </div>
  );
}