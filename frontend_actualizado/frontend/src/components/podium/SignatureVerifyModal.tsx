/**
 * components/podium/SignatureVerifyModal.tsx
 * Modal de verificacion de la firma ciega del presidente: elegir obra,
 * copiar la llave publica y comprobar la firma (simulado por ahora).
 *
 * Al cerrarse se reinicia el resultado de la verificacion.
 */
import { useState } from 'react';
import Icon from '../ui/Icon';
import type { Finalist } from '../../types';

interface SignatureVerifyModalProps {
  isOpen: boolean;
  finalists: Finalist[];
  publicKey: string;
  hash: string;
  scheme: string;
  onClose: () => void;
}

/** Texto de puesto para las opciones del selector: 1er, 2º, 3er, 4º... */
function positionLabel(position: number): string {
  if (position === 1 || position === 3) {
    return `${position}er Puesto`;
  }
  return `${position}º Puesto`;
}

export default function SignatureVerifyModal({
  isOpen,
  finalists,
  publicKey,
  hash,
  scheme,
  onClose,
}: SignatureVerifyModalProps) {
  /** STATE: obra elegida para auditar. */
  const [selectedId, setSelectedId] = useState(finalists[0]?.id ?? '');

  /** STATE: true cuando ya se pulso "Verificar Firma Ciega". */
  const [isVerified, setIsVerified] = useState(false);

  /** STATE: true unos segundos despues de copiar la llave. */
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    setIsVerified(false);
    setIsCopied(false);
    onClose();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicKey);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('No se pudo copiar la llave:', error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={handleClose}
    >
      <div
        className="bg-surface-container-highest max-w-2xl w-full rounded-xl shadow-2xl p-6 relative border border-outline-variant/30"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Verificacion de firma ciega"
      >
        <button
          type="button"
          aria-label="Cerrar"
          onClick={handleClose}
          className="absolute top-5 right-5 text-secondary hover:text-on-surface p-1 rounded-full hover:bg-surface-variant transition-colors"
        >
          <Icon name="close" className="text-[24px]" />
        </button>

        <div className="flex items-center gap-2 text-primary font-label-sm text-label-sm uppercase tracking-wider mb-2">
          <Icon name="verified_user" filled className="text-[18px]" />
          <span>Protocolo Criptográfico Zero-Knowledge</span>
        </div>
        <h3 className="font-headline-md text-headline-md text-on-surface">
          Verificación de Firma a Ciegas del Presidente
        </h3>
        <p className="font-body-md text-body-md text-secondary mb-6">
          Comprobación criptográfica de validación sin revelación previa. El presidente ratificó los
          baremos de forma ciega y anónima antes de conocer las identidades de las obras.
        </p>

        <div className="flex flex-col gap-4 mb-6">
          {/* Selector de obra */}
          <div className="bg-surface-container p-4 rounded-lg flex flex-col gap-2">
            <label
              htmlFor="obra-auditoria"
              className="font-label-sm text-label-sm uppercase text-secondary font-medium"
            >
              Seleccionar Obra para Auditoría
            </label>
            <select
              id="obra-auditoria"
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                setIsVerified(false);
              }}
              className="w-full bg-surface-variant text-on-surface rounded p-2.5 font-body-md text-body-md border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary-container"
            >
              {finalists.map((finalista) => (
                <option key={finalista.id} value={finalista.id}>
                  [{finalista.id}] {finalista.title} ({positionLabel(finalista.position)})
                </option>
              ))}
            </select>
          </div>

          {/* Llave publica */}
          <div className="bg-surface-container p-4 rounded-lg flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase text-secondary font-medium">
                Llave Pública del Presidente
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-primary hover:text-on-surface font-label-sm text-label-sm flex items-center gap-1"
              >
                <Icon name={isCopied ? 'check' : 'content_copy'} className="text-[14px]" />
                {isCopied ? 'Copiada' : 'Copiar'}
              </button>
            </div>
            <input
              type="text"
              readOnly
              value={publicKey}
              className="w-full bg-surface-variant text-on-surface font-label-md text-label-md rounded p-2.5 border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary-container"
            />
          </div>

          {/* Hash */}
          <div className="p-4 rounded-lg bg-surface-container-low border border-primary/20 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase text-secondary">
                Hash de Ratificación Ciega (ECDSA-SHA256)
              </span>
              <span className="font-label-sm text-label-sm text-primary font-bold">{scheme}</span>
            </div>
            <p className="font-label-sm text-label-sm text-on-surface-variant font-mono break-all">{hash}</p>
          </div>

          {/* Resultado */}
          {isVerified && (
            <div className="p-4 rounded-lg bg-primary-container/15 border border-primary-container text-on-surface flex items-center gap-3">
              <Icon name="check_circle" filled className="text-[24px] text-primary-container" />
              <div>
                <div className="font-title-md text-title-md font-bold text-primary">
                  Firma Ciega Válida y Auténtica, Hash Verificado
                </div>
                <div className="font-body-sm text-body-sm text-secondary">
                  Certificado emitido sin descifrado previo de metadata artística. Conforme a las
                  normas del certamen.
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded text-secondary hover:text-on-surface font-label-md text-label-md uppercase transition-colors"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => setIsVerified(true)}
            className="w-full sm:w-auto px-6 py-2.5 rounded bg-primary-container hover:bg-tertiary-container text-on-primary font-label-md text-label-md uppercase tracking-wider font-bold flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(255,107,0,0.35)] transition-all"
          >
            <Icon name="key" filled className="text-[18px]" />
            <span>Verificar Firma Ciega</span>
          </button>
        </div>
      </div>
    </div>
  );
}
