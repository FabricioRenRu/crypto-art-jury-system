/**
 * workers/crypto.worker.ts
 * Hilo independiente (Web Worker) que ejecuta Python (Pyodide/WASM) en la RAM del navegador.
 * Toda la criptografía del cliente corre aquí; React solo le manda mensajes.
 */
// @ts-ignore
import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.mjs";
import { Acciones, Status } from './crypto.actions';

const MAPA_FUNCIONES: Record<string, string> = {
  [Acciones.PROBAR_CONEXION]: 'probar_conexion',
  [Acciones.GENERAR_RSA]: 'generar_rsa',
  [Acciones.GENERAR_AES]: 'generar_aes',
  [Acciones.CIFRAR_PINTURA]: 'cifrar_pintura',
  [Acciones.DESCIFRAR_PINTURA]: 'descifrar_pintura',
  [Acciones.VERIFICAR_LLAVE_AES]: 'verificar_llave_aes',
  [Acciones.GENERAR_SOBRES]: 'generar_sobres',
  [Acciones.ABRIR_SOBRE]: 'abrir_sobre',
  [Acciones.FIRMAR_CONSENTIMIENTO]: 'firmar_consentimiento',
  [Acciones.GENERAR_ECDSA]: 'generar_ecdsa_keys',
  [Acciones.INYECCION_LLAVE_PRIVADA]: 'inyectar_llave_privada',
  [Acciones.FIRMAR_MENSAJE_ECDSA]: 'firmar_mensaje',
  [Acciones.VERIFICAR_BOVEDA]: 'verificar_boveda',
  [Acciones.INYECCION_LLAVE_PRESIDENTE]: 'inyectar_llave_presidente',
  [Acciones.CEGAR_EVALUACION]: 'preparar_evaluacion_cegada',
  [Acciones.FIRMA_CIEGA]: 'blind_signature',
  [Acciones.PREPARAR_PUBLICACION]: 'preparar_publicacion',
  [Acciones.VERIFICAR_EVALUACION_PUBLICA]: 'verificar_evaluacion_publica',
  [Acciones.GENERAR_SOBRE_PINTOR]: 'generar_sobre_pintor',
  [Acciones.ABRIR_SOBRE_PINTOR]: 'abrir_sobre_pintor',
  [Acciones.DESCIFRAR_OBRA_PUBLICA]: 'descifrar_obra_publica',
  [Acciones.CERRAR_SESION]: 'cerrar_sesion',
  [Acciones.DESCRIBIR_LLAVE_ECDSA]: 'describir_llave_ecdsa',
  [Acciones.DESCRIBIR_CIFRADO_AES]: 'describir_cifrado_aes',
  [Acciones.DESCRIBIR_SOBRES]: 'describir_sobres',
  [Acciones.DESCRIBIR_SOBRE_PINTOR]: 'describir_sobre_pintor',
  [Acciones.DESCRIBIR_FIRMA_ECDSA]: 'describir_firma_ecdsa',
  [Acciones.DESCRIBIR_LLAVE_RSA]: 'describir_llave_rsa',
  [Acciones.DESCRIBIR_SOBRE_JUEZ]: 'describir_sobre_juez',
  [Acciones.DESCRIBIR_CEGADO]: 'describir_cegado',
  [Acciones.DESCRIBIR_FIRMA_CIEGA]: 'describir_firma_ciega',
};

/** Módulos que se copian al sistema de archivos virtual de Pyodide antes de correr main.py */
const MODULOS_PYTHON = [
  'rsa_utils', 'aes_utils', 'ecdsa_utils', 'session_utils', 'sobre_llave_utils',
  'sobre_pintor_utils', 'blind_signature_utils', 'evidencia_utils',

];

let pyodide: any = null;

async function descargarTexto(ruta: string): Promise<string> {
  const respuesta = await fetch(ruta);
  if (!respuesta.ok) throw new Error(`No se pudo cargar ${ruta} (HTTP ${respuesta.status})`);
  return respuesta.text();
}

async function init() {
  pyodide = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/" });
  await pyodide.loadPackage('pycryptodome');

  for (const modulo of MODULOS_PYTHON) {
    pyodide.FS.writeFile(`${modulo}.py`, await descargarTexto(`/python/${modulo}.py`));
  }
  pyodide.runPython(await descargarTexto('/python/main.py'));

  // Falla al arrancar (y no a media operación) si main.py no expone alguna función del mapa
  const faltantes = Object.values(MAPA_FUNCIONES).filter((fn) => !pyodide.globals.has(fn));
  if (faltantes.length > 0) {
    throw new Error(`main.py no importa: ${faltantes.join(', ')}`);
  }
}

const ready = init();

/** Los errores de Python traen todo el traceback; nos quedamos con la última línea legible. */
function mensajeDeError(error: unknown): string {
  const texto = String((error as any)?.message ?? error).trim();
  const ultimaLinea = texto.split('\n').pop() ?? texto;
  return ultimaLinea.replace(/^\w+(Error|Exception): /, '');
}

self.onmessage = async (e: MessageEvent) => {
  const { id, accion, payload } = e.data ?? {};
  let fnPython: any = null;
  let payloadPython: any = null;
  let resultPython: any = null;

  try {
    await ready;
    const fnName = MAPA_FUNCIONES[accion];
    if (!fnName) throw new Error(`Acción desconocida: ${accion}`);

    fnPython = pyodide.globals.get(fnName);
    payloadPython = pyodide.toPy(payload ?? {});
    resultPython = fnPython(payloadPython);

    // Si Python regresa un valor simple (str, bool) no es un proxy y no tiene toJs
    const data = resultPython?.toJs
      ? resultPython.toJs({ dict_converter: Object.fromEntries })
      : resultPython;
    self.postMessage({ id, status: Status.EXITO, data });
  } catch (error) {
    self.postMessage({ id, status: Status.ERROR, error: mensajeDeError(error) });
  } finally {
    // Liberamos memoria de Pyodide; el ?. evita que un error aquí tape el error real
    resultPython?.destroy?.();
    payloadPython?.destroy?.();
    fnPython?.destroy?.();
  }
};