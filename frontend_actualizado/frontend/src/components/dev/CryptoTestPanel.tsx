/**
 * components/dev/CryptoTestPanel.tsx
 * Panel de prueba del motor criptografico (Pyodide en el navegador).
 * Es la prueba que estaba directamente en RegistroPintorPage; se movio aqui
 * para no mezclarla con el formulario. Se muestra dentro de un <details> colapsado.
 */
import { useState } from 'react';
import { useCryptoWorker } from '../../hooks/useCryptoWorker';
import { Acciones } from '../../workers/crypto.worker';

export default function CryptoTestPanel() {
  const { estaListo, ejecutarAccion } = useCryptoWorker();

  // Estados para mostrar los resultados en pantalla
  const [llaveAES, setLlaveAES] = useState<string>('');
  const [llavesRSA, setLlavesRSA] = useState<{ publica: string; privada: string } | null>(null);
  const [procesando, setProcesando] = useState(false);

  // 1. Boton generar AES
  const handleGenerarAES = async () => {
    setProcesando(true);
    try {
      console.time('Tiempo AES');
      const respuesta = await ejecutarAccion(Acciones.GENERAR_AES);
      console.timeEnd('Tiempo AES');

      console.log('Llave AES:', respuesta.llave);
      setLlaveAES(respuesta.llave);
    } catch (error) {
      console.error(error);
    } finally {
      setProcesando(false);
    }
  };

  // 2. Boton generar RSA
  const handleGenerarRSA = async () => {
    setProcesando(true);
    try {
      console.time('Tiempo RSA');
      const respuesta = await ejecutarAccion(Acciones.GENERAR_RSA);
      console.timeEnd('Tiempo RSA');

      console.log('Llave Privada RSA:', respuesta.privada);
      console.log('Llave Publica RSA:', respuesta.publica);
      setLlavesRSA({ publica: respuesta.publica, privada: respuesta.privada });
    } catch (error) {
      console.error(error);
    } finally {
      setProcesando(false);
    }
  };

  const botonClase =
    'px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <details className="w-full bg-surface-container-low rounded-xl border border-outline-variant/20 p-space-md">
      <summary className="cursor-pointer font-label-md text-label-md uppercase tracking-wider text-secondary">
        Prueba de criptografia (solo desarrollo)
      </summary>

      <div className="flex flex-col gap-space-md mt-space-md">
        <p className="font-body-md text-body-md text-on-surface-variant">
          Estado del motor:{' '}
          <strong className={estaListo ? 'text-primary' : 'text-tertiary'}>
            {estaListo ? 'Listo' : 'Cargando Python...'}
          </strong>
        </p>

        <div className="flex flex-wrap gap-space-sm">
          <button onClick={handleGenerarAES} disabled={!estaListo || procesando} className={botonClase}>
            Generar llave AES-256
          </button>
          <button onClick={handleGenerarRSA} disabled={!estaListo || procesando} className={botonClase}>
            Generar par de llaves RSA (2048 bits)
          </button>
        </div>

        {llaveAES && (
          <div className="flex flex-col gap-1">
            <strong className="font-label-md text-label-md text-on-surface">Llave AES (Base64):</strong>
            <pre className="bg-surface-container-lowest text-on-surface p-space-md rounded-lg overflow-auto font-label-md text-label-md">
              {llaveAES}
            </pre>
          </div>
        )}

        {llavesRSA && (
          <div className="flex flex-col gap-space-sm">
            <strong className="font-label-md text-label-md text-on-surface">Llave publica RSA (PEM):</strong>
            <pre className="bg-surface-container-lowest text-primary p-space-md rounded-lg overflow-auto max-h-40 font-label-md text-label-md">
              {llavesRSA.publica}
            </pre>
            <strong className="font-label-md text-label-md text-on-surface">Llave privada RSA (PEM):</strong>
            <pre className="bg-surface-container-lowest text-error p-space-md rounded-lg overflow-auto max-h-40 font-label-md text-label-md">
              {llavesRSA.privada}
            </pre>
          </div>
        )}
      </div>
    </details>
  );
}
