/**
 * hooks/usePresidentApproval.ts
 * Bandeja del presidente: descarga los votos cegados (h'), maneja la selección
 * y firma a ciegas en el worker (s' = h'^d mod n). Nunca ve estrellas ni comentarios.
 */
import { useEffect, useMemo, useState } from 'react';
import { useCryptoWorker } from './useCryptoWorker';
import { useArtworkSelection } from './useArtworkSelection';
import { juradoService } from '../services/juradoService';
import { Acciones } from '../workers/crypto.actions';
import { describirCripto } from '../utils/evidenciaCripto';
import type { Artwork, SeccionCripto } from '../types';
import type { FirmaCiegaCreate, HashPendiente } from '../types/evaluacion';

export function usePresidentApproval() {
  const { ejecutarAccion, estaListo } = useCryptoWorker();
  const [llaveRsa, setLlaveRsa] = useState<SeccionCripto[]>([]);
  const [evidenciaFirma, setEvidenciaFirma] = useState<SeccionCripto[]>([]);

  /** STATE: votos cegados que esperan firma, tal como los manda el backend. */
  const [pendientes, setPendientes] = useState<HashPendiente[]>([]);
  /** STATE: true mientras se descarga la bandeja. */
  const [isLoading, setIsLoading] = useState(true);
  /** STATE: controla el modal de confirmación. */
  const [isModalOpen, setIsModalOpen] = useState(false);
  /** STATE: true cuando el lote ya se firmó y subió. */
  const [isPublished, setIsPublished] = useState(false);
  /** STATE: true mientras el worker firma (bloquea cerrar el modal). */
  const [isSigning, setIsSigning] = useState(false);

  /** Filas para la tabla: solo datos opacos, sin calificación. */
  const filas: Artwork[] = useMemo(
    () =>
      pendientes.map((ev) => ({
        id: ev.id_evaluacion,
        title: `Voto cegado ${ev.id_evaluacion.slice(0, 8).toUpperCase()}`,
        category: 'Evaluación cegada',
        score: null,
        status: 'Esperando firma',
      })),
    [pendientes],
  );

  /** HOOK: checkboxes de la tabla. */
  const selection = useArtworkSelection(filas);

  /** EFFECT: descarga la bandeja al montar. */
  useEffect(() => {
    juradoService
      .obtenerHashesPendientes()
      .then(setPendientes)
      .catch((error) => console.error('Error obteniendo pendientes:', error))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!estaListo) return;
    describirCripto(ejecutarAccion, Acciones.DESCRIBIR_LLAVE_RSA).then(setLlaveRsa);
  }, [estaListo, ejecutarAccion]);

  const openModal = () => {
    if (selection.selectedCount > 0) setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSigning) return;
    setIsModalOpen(false);
    setIsPublished(false);
  };

  const confirmSignature = async () => {
    setIsSigning(true);
    try {
      const firmas: FirmaCiegaCreate[] = [];
      const votos: { id: string; h_blinded: string; s_blinded: string }[] = [];
      for (const ev of pendientes.filter((p) => selection.isSelected(p.id_evaluacion))) {
        const { s_blinded } = await ejecutarAccion(Acciones.FIRMA_CIEGA, { h_blinded: ev.hash_cegado });
        firmas.push({ id_evaluacion: ev.id_evaluacion, firma_ciega_presi: s_blinded });
        votos.push({ id: ev.id_evaluacion, h_blinded: ev.hash_cegado, s_blinded });
      }

      if (firmas.length > 0) {
        await juradoService.enviarFirmasMasivas({ firmas });
        setEvidenciaFirma(await describirCripto(ejecutarAccion, Acciones.DESCRIBIR_FIRMA_CIEGA, { votos }));
        const firmadas = new Set(firmas.map((f) => f.id_evaluacion));
        setPendientes((actuales) => actuales.filter((ev) => !firmadas.has(ev.id_evaluacion)));
        selection.clear();
      }
      setIsPublished(true);
    } catch (error: any) {
      console.error('Falló la firma ciega:', error);
      alert(error?.message || 'Hubo un error criptográfico al firmar los votos.');
    } finally {
      setIsSigning(false);
    }
  };

  return {
    evaluacionesPendientes: filas,
    isLoading, isModalOpen, isPublished, isSigning,
    selection, openModal, closeModal, confirmSignature,
    llaveRsa, evidenciaFirma,

  };
}