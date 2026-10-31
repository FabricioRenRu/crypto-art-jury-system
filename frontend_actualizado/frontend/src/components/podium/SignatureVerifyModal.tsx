/**
 * components/podium/SignatureVerifyModal.tsx
 * Zona de Verificación Pública (paso 10). El usuario elige una evaluación publicada y el worker
 * comprueba, sin ninguna llave privada:
 *   - firma ciega del presidente: s^e mod n == FDH-SHA256(evaluación)
 *   - firma RSA-PSS del juez sobre la misma evaluación
 * Al cerrarse se reinicia el resultado.
 */
import { useState } from 'react';
import Icon from '../ui/Icon';
import { useCryptoWorker } from '../../hooks/useCryptoWorker';
import { Acciones } from '../../workers/crypto.actions';
import type { EvaluacionPublica, ObraPublica, ResultadoVerificacion } from '../../types/evaluacion';

interface SignatureVerifyModalProps {
  isOpen: boolean;
  obras: ObraPublica[];
  llavePresidente: string;
  onClose: () => void;
}

/** Recorta números/firmas largos para mostrarlos. */
function recortar(valor: string, largo = 48): string {
  return valor.length > largo * 2 ? `${valor.slice(0, largo)}…${valor.slice(-largo)}` : valor;
}

function Check({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <div className={`flex items-center gap-2 font-body-md text-body-md ${ok ? 'text-primary' : 'text-error'}`}>
      <Icon name={ok ? 'check_circle' : 'cancel'} filled className="text-[20px]" />
      <span>{texto}</span>
    </div>
  );
}

export default function SignatureVerifyModal({ isOpen, obras, llavePresidente, onClose }: SignatureVerifyModalProps) {
  const { estaListo, ejecutarAccion } = useCryptoWorker();

  // Lista plana de evaluaciones con la obra a la que pertenecen
  const opciones = obras.flatMap((obra) => obra.evaluaciones.map((evaluacion) => ({ obra, evaluacion })));

  /** STATE: id de la evaluación elegida para auditar. */
  const [selectedId, setSelectedId] = useState('');
  /** STATE: resultado de la última verificación (null = aún no se verifica). */
  const [resultado, setResultado] = useState<ResultadoVerificacion | null>(null);
  /** STATE: true mientras el worker verifica. */
  const [isVerifying, setIsVerifying] = useState(false);
  /** STATE: error del worker. */
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const elegida = opciones.find((o) => o.evaluacion.id_evaluacion === selectedId) ?? opciones[0];

  const handleClose = () => {
    setResultado(null);
    setError(null);
    onClose();
  };

  const verificar = async (evaluacion: EvaluacionPublica, idPintura: string) => {
    setIsVerifying(true);
    setError(null);
    setResultado(null);
    try {
      const res: ResultadoVerificacion = await ejecutarAccion(Acciones.VERIFICAR_EVALUACION_PUBLICA, {
        id_pintura: idPintura,
        id_juez: evaluacion.id_juez,
        estrellas: evaluacion.estrellas,
        comentario: evaluacion.comentario,
        texto_canonico: evaluacion.texto_canonico,
        firma_descegada: evaluacion.firma_descegada,
        firma_juez: evaluacion.firma_juez,
        clave_publica_juez: evaluacion.clave_publica_juez,
        clave_publica_presidente: llavePresidente,
      });
      setResultado(res);
    } catch (err: any) {
      setError(err.message || 'No se pudo verificar.');
    } finally {
      setIsVerifying(false);
    }
  };

  const todoValido =
    resultado &&
    resultado.texto_coincide &&
    resultado.firma_presidente_valida &&
    resultado.firma_juez_valida &&
    resultado.hash_recalculado === elegida?.evaluacion.hash_original;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={handleClose}>
      <div
        className="bg-surface-container-highest max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl p-6 relative border border-outline-variant/30"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Verificación de firmas"
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
          <span>Zona de Verificación Pública</span>
        </div>
        <h3 className="font-headline-md text-headline-md text-on-surface">Verificar Firma Ciega y Firma del Juez</h3>
        <p className="font-body-md text-body-md text-secondary mb-6">
          La verificación corre en tu navegador con las llaves públicas: no necesitas confiar en el servidor.
        </p>

        {opciones.length === 0 || !elegida ? (
          <p className="font-body-md text-body-md text-on-surface-variant">Aún no hay evaluaciones publicadas.</p>
        ) : (
          <div className="flex flex-col gap-4 mb-6">
            {/* Selector */}
            <div className="bg-surface-container p-4 rounded-lg flex flex-col gap-2">
              <label htmlFor="evaluacion-auditoria" className="font-label-sm text-label-sm uppercase text-secondary font-medium">
                Evaluación a auditar
              </label>
              <select
                id="evaluacion-auditoria"
                value={elegida.evaluacion.id_evaluacion}
                onChange={(e) => {
                  setSelectedId(e.target.value);
                  setResultado(null);
                  setError(null);
                }}
                className="w-full bg-surface-variant text-on-surface rounded p-2.5 font-body-md text-body-md border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary-container"
              >
                {opciones.map(({ obra, evaluacion }) => (
                  <option key={evaluacion.id_evaluacion} value={evaluacion.id_evaluacion}>
                    [{obra.codigo_anonimo}] {obra.titulo} — {evaluacion.juez} ({evaluacion.estrellas}★)
                  </option>
                ))}
              </select>
            </div>

            {/* Datos públicos */}
            <div className="p-4 rounded-lg bg-surface-container-low border border-primary/20 flex flex-col gap-3">
              <div>
                <span className="font-label-sm text-label-sm uppercase text-secondary">Texto firmado (canónico)</span>
                <p className="font-label-sm text-label-sm text-on-surface-variant font-mono break-all mt-1">
                  {elegida.evaluacion.texto_canonico}
                </p>
              </div>
              <div>
                <span className="font-label-sm text-label-sm uppercase text-secondary">h = FDH-SHA256(texto)</span>
                <p className="font-label-sm text-label-sm text-on-surface-variant font-mono break-all mt-1">
                  {recortar(elegida.evaluacion.hash_original)}
                </p>
              </div>
              <div>
                <span className="font-label-sm text-label-sm uppercase text-secondary">s (firma descegada del presidente)</span>
                <p className="font-label-sm text-label-sm text-on-surface-variant font-mono break-all mt-1">
                  {recortar(elegida.evaluacion.firma_descegada)}
                </p>
              </div>
            </div>

            {/* Resultado */}
            {resultado && (
              <div
                className={`p-4 rounded-lg border flex flex-col gap-2 ${
                  todoValido ? 'bg-primary-container/15 border-primary-container' : 'bg-error-container/30 border-error'
                }`}
              >
                <Check ok={resultado.texto_coincide} texto="El texto publicado coincide con estrellas y comentario" />
                <Check
                  ok={resultado.hash_recalculado === elegida.evaluacion.hash_original}
                  texto="El hash recalculado coincide con el publicado"
                />
                <Check ok={resultado.firma_presidente_valida} texto="Firma ciega del presidente válida (s^e mod n = h)" />
                <Check ok={resultado.firma_juez_valida} texto={`Firma RSA-PSS de ${elegida.evaluacion.juez} válida`} />
              </div>
            )}
            {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}
          </div>
        )}

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
            disabled={!elegida || !estaListo || isVerifying}
            onClick={() => elegida && verificar(elegida.evaluacion, elegida.obra.id_pintura)}
            className="w-full sm:w-auto px-6 py-2.5 rounded bg-primary-container hover:bg-tertiary-container text-on-primary font-label-md text-label-md uppercase tracking-wider font-bold flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(255,107,0,0.35)] transition-all disabled:opacity-40"
          >
            <Icon name={isVerifying ? 'sync' : 'key'} filled className={`text-[18px] ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{!estaListo ? 'Cargando motor criptográfico...' : 'Verificar Firmas'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}