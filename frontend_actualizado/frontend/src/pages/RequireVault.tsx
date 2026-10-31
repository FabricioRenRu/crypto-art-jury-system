/**
 * pages/RequireVault.tsx
 * Protege una página: exige sesión del rol correcto y su llave privada cargada en el worker.
 * La llave vive solo en la RAM del worker; con F5 se pierde y se vuelve a pedir el .pem.
 */
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useCryptoWorker } from '../hooks/useCryptoWorker';
import { Acciones } from '../workers/crypto.actions';
import { PATHS } from '../routes/paths';
import { obtenerRolSesion, type RolSesion } from '../utils/session';

export default function RequireVault({ children, rol }: { children: ReactNode; rol: RolSesion }) {
  const { ejecutarAccion } = useCryptoWorker();
  /** STATE: null = verificando; true = llave del rol correcto cargada; false = falta subir .pem */
  const [bovedaLista, setBovedaLista] = useState<boolean | null>(null);
  /** STATE: error al inyectar el .pem */
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** EFFECT: pregunta al worker si ya hay llave y si es de este rol. */
  useEffect(() => {
    ejecutarAccion(Acciones.VERIFICAR_BOVEDA)
      .then((res: { lista: boolean; rol: string | null }) => setBovedaLista(res.lista && res.rol === rol))
      .catch(() => setBovedaLista(false));
  }, [ejecutarAccion, rol]);

  const handleSubirPem = async (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setError(null);
    try {
      await ejecutarAccion(Acciones.INYECCION_LLAVE_PRIVADA, { pem: await archivo.text(), rol });
      setBovedaLista(true);
    } catch (err: any) {
      setError(err.message || 'El archivo PEM no es válido.');
    }
  };

  // Sin sesión, sesión vencida o de otro rol → al login
  if (obtenerRolSesion() !== rol) {
    return <Navigate to={PATHS.sesion} replace />;
  }

  if (bovedaLista === null) return <div className="p-space-xl text-center">Cargando bóveda...</div>;

  if (!bovedaLista) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-gutter">
        <h2 className="font-headline-sm text-headline-sm">Bóveda bloqueada por seguridad</h2>
        <p className="text-on-surface-variant">Tu llave privada no está cargada en esta sesión. Sube tu archivo .pem para continuar.</p>
        {error && <p className="text-error">{error}</p>}
        <input type="file" accept=".pem" hidden ref={fileInputRef} onChange={handleSubirPem} />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 rounded bg-primary-container text-on-primary font-label-md text-label-md uppercase"
        >
          Subir .pem
        </button>
      </div>
    );
  }

  return <>{children}</>;
}