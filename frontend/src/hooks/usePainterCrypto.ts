/**
 * hooks/usePainterCrypto.ts
 * Operaciones criptográficas del pintor, escritas sobre el worker de Pyodide:
 *   - llave de firma ECDSA P-256 (generar / importar)
 *   - cifrar la obra con AES-256-GCM
 *   - firmar el consentimiento con ECDSA y verificar la firma
 *   - pruebas de integridad (alterar un dato y comprobar que se detecta)
 *
 * Los componentes llaman a estas funciones y no se enteran de que detrás hay Python.
 */
import { useCallback } from 'react';
import { useCryptoWorker } from './useCryptoWorker';
import { Acciones } from '../workers/cryptoProtocol';
import { AAD_OBRA, construirConsentimiento } from '../lib/consentimiento';
import type {
  EntradaObra,
  LlavesFirma,
  ObraCifrada,
  PasoProceso,
  ResultadoPrueba,
} from '../types/painterPanel';

export function usePainterCrypto() {
  const { estaListo, ejecutarAccion } = useCryptoWorker();

  const generarLlaves = useCallback(async (): Promise<LlavesFirma> => {
    const r = await ejecutarAccion(Acciones.GENERAR_ECDSA);
    return { publica: r.publica, privada: r.privada, huella: r.huella, origen: 'generada' };
  }, [ejecutarAccion]);

  const importarLlave = useCallback(
    async (pemPrivada: string): Promise<LlavesFirma> => {
      const r = await ejecutarAccion(Acciones.IMPORTAR_ECDSA, { privada: pemPrivada });
      return { publica: r.publica, privada: r.privada, huella: r.huella, origen: 'importada' };
    },
    [ejecutarAccion],
  );

  /** Cifra la obra, arma el consentimiento, lo firma y comprueba todo antes de devolver. */
  const cifrarYFirmar = useCallback(
    async (e: EntradaObra, onPaso?: (p: PasoProceso) => void): Promise<ObraCifrada> => {
      // 1) AES-256-GCM
      onPaso?.('cifrando');
      const datos = new Uint8Array(await e.archivo.arrayBuffer());
      const c = await ejecutarAccion(Acciones.CIFRAR_AES_GCM, { datos, aad: AAD_OBRA });
      const cifrado = new Uint8Array(c.cifrado);

      // 2) Consentimiento + ECDSA
      onPaso?.('firmando');
      const documento = construirConsentimiento({
        pintorId: e.pintorId,
        titulo: e.titulo,
        nombreArchivo: e.archivo.name,
        tipoMime: e.archivo.type,
        tamanoBytes: e.archivo.size,
        hashOriginal: c.hash_original,
        hashCifrado: c.hash_cifrado,
      });
      const f = await ejecutarAccion(Acciones.FIRMAR_CONSENTIMIENTO, {
        documento,
        privada: e.llaves.privada,
      });

      // 3) Comprobaciones: la firma verifica y el descifrado devuelve la obra original
      onPaso?.('verificando');
      const v = await ejecutarAccion(Acciones.VERIFICAR_FIRMA, {
        documento,
        firma: f.firma,
        publica: e.llaves.publica,
      });
      const d = await ejecutarAccion(Acciones.DESCIFRAR_AES_GCM, {
        cifrado,
        llave: c.llave,
        aad: AAD_OBRA,
        solo_hash: true,
      });

      return {
        titulo: e.titulo,
        descripcion: e.descripcion,
        nombreArchivo: e.archivo.name,
        tipoMime: e.archivo.type,
        tamanoOriginal: e.archivo.size,
        previewUrl: URL.createObjectURL(e.archivo),
        llaveAes: c.llave,
        nonce: c.nonce,
        tag: c.tag,
        cifrado,
        hashOriginal: c.hash_original,
        hashCifrado: c.hash_cifrado,
        consentimiento: {
          documento,
          firma: f.firma,
          hashDocumento: f.hash_documento,
          algoritmo: f.algoritmo,
          huellaFirmante: f.huella,
          clavePublica: e.llaves.publica,
        },
        verificaciones: {
          firmaValida: v.valida === true,
          descifradoCoincide: d.hash === c.hash_original,
        },
        creadaEn: new Date().toISOString(),
      };
    },
    [ejecutarAccion],
  );

  /** Cambia 1 byte del archivo cifrado y comprueba que GCM se niega a descifrarlo. */
  const probarAlteracionCifrado = useCallback(
    async (obra: ObraCifrada): Promise<ResultadoPrueba> => {
      const alterado = new Uint8Array(obra.cifrado);
      alterado[12] ^= 0x01; // primer byte del texto cifrado (justo después del nonce)
      try {
        await ejecutarAccion(Acciones.DESCIFRAR_AES_GCM, {
          cifrado: alterado,
          llave: obra.llaveAes,
          aad: AAD_OBRA,
          solo_hash: true,
        });
        return { detectada: false, mensaje: 'El archivo alterado se descifró: la integridad NO está protegida.' };
      } catch (err) {
        return {
          detectada: true,
          mensaje: err instanceof Error ? err.message : String(err),
        };
      }
    },
    [ejecutarAccion],
  );

  /** Agrega un espacio al consentimiento y comprueba que la firma deja de ser válida. */
  const probarAlteracionConsentimiento = useCallback(
    async (obra: ObraCifrada): Promise<ResultadoPrueba> => {
      const r = await ejecutarAccion(Acciones.VERIFICAR_FIRMA, {
        documento: obra.consentimiento.documento + ' ',
        firma: obra.consentimiento.firma,
        publica: obra.consentimiento.clavePublica,
      });
      return r.valida
        ? { detectada: false, mensaje: 'La firma siguió siendo válida con el texto alterado.' }
        : { detectada: true, mensaje: 'Firma ECDSA inválida: el documento ya no coincide con lo que se firmó.' };
    },
    [ejecutarAccion],
  );

  return {
    estaListo,
    generarLlaves,
    importarLlave,
    cifrarYFirmar,
    probarAlteracionCifrado,
    probarAlteracionConsentimiento,
  };
}
