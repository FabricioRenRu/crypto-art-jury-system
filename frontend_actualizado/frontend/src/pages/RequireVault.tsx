/**
 * pages/RequireVault.tsx
 * PAGINA AUXILIAR PARA SOLICITAR .PEM SI NO EXISTE EN LA RAM
 */
import { useState, useEffect, useRef } from 'react';
import { useCryptoWorker } from '../hooks/useCryptoWorker';
import { Acciones } from '../workers/crypto.worker';

// Este componente envuelve el contenido de tus paneles
export default function RequireVault({ children, rol }: { children: React.ReactNode, rol: string }) {
  const { ejecutarAccion } = useCryptoWorker();
  const [bovedaLista, setBovedaLista] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Al montar la página, preguntamos si la memoria RAM sobrevivió
  useEffect(() => {
    ejecutarAccion(Acciones.VERIFICAR_BOVEDA).then((res) => {
      setBovedaLista(res.lista);
    });
  }, [ejecutarAccion]);

  const handleSubirPem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = async (evento) => {
      const llaveTexto = evento.target?.result as string;
      await ejecutarAccion(Acciones.INYECCION_LLAVE_PRIVADA, { pem: llaveTexto, rol });
      setBovedaLista(true); // ¡Se desbloquea la pantalla!
    };
    lector.readAsText(archivo);
  };

  // Mientras le preguntamos al Worker, no mostramos nada
  if (bovedaLista === null) return <div>Cargando bóveda...</div>;

  // Si tiene amnesia (ej. dio F5), le pedimos el archivo
  if (bovedaLista === false) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h2>Bóveda Bloqueada por Seguridad</h2>
        <p>Recargaste la página. Por favor, inyecta tu llave privada de nuevo.</p>
        <input type="file" accept=".pem" hidden ref={fileInputRef} onChange={handleSubirPem} />
        <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-blue-600 text-white rounded">
          Subir .pem
        </button>
      </div>
    );
  }

  // Si tiene memoria, pintamos el panel normal
  return <>{children}</>;
}