/**
 * pages/PanelPintorPage.tsx
 * Página "Panel del Pintor" (migrada de Interfaces/PanelPintor/code.html).
 *
 * Flujo:
 *   1. El pintor genera o importa su llave de firma ECDSA P-256.
 *   2. Sube su pintura en el modal. El archivo se cifra con AES-256-GCM y se firma el
 *      consentimiento con ECDSA, todo dentro del navegador (Python en un Web Worker).
 *   3. El panel muestra la evidencia criptográfica del resultado.
 *
 * Todavía NO se envía nada al backend: faltan los sobres RSA-OAEP para los jueces y el
 * endpoint POST /api/pinturas/cargar. Ver notas al final del archivo.
 */
import { useEffect, useRef, useState } from 'react';
import Icon from '../components/ui/Icon';
import PainterBanner from '../components/painter/PainterBanner';
import SigningKeyCard from '../components/painter/SigningKeyCard';
import ArtworkCard from '../components/painter/ArtworkCard';
import UploadModal from '../components/painter/UploadModal';
import type { DatosFormulario } from '../components/painter/UploadModal';
import CryptoEvidence from '../components/painter/CryptoEvidence';
import { usePainterCrypto } from '../hooks/usePainterCrypto';
import { PINTOR_ACTUAL } from '../data/painterSession';
import type { LlavesFirma, ObraCifrada, PasoProceso } from '../types/painterPanel';

const mensajeError = (e: unknown) => (e instanceof Error ? e.message : String(e));

export default function PanelPintorPage() {
  const { estaListo, generarLlaves, importarLlave, cifrarYFirmar } = usePainterCrypto();

  /** STATE: llave de firma cargada (null mientras no se genere/importe). */
  const [llaves, setLlaves] = useState<LlavesFirma | null>(null);
  const [ocupadoLlaves, setOcupadoLlaves] = useState(false);
  const [errorLlaves, setErrorLlaves] = useState<string | null>(null);

  /** STATE: obra ya cifrada y firmada (slot 01 de 01). */
  const [obra, setObra] = useState<ObraCifrada | null>(null);

  /** STATE: modal de subida y avance del proceso criptográfico. */
  const [modalAbierto, setModalAbierto] = useState(false);
  const [procesando, setProcesando] = useState<PasoProceso | null>(null);
  const [errorSubida, setErrorSubida] = useState<string | null>(null);

  const evidenciaRef = useRef<HTMLDivElement>(null);
  const previewActual = useRef<string | null>(null);

  // Libera la URL local de la vista previa al reemplazar la obra o salir de la página
  useEffect(() => {
    const anterior = previewActual.current;
    previewActual.current = obra?.previewUrl ?? null;
    if (anterior && anterior !== previewActual.current) URL.revokeObjectURL(anterior);
  }, [obra]);
  useEffect(() => () => {
    if (previewActual.current) URL.revokeObjectURL(previewActual.current);
  }, []);

  const conLlaves = async (accion: () => Promise<LlavesFirma>) => {
    setOcupadoLlaves(true);
    setErrorLlaves(null);
    try {
      setLlaves(await accion());
    } catch (e) {
      setErrorLlaves(mensajeError(e));
    } finally {
      setOcupadoLlaves(false);
    }
  };

  const alImportar = (archivo: File) => conLlaves(async () => importarLlave(await archivo.text()));

  const alEnviar = async (datos: DatosFormulario) => {
    if (!llaves) return;
    setErrorSubida(null);
    setProcesando('cifrando');
    try {
      const nueva = await cifrarYFirmar({ ...datos, pintorId: PINTOR_ACTUAL.id, llaves }, setProcesando);
      setObra(nueva);
      setModalAbierto(false);
      // Espera a que se pinte el panel de evidencia y baja hasta él
      setTimeout(() => evidenciaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (e) {
      setErrorSubida(mensajeError(e));
    } finally {
      setProcesando(null);
    }
  };

  const abrirModal = () => {
    setErrorSubida(null);
    setModalAbierto(true);
  };

  const bloqueo = !estaListo
    ? 'El motor criptográfico (Python) todavía se está cargando. Espera unos segundos.'
    : !llaves
      ? 'Primero genera o importa tu llave de firma ECDSA en el panel "Llave de firma".'
      : null;

  return (
    <div className="flex flex-col w-full">
      <PainterBanner nombre={PINTOR_ACTUAL.nombre} avatarUrl={PINTOR_ACTUAL.avatarUrl} onSubir={abrirModal} />

      <div className="max-w-7xl mx-auto w-full px-gutter py-space-xl flex flex-col gap-space-lg">
        <SigningKeyCard
          llaves={llaves}
          motorListo={estaListo}
          ocupado={ocupadoLlaves}
          error={errorLlaves}
          onGenerar={() => conLlaves(generarLlaves)}
          onImportar={alImportar}
        />

        {/* Mis obras en competencia */}
        <div className="flex flex-col gap-space-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pb-2">
            <div className="flex items-center gap-space-xs">
              <Icon name="gallery_thumbnail" className="text-primary text-[24px]" />
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Mis Obras en Competencia</h2>
            </div>
            <div className="flex items-center gap-space-sm bg-surface-container-high px-4 py-2 rounded-lg text-secondary font-label-sm text-label-sm">
              <Icon name="info" className="text-primary text-[18px]" />
              <span>Requisitos clave: Mín. 4000x3000px (300 DPI) • Sin marcas de agua</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
            <ArtworkCard
              obra={obra}
              onSubir={abrirModal}
              onVerDetalles={() => evidenciaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            />
          </div>
        </div>

        <div ref={evidenciaRef} className="scroll-mt-28">
          {obra && <CryptoEvidence obra={obra} />}
        </div>
      </div>

      <UploadModal
        abierto={modalAbierto}
        procesando={procesando}
        error={errorSubida}
        bloqueo={bloqueo}
        onCerrar={() => setModalAbierto(false)}
        onEnviar={alEnviar}
      />
    </div>
  );
}

/*
 * PENDIENTE PARA CONECTAR CON EL BACKEND (POST /api/pinturas/cargar)
 *  - Sobres: cifrar `obra.llaveAes` con la llave RSA-OAEP de cada juez
 *    (GET /api/jurado/llaves-publicas) y descartar la llave en claro.
 *  - Enviar multipart: archivo `obra.cifrado`, `obra.consentimiento.documento`,
 *    `obra.consentimiento.firma` y el arreglo de sobres. apiClient.ts hoy fuerza
 *    Content-Type: application/json y habría que omitirlo para FormData.
 *  - `titulo` y `descripcion` no tienen columna en el modelo Pintura todavía.
 */
