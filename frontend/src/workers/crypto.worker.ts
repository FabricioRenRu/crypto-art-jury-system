/**
 * workers/crypto.worker.ts
 * Este archivo va a ser un hilo de procesamiento independiente
 * (Web Worker) que ejecuta un entorno de Linux virtual con python y C compilado
 * a WebAssembly (WASM), todo dentro de la memoria RAM del navegador del usuario.
 *
 * Las constantes compartidas con React (Acciones, Status...) están en cryptoProtocol.ts
 */

// Importamos directamente el modulo ES6 desde el CDN estable
// @ts-ignore
import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.mjs";
import { FUNCIONES_PYTHON, MODULOS_PYTHON, Status } from './cryptoProtocol';

let pyodide: any = null;

// Inicialización de Python
async function init() {
  // loadPyodide descarga pyodide.asm.wasm
  pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
  });
  //cargamos la libreria
  await pyodide.loadPackage('pycryptodome');

  // Para utilizar modulos de Python, hacemos peticiones HTTP a nuestro servidor,
  // obtenemos el codigo fuente como texto y lo escribimos en el Sistema de archivos
  // virtual en Memoria (VFS) de Pyodide para que main.py pueda hacer "import".
  for (const modulo of MODULOS_PYTHON) {
    const codigo = await (await fetch(`/python/${modulo}.py`)).text();
    pyodide.FS.writeFile(`${modulo}.py`, codigo);
  }

  // Ejecutamos el main
  const mainCode = await (await fetch('/python/main.py')).text();
  pyodide.runPython(mainCode);
}

// Promesa global de arranque
const ready = init();

//Codigo para recibir datos de React
self.onmessage = async (e: MessageEvent) => {
  // id para saber a que promesa de React responderle
  const { id, accion, payload } = e.data;
  try {
    await ready;

    const fnName = (FUNCIONES_PYTHON as Record<string, string>)[accion];
    if (!fnName) throw new Error(`Acción desconocida: ${accion}`);

    //obtenemos la funcion de pyodide
    const fnPython = pyodide.globals.get(fnName);
    // El payload llega como objeto JS; lo convertimos a dict de Python
    // (los Uint8Array quedan como memoryview, que aes_utils._a_bytes sabe leer)
    const payloadPython = pyodide.toPy(payload ?? {});
    let resultPython: any;
    try {
      //ejecutamos la funcion
      resultPython = fnPython(payloadPython);
      //el resultado de la funcion lo convertimos en un formato que typescript entienda
      //(los bytes de Python llegan como Uint8Array)
      const resultJS = resultPython.toJs({ dict_converter: Object.fromEntries });

      self.postMessage({ id, status: Status.EXITO, data: resultJS });
    } finally {
      //Borramos para liberar memoria
      resultPython?.destroy?.();
      payloadPython.destroy();
      fnPython.destroy();
    }
  } catch (error: any) {
    self.postMessage({ id, status: Status.ERROR, error: error?.message ?? String(error) });
  }
};
