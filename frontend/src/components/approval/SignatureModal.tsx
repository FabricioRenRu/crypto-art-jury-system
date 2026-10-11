/**
 * components/approval/SignatureModal.tsx
 * Ventana modal de "Confirmación de Firma". Tiene dos vistas:
 *  1. Confirmación: botones "Cancelar" y "Confirmar y Publicar".
 *  2. Éxito: "¡Resultados Publicados!" con botón "Aceptar".
 *
 * Reemplaza openSignatureModal(), closeSignatureModal() y executeDigitalSeal()
 * del HTML original, que mostraban/ocultaban elementos con classList.
 * El componente es "controlado": quien lo usa decide si está abierto y si ya se publicó.
 */
import { useEffect } from 'react';
import Icon from '../ui/Icon';

interface SignatureModalProps {
  /** Si el modal se muestra o no. */
  isOpen: boolean;
  /** true después de confirmar: cambia a la vista de éxito. */
  isPublished: boolean;
  /** Cuántas obras se van a firmar (se muestra en el texto). */
  selectedCount: number;
  onClose: () => void;
  onConfirm: () => void;
  /** Se llama al pulsar "Aceptar" en la vista de éxito. */
  onAccept: () => void;
}

export default function SignatureModal({
  isOpen,
  isPublished,
  selectedCount,
  onClose,
  onConfirm,
  onAccept,
}: SignatureModalProps) {
  /**
   * EFFECT: cerrar con la tecla Escape mientras el modal está abierto
   * (solo en la vista de confirmación). Se quita el listener al cerrar.
   */
  useEffect(() => {
    if (!isOpen || isPublished) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, isPublished, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-gutter"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signature-modal-title"
    >
      <div className="relative w-full max-w-lg bg-surface-container-high rounded-xl p-space-lg shadow-2xl flex flex-col gap-space-md">
        {isPublished ? (
          /* Vista 2: éxito */
          <div className="flex flex-col items-center justify-center text-center gap-space-md py-space-md">
            <div className="w-14 h-14 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container">
              <Icon name="check_circle" className="text-[36px]" />
            </div>
            <div className="flex flex-col items-center">
              <h4 id="signature-modal-title" className="font-headline-sm text-headline-sm text-on-surface">
                ¡Resultados Publicados!
              </h4>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mt-1">
                El visto bueno ha sido registrado exitosamente. Las puntuaciones finales ya se
                encuentran disponibles en la sección de Podio.
              </p>
            </div>
            <button
              onClick={onAccept}
              className="px-6 py-2.5 rounded-lg bg-primary-container text-white font-label-md text-label-md uppercase tracking-wider"
            >
              Aceptar
            </button>
          </div>
        ) : (
          /* Vista 1: confirmación */
          <>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary-container">
                  <Icon name="verified" className="text-[24px]" />
                </div>
                <div className="flex flex-col">
                  <h3 id="signature-modal-title" className="font-headline-sm text-headline-sm text-on-surface">
                    Confirmación de Firma
                  </h3>
                  <span className="font-label-sm text-label-sm text-primary uppercase">
                    Visto Bueno del Presidente
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="w-8 h-8 rounded hover:bg-surface-bright flex items-center justify-center text-on-surface-variant hover:text-on-surface"
              >
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>

            <p className="text-on-surface-variant font-body-md text-body-md">
              Al confirmar, se registrará formalmente el visto bueno sobre las{' '}
              <strong className="text-on-surface">{selectedCount}</strong> obras seleccionadas y los
              resultados pasarán al podio oficial.
            </p>

            <div className="flex items-center justify-end gap-space-sm pt-space-xs">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-bright text-on-surface font-label-md text-label-md uppercase transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className="px-6 py-2 rounded-lg bg-primary-container hover:bg-tertiary-container text-white font-label-md text-label-md uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,107,0,0.4)] flex items-center gap-2"
              >
                <Icon name="done_all" className="text-[18px]" />
                <span>Confirmar y Publicar</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
