/**
 * pages/RegistroPintorPage.tsx
 * Página "Registro de Pintor" (ruta lista; su HTML original, registro-pintor.html, llegó vacío).
 * Por ahora muestra una plantilla temporal. Reemplazar el contenido
 * cuando se tenga el diseño de esta sección.
 */
import PendingPage from '../components/ui/PendingPage';
import { useRegisterPainter } from '../hooks/useRegisterPainter';
import { useCryptoWorker } from '../hooks/useCryptoWorker';
import { Acciones } from '../workers/crypto.worker';
import { useState } from 'react';

export default function RegistroPintorPage() {
  const { estaListo, ejecutarAccion } = useCryptoWorker();
  
  // Estados para mostrar los resultados en pantalla
  const [llaveAES, setLlaveAES] = useState<string>("");
  const [llavesRSA, setLlavesRSA] = useState<{ publica: string, privada: string } | null>(null);
  const [procesando, setProcesando] = useState(false);

  // 1. Botón generar AES
  const handleGenerarAES = async () => {
    setProcesando(true);
    try {
      console.time("Tiempo AES");
      const respuesta = await ejecutarAccion(Acciones.GENERAR_AES);
      console.timeEnd("Tiempo AES");
      
      console.log("Llave AES:", respuesta.llave);
      setLlaveAES(respuesta.llave);
    } catch (error) {
      console.error(error);
    } finally {
      setProcesando(false);
    }
  };

  // 2. Botón generar RSA
  const handleGenerarRSA = async () => {
    setProcesando(true);
    try {
      console.time("Tiempo RSA");
      const respuesta = await ejecutarAccion(Acciones.GENERAR_RSA);
      console.timeEnd("Tiempo RSA");
      
      console.log("Llave Privada RSA:", respuesta.privada);
      console.log("Llave Pública RSA:", respuesta.publica);
      setLlavesRSA({ publica: respuesta.publica, privada: respuesta.privada });
    } catch (error) {
      console.error(error);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ padding: '1rem', background: '#f0f0f0', marginBottom: '1rem', borderRadius: '8px' }}>
        <h4>Prueba de Criptografía (Pyodide en el Navegador)</h4>
        <p>Estado del Motor: <strong>{estaListo ? "🟢 Listo" : "🟡 Cargando Python..."}</strong></p>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
          <button onClick={handleGenerarAES} disabled={!estaListo || procesando}>
            🔑 Generar Llave AES-256
          </button>
          
          <button onClick={handleGenerarRSA} disabled={!estaListo || procesando}>
            🔐 Generar Par de Llaves RSA (2048 bits)
          </button>
        </div>

        {/* Muestra Llave AES */}
        {llaveAES && (
          <div style={{ marginTop: '1rem' }}>
            <strong>Llave AES (Base64):</strong>
            <pre style={{ background: '#333', color: '#fff', padding: '1rem', borderRadius: '4px' }}>
              {llaveAES}
            </pre>
          </div>
        )}

        {/* Muestra Llaves RSA */}
        {llavesRSA && (
          <div style={{ marginTop: '1rem' }}>
            <strong>Llave Pública RSA (PEM):</strong>
            <pre style={{ background: '#333', color: '#0f0', padding: '1rem', borderRadius: '4px', overflow: 'auto', maxHeight: '150px' }}>
              {llavesRSA.publica}
            </pre>
            
            <strong>Llave Privada RSA (PEM):</strong>
            <pre style={{ background: '#333', color: '#f00', padding: '1rem', borderRadius: '4px', overflow: 'auto', maxHeight: '150px' }}>
              {llavesRSA.privada}
            </pre>
          </div>
        )}
      </div>

      <PendingPage title="Registro de Pintor" icon="brush" description="Formulario de inscripción." />
    </div>
  );
}
