/**
 * types/painterPanel.ts
 * Tipos del Panel del Pintor (llave de firma, obra cifrada y consentimiento firmado).
 */

/** Par de llaves ECDSA P-256 del pintor (PEM). La privada nunca sale del navegador. */
export interface LlavesFirma {
  publica: string;
  privada: string;
  /** SHA-256 (hex) de la llave pública en DER: sirve para compararla con la de la BD. */
  huella: string;
  origen: 'generada' | 'importada';
}

/** Consentimiento firmado: lo que se guardaría en pinturas.documento_consentimiento / firma_consentimiento. */
export interface ConsentimientoFirmado {
  /** Texto exacto (JSON) que se firmó. Se verifica byte a byte, no se re-serializa. */
  documento: string;
  /** Firma ECDSA r||s en Base64. */
  firma: string;
  hashDocumento: string;
  algoritmo: string;
  /** Huella de la llave pública con que se firmó. */
  huellaFirmante: string;
  /** Llave pública (PEM) con que se verificó. */
  clavePublica: string;
}

/** Resultado de cifrar con AES-256-GCM + firmar el consentimiento. */
export interface ObraCifrada {
  titulo: string;
  descripcion: string;
  nombreArchivo: string;
  tipoMime: string;
  tamanoOriginal: number;
  /** URL local (blob:) para mostrar la imagen original en el panel. */
  previewUrl: string;
  llaveAes: string; // Base64, 32 bytes
  nonce: string; // Base64, 12 bytes
  tag: string; // Base64, 16 bytes
  /** Archivo a subir: nonce || texto cifrado || tag. */
  cifrado: Uint8Array<ArrayBuffer>;
  hashOriginal: string;
  hashCifrado: string;
  consentimiento: ConsentimientoFirmado;
  /** Resultados de las verificaciones automáticas hechas al terminar. */
  verificaciones: {
    firmaValida: boolean;
    descifradoCoincide: boolean;
  };
  creadaEn: string;
}

export type PasoProceso = 'cifrando' | 'firmando' | 'verificando';

export interface EntradaObra {
  archivo: File;
  titulo: string;
  descripcion: string;
  pintorId: string;
  llaves: LlavesFirma;
}

/** Resultado de una prueba de integridad (alterar un dato y comprobar que se detecta). */
export interface ResultadoPrueba {
  detectada: boolean;
  mensaje: string;
}
