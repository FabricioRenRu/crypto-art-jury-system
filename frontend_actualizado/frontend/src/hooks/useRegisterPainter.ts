/**
 * hooks/useRegisterPainter.ts
 * Maneja la petición de registro: carga, error y resultado.
 */
import { useState } from 'react';
import { authService } from '../services/authService';
import type { PintorCreate, PintorResponse } from '../types/pintor';
import { descargarArchivoTexto } from '../utils/fileUtils';
import { useCryptoWorker } from './useCryptoWorker';
import { Acciones } from '../workers/crypto.worker';


//Lo que la UI nos manda
interface FormularioRegistro {
  nombre: string;
  seudonimo: string;
  email: string;
  contrasena: string;
  fotoBase64: string;
}

export const useRegisterPainter = () => {
  const { ejecutarAccion } = useCryptoWorker();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PintorResponse | null>(null);

  const register = async (formData: FormularioRegistro) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    let parLlaves: { private_key: string; public_key: string } | null = null;
    try {
      // El worker del navegador genera el par; la privada no se agrega al payload HTTP.
      const llavesGeneradas = await ejecutarAccion(Acciones.GENERAR_ECDSA);
      parLlaves = llavesGeneradas;
      const payload: PintorCreate = {
        nombre: formData.nombre,
        seudonimo: formData.seudonimo,
        email: formData.email,
        contrasena: formData.contrasena,
        clave_publica_ecdsa: llavesGeneradas.public_key,
        foto_perfil_b64: formData.fotoBase64.startsWith('data:image')
          ? formData.fotoBase64
          : null,
      };

      // apiRequest solo resuelve para respuestas HTTP exitosas (2xx).
      const backendResponse = await authService.registroPintor(payload);

      // La llave privada se descarga localmente solo después del registro exitoso.
      const nombreArchivo = `llave_privada_${formData.nombre.replace(/\s+/g, '_').toLowerCase()}.pem`;
      descargarArchivoTexto(llavesGeneradas.private_key, nombreArchivo);

      setResult({
        id: backendResponse.id,
        email: backendResponse.email,
        clave_publica_ecdsa: backendResponse.clave_publica_ecdsa,
      });

    } catch (err: any) {
      // Si FastAPI devuelve 409 (Email duplicado) o 422 (Validación)
      const errorMsg = err.message || "Error desconocido en el registro";
      setError(errorMsg);
    } finally {
      if (parLlaves) parLlaves.private_key = '';
      parLlaves = null;
      setIsLoading(false);
    }
  };

  return { register, isLoading, error, result };
};