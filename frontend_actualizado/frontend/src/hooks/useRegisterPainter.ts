/**
 * hooks/useRegisterPainter.ts
 * Maneja la petición de registro: carga, error y resultado.
 */
import { useState } from 'react';
import { authService } from '../services/authService';
import type { PintorCreate, PintorResponse } from '../types/pintor';
import { useCryptoWorker } from './useCryptoWorker';
import { Acciones } from '../workers/crypto.worker';
import { descargarArchivoTexto } from '../utils/fileUtils';


//Lo que la UI nos manda
interface FormularioRegistro {
  nombre: string;
  seudonimo: string;
  email: string;
  contrasena: string;
  fotoBase64: string;
}

export const useRegisterPainter = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PintorResponse | null>(null);
  
  const { estaListo, ejecutarAccion } = useCryptoWorker();

  const register = async (formData: FormularioRegistro) => {
    if (!estaListo) {
      setError("El motor criptográfico aún no está listo.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // 1. Worker: Generamos llaves ECDSA en RAM (Milisegundos)
      const llaves = await ejecutarAccion(Acciones.GENERAR_ECDSA);

      // 2. Armamos el paquete exacto para FastAPI
      const payload: PintorCreate = {
        nombre: formData.nombre,
        seudonimo: formData.seudonimo,
        email: formData.email,
        contrasena: formData.contrasena,
        clave_publica_ecdsa: llaves.public_key, // Formato PEM
        foto_perfil_b64: formData.fotoBase64.startsWith("data:image") ? formData.fotoBase64 : null
      };

      // 3. API: Mandamos a guardar a PostgreSQL
      const backendResponse = await authService.registroPintor(payload);

      // 4. ÉXITO (HTTP 200): Descargamos la privada y borramos memoria
      const nombreArchivo = `llave_privada_${formData.nombre.replace(/\s+/g, '_').toLowerCase()}.pem`;
      descargarArchivoTexto(llaves.private_key, nombreArchivo);

      setResult(backendResponse);

    } catch (err: any) {
      // Si FastAPI devuelve 409 (Email duplicado) o 422 (Validación)
      const errorMsg = err.message || "Error desconocido en el registro";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return { register, isLoading, error, result };
};