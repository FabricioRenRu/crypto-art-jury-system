/**
 * workers/crypto.worker.ts
 * Este archivo va a ser un hilo de procesamiento independiente
 * (Web Worker) que ejecuta un entorno de Linux virtual con python y C compilado
 * a WebAssembly (WASM), todo dentro de la memoria RAM del navegador del usuario.
 */

// Importamos directamente el modulo ES6 desde el CDN estable
// @ts-ignore
import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.mjs";

export const Acciones = {
  PROBARCONEXION: "PROBAR_CONEXION",
  GENERAR_RSA: "GENERAR_RSA",
  GENERAR_AES: "GENERAR_AES",
  CIFRAR_PINTURA: "CIFRAR_PINTURA",
  DESCIFRAR_PINTURA: "DESCIFRAR_PINTURA",
  VERIFICAR_LLAVE_AES: "VERIFICAR_LLAVE_AES",
  FIRMAR_CONSENTIMIENTO: "FIRMAR_CONSENTIMIENTO",
  GENERAR_ECDSA: "GENERAR_ECDSA",
  INYECCION_LLAVE_PRIVADA: "INYECCION_LLAVE_PRIVADA",
  FIRMAR_MENSAJE_ECDSA: "FIRMAR_MENSAJE_ECDSA",
  VERIFICAR_BOVEDA: "VERIFICAR_BOVEDA"
} as const;

export const Status = {
  EXITO: "EXITO",
  ERROR: "ERROR",
} as const;

let pyodide: any = null;

// Inicialización de Python
async function init() {
  // loadPyodide descarga pyodide.asm.wasm
  pyodide = await loadPyodide({ 
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/" 
  });
  //cargamos la libreria
  await pyodide.loadPackage('pycryptodome');
  
  // Para utilizar modulos de Python, hacemos peticiones HTTP a nuestro servidor
  // Obtenemos el codigo fuente como texto
  const rsaCode = await (await fetch('/python/rsa_utils.py')).text();
  const aesCode = await (await fetch('/python/aes_utils.py')).text();
  const ecdsaCode = await (await fetch('/python/ecdsa_utils.py')).text();
  const sessionCode = await (await fetch('/python/session_utils.py')).text();
  
  //pyodide.FS.writeFile() escrive el texto/codigo fuente para escribir ese
  //texto en el Sistema de archivos virtual en Memoria (VFS) de Pyodide
  pyodide.FS.writeFile('rsa_utils.py', rsaCode);
  pyodide.FS.writeFile('aes_utils.py', aesCode);
  pyodide.FS.writeFile('ecdsa_utils.py', ecdsaCode);
  pyodide.FS.writeFile('session_utils.py', sessionCode);

  // Ejecutamos el main
  const mainCode = await (await fetch('/python/main.py')).text();
  pyodide.runPython(mainCode);
}

// Promesa global de arranque 
const ready = init();

//Codigo para recibir datos de React
self.onmessage = async (e: MessageEvent) => {
  try {
    await ready;
    // id para saber a que promesa de React responderle
    const { id, accion, payload } = e.data;

    let fnName = "";
    if (accion === Acciones.PROBARCONEXION) fnName = 'probar_conexion';
    else if (accion === Acciones.GENERAR_RSA) fnName = 'generar_rsa';
    else if (accion === Acciones.GENERAR_AES) fnName = 'generar_aes';
    else if (accion === Acciones.CIFRAR_PINTURA) fnName = 'cifrar_pintura';
    else if (accion === Acciones.DESCIFRAR_PINTURA) fnName = 'descifrar_pintura';
    else if (accion === Acciones.VERIFICAR_LLAVE_AES) fnName = 'verificar_llave_aes';
    else if (accion === Acciones.FIRMAR_CONSENTIMIENTO) fnName = 'firmar_consentimiento';
    else if (accion === Acciones.GENERAR_ECDSA) fnName = 'generar_ecdsa_keys';
    else if (accion === Acciones.INYECCION_LLAVE_PRIVADA) fnName = 'inyectar_llave_privada';
    else if (accion === Acciones.FIRMAR_MENSAJE_ECDSA) fnName = 'firmar_mensaje';
    else if (accion === Acciones.VERIFICAR_BOVEDA) fnName = 'verificar_boveda';

    if (fnName) {
      //obtenemos la funcion de pyodide
      const fnPython = pyodide.globals.get(fnName);
      const payloadPython = pyodide.toPy(payload || {});
      let resultPython: any;
      try {
        //ejecutamos la funcion
        resultPython = fnPython(payloadPython);
        //el resultado de la funcion lo convertimos en un formato que typescript entienda
        const resultJS = resultPython.toJs({ dict_converter: Object.fromEntries });
        self.postMessage({ id, status: Status.EXITO, data: resultJS });
      } finally {
        resultPython?.destroy?.();
        payloadPython.destroy();
        fnPython.destroy();
      }
    }
  } catch (error: any) {
    self.postMessage({ id: e.data.id, status: Status.ERROR, error: error.message });
  }
};