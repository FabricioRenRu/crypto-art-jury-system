/**
 * workers/cryptoProtocol.ts
 * "Contrato" entre React y el worker criptográfico: nombres de acciones y estados.
 *
 * Vive en su propio archivo (y no dentro de crypto.worker.ts) porque cualquier archivo que
 * IMPORTE crypto.worker.ts ejecuta su código, incluido el arranque de Pyodide, en el hilo
 * principal de la página. Así solo el worker carga Pyodide.
 */

export const Acciones = {
  PROBARCONEXION: 'PROBAR_CONEXION',
  GENERAR_RSA: 'GENERAR_RSA',
  GENERAR_AES: 'GENERAR_AES',
  GENERAR_ECDSA: 'GENERAR_ECDSA',
  IMPORTAR_ECDSA: 'IMPORTAR_ECDSA',
  CIFRAR_AES_GCM: 'CIFRAR_AES_GCM',
  DESCIFRAR_AES_GCM: 'DESCIFRAR_AES_GCM',
  FIRMAR_CONSENTIMIENTO: 'FIRMAR_CONSENTIMIENTO',
  VERIFICAR_FIRMA: 'VERIFICAR_FIRMA',
} as const;

export type Accion = (typeof Acciones)[keyof typeof Acciones];

export const Status = {
  EXITO: 'EXITO',
  ERROR: 'ERROR',
} as const;

/** Acción de React → función de Python que la atiende (definidas en public/python/main.py). */
export const FUNCIONES_PYTHON: Record<Accion, string> = {
  [Acciones.PROBARCONEXION]: 'probar_conexion',
  [Acciones.GENERAR_RSA]: 'generar_rsa',
  [Acciones.GENERAR_AES]: 'generar_aes',
  [Acciones.GENERAR_ECDSA]: 'generar_ecdsa',
  [Acciones.IMPORTAR_ECDSA]: 'importar_ecdsa',
  [Acciones.CIFRAR_AES_GCM]: 'cifrar_aes_gcm',
  [Acciones.DESCIFRAR_AES_GCM]: 'descifrar_aes_gcm',
  [Acciones.FIRMAR_CONSENTIMIENTO]: 'firmar_consentimiento',
  [Acciones.VERIFICAR_FIRMA]: 'verificar_firma',
};

/** Módulos de public/python/ que se copian al sistema de archivos virtual de Pyodide. */
export const MODULOS_PYTHON = ['rsa_utils', 'aes_utils', 'ecdsa_utils'] as const;
