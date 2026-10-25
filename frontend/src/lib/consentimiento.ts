/**
 * lib/consentimiento.ts
 * Construye el documento de consentimiento que firma el pintor.
 *
 * Se firma el TEXTO EXACTO que devuelve construirConsentimiento() (se guarda tal cual en
 * pinturas.documento_consentimiento). Quien verifique debe usar ese mismo texto, sin volver a
 * serializar el JSON, para no depender del orden de las llaves ni de los espacios.
 *
 * Al incluir el SHA-256 de la obra (original y cifrada), la firma queda atada a ESE archivo:
 * si cambia un solo byte de la obra, el consentimiento deja de corresponderle.
 */

export const DECLARACION =
  'Certifico la autoría humana original de esta obra, que el archivo no contiene firmas, ' +
  'isotipos ni marcas de agua identificativas, y acepto las bases del concurso.';

/**
 * AAD de AES-GCM: texto que se autentica (no se cifra) junto con la obra.
 * Es fijo a propósito: el juez necesita el mismo valor para descifrar y no debe incluir
 * datos que revelen la identidad del pintor.
 */
export const AAD_OBRA = 'ARTCLASH-PRO|obra|v1';

export interface DatosConsentimiento {
  pintorId: string;
  titulo: string;
  nombreArchivo: string;
  tipoMime: string;
  tamanoBytes: number;
  hashOriginal: string;
  hashCifrado: string;
}

export function construirConsentimiento(d: DatosConsentimiento): string {
  return JSON.stringify(
    {
      version: 1,
      tipo: 'consentimiento-participacion',
      pintor_id: d.pintorId,
      titulo: d.titulo,
      archivo: { nombre: d.nombreArchivo, tipo_mime: d.tipoMime, tamano_bytes: d.tamanoBytes },
      sha256_obra_original: d.hashOriginal,
      sha256_obra_cifrada: d.hashCifrado,
      cifrado: 'AES-256-GCM',
      declaracion: DECLARACION,
      fecha: new Date().toISOString(),
    },
    null,
    2,
  );
}
