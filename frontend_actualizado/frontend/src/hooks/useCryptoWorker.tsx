/**
 * hooks/useCryptoWorker.tsx
 * Actua como un orquestador para que los componentes de la interfaz
 * puedan interactuar con el worker
 * 
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Status, Acciones } from '../workers/crypto.worker'; 


interface CryptoContextType {
  estaListo: boolean;
  ejecutarAccion: (accion: string, payload?: any) => Promise<any>;
}

//Creamos contexto
export const CryptoContext = createContext<CryptoContextType | null>(null);

export function CryptoProvider({ children }: { children: ReactNode }) {
  
  //referencia para guardar la conexion con el worker
  const workerRef = useRef<Worker | null>(null);

  const [estaListo, setEstaListo] = useState<boolean>(false);
  
  // guardamos las promesas pendientes
  const resolversRef = useRef<{ 
    [key: string]: { 
      resolve: (v: any) => void, 
      reject: (e: any) => void 
    } }>({});

  //UseEffect que hace que este codigo solo se ejecute una vez justo despues de que se renderice el Provider
  useEffect(() => {

    //Se instancia el Web Worker
    const worker = new Worker(new URL('../workers/crypto.worker.ts', import.meta.url), { type: 'module' });
    
    //Se abre el "canal de escucha" entre React y el worker
    //Esta funcion se disparara cada vez que el worker ejecute self.postMessage
    worker.onmessage = (event) => {
      const { id, status, data, error } = event.data; 
      
      // Si es el mensaje silencioso de arranque
      if (id === "arranque" && status === Status.EXITO) {
        setEstaListo(true);
        return;
      }

      // Si es una respuesta a una Promesa pendiente
      if (id && resolversRef.current[id]) {
        if (status === Status.EXITO) {
          resolversRef.current[id].resolve(data);
        } else {
          resolversRef.current[id].reject(new Error(error));
        }
        delete resolversRef.current[id]; // Limpiamos la memoria
      }
    };

    workerRef.current = worker;
    // Mandamos el mensaje silencioso con un id predefinido
    worker.postMessage({ id: "arranque", accion: Acciones.PROBARCONEXION });

    return () => worker.terminate();
  }, []);

  // Nueva función puente con async/await
  const ejecutarAccion = useCallback((accion: string, payload?: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject("El motor criptográfico no está inicializado");
        return;
      }
      // Generamos un ID único temporal
      const id = Math.random().toString(36).substring(2, 9);

      //Se guardan los controles de esta Promesa (resolve y reject)
      resolversRef.current[id] = { resolve, reject };
      
      //Se envian los datos al worker
      workerRef.current.postMessage({ id, accion, payload });
    });
  }, []);
  //Renderiza el componente nativo Provider de React, 
  // inyectandole el estado y la funcion puente, 
  // y muestra adentro a todos los children
  return (
    <CryptoContext.Provider value={{ estaListo, ejecutarAccion }}>
      {children}
    </CryptoContext.Provider>
  );
}


//Custom Hook para que los componentes no tengan que configurar exportaciones largas
export function useCryptoWorker() {
  const context = useContext(CryptoContext);
  if (!context) throw new Error("Debe usarse dentro de CryptoProvider");
  return context;
}