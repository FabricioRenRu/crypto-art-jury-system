/**
 * hooks/usePublicacionJurado.ts
 * Pasos 7-9 de la firma ciega, del lado del juez:
 *  7. Consulta sus evaluaciones; las FIRMADO ya traen s' del presidente.
 *  8. El worker recupera la evaluación, desciega s = s'·r⁻¹, verifica s^e = h y firma con RSA-PSS.
 *  9. Publica la evaluación en claro con las dos firmas; el backend las vuelve a verificar.
 * Requiere que la llave pública del presidente ya esté en el worker (la inyecta useJuryQueue).
 */
import { useCallback, useEffect, useState } from 'react';
import { useCryptoWorker } from './useCryptoWorker';
import { juradoService } from '../services/juradoService';
import { Acciones } from '../workers/crypto.actions';
import { leerPayloadJWT } from '../utils/session';
import type { MiEvaluacion } from '../types/evaluacion';

interface PublicacionPreparada {
  estrellas: number;
  comentario: string;
  texto_canonico: string;
  hash_original: string;
  firma_descegada: string;
  firma_juez: string;
}

export function usePublicacionJurado(habilitado: boolean) {
  const { ejecutarAccion } = useCryptoWorker();

  /** STATE: evaluaciones del juez tal como están en el backend. */
  const [evaluaciones, setEvaluaciones] = useState<MiEvaluacion[]>([]);
  /** STATE: true mientras se descegan, firman y suben las evaluaciones. */
  const [isPublishing, setIsPublishing] = useState(false);
  /** STATE: cuántas se publicaron en el último intento (para el mensaje de éxito). */
  const [ultimasPublicadas, setUltimasPublicadas] = useState(0);
  /** STATE: mensaje de error del último intento. */
  const [error, setError] = useState<string | null>(null);

  /** Paso 7: vuelve a pedir el estado de las evaluaciones del juez. */
  const refrescar = useCallback(async () => {
    try {
      const { evaluaciones: lista } = await juradoService.misEvaluaciones();
      setEvaluaciones(lista);
    } catch (err: any) {
      setError(err.message || 'No se pudo consultar el estado de tus evaluaciones.');
    }
  }, []);

  /** EFFECT: consulta al entrar (cuando el worker ya tiene la llave del presidente). */
  useEffect(() => {
    if (habilitado) refrescar();
  }, [habilitado, refrescar]);

  const firmadas = evaluaciones.filter((e) => e.estado === 'FIRMADO');
  const esperando = evaluaciones.filter((e) => e.estado === 'ESPERANDO_FIRMA').length;
  const publicadas = evaluaciones.filter((e) => e.estado === 'PUBLICADO').length;

  /** Pasos 8 y 9 para todas las evaluaciones que el presidente ya firmó. */
  const publicarFirmadas = async () => {
    const idJuez = leerPayloadJWT()?.sub;
    if (!idJuez) {
      setError('Tu sesión expiró. Inicia sesión de nuevo.');
      return;
    }

    setIsPublishing(true);
    setError(null);
    setUltimasPublicadas(0);
    let exitosas = 0;
    try {
      for (const ev of firmadas) {
        if (!ev.firma_ciega_presi || !ev.evaluacion_cifrada) continue;

        // Paso 8 (en el worker): descegar, verificar y firmar con PSS
        const pub: PublicacionPreparada = await ejecutarAccion(Acciones.PREPARAR_PUBLICACION, {
          id_pintura: ev.id_pintura,
          id_juez: idJuez,
          s_blinded: ev.firma_ciega_presi,
          evaluacion_cifrada: ev.evaluacion_cifrada,
        });

        // Paso 9: publicar
        await juradoService.publicarEvaluacion({
          id_pintura: ev.id_pintura,
          estrellas: pub.estrellas,
          comentario: pub.comentario,
          firma_descegada: pub.firma_descegada,
          firma_juez: pub.firma_juez,
        });
        exitosas++;
      }
    } catch (err: any) {
      setError(err.message || 'No se pudo publicar una evaluación.');
    } finally {
      setUltimasPublicadas(exitosas);
      setIsPublishing(false);
      await refrescar();
    }
  };

  return {
    firmadas: firmadas.length,
    esperando,
    publicadas,
    ultimasPublicadas,
    isPublishing,
    error,
    publicarFirmadas,
    refrescar,
  };
}