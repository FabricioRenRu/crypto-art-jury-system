/**
 * pages/RequireVault.tsx
 * Pide el .pem si la llave no está cargada en la sesión.
 *  - Pintor: la llave vive en la RAM del backend (se pierde si el servidor se reinicia).
 *  - Jurado: la llave vive en la RAM del worker de Pyodide (se pierde con F5).
 */
import { useState, useEffect, useRef } from 'react';
import { useCryptoWorker } from '../hooks/useCryptoWorker';
import { Acciones } from '../workers/crypto.worker';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { PATHS } from '../routes/paths';

export default function RequireVault({ children, rol }: { children: React.ReactNode, rol: string }) {
  const { ejecutarAccion } = useCryptoWorker();
  const [bovedaLista, setBovedaLista] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const esPintor = rol === 'pintor';

  useEffect(() => {
    const consulta = esPintor
      ? authService.estadoLlavePintor()
      : ejecutarAccion(Acciones.VERIFICAR_BOVEDA);
    consulta
      .then((res: { lista: boolean }) => setBovedaLista(res.lista))
      .catch(() => setBovedaLista(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esPintor]);

  const handleSubirPem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setError(null);

    const lector = new FileReader();
    lector.onload = async (evento) => {
      const llaveTexto = evento.target?.result as string;
      try {
        if (esPintor) {
          await authService.cargarLlavePintor(llaveTexto);
        } else {
          await ejecutarAccion(Acciones.INYECCION_LLAVE_PRIVADA, { pem: llaveTexto, rol });
        }
        setBovedaLista(true);
      } catch (err: any) {
        setError(err.message || 'El archivo PEM no es válido.');
      }
    };
    lector.readAsText(archivo);
  };

  // Sin JWT no hay sesión: al inicio de sesión
  if (esPintor && !sessionStorage.getItem('access_token')) {
    return <Navigate to={PATHS.sesion} replace />;
  }

  if (bovedaLista === null) return <div>Cargando bóveda...</div>;

  if (bovedaLista === false) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h2>Bóveda bloqueada por seguridad</h2>
        <p>Tu llave privada no está cargada en esta sesión. Sube tu archivo .pem para continuar.</p>
        {error && <p className="text-error">{error}</p>}
        <input type="file" accept=".pem" hidden ref={fileInputRef} onChange={handleSubirPem} />
        <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-blue-600 text-white rounded">
          Subir .pem
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
