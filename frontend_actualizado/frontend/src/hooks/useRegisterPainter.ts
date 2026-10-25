/**
 * hooks/useRegisterPainter.ts
 * Maneja la petición de registro: carga, error y resultado.
 */
import { useState } from 'react';
import { authService } from '../services/authService';
import type { PintorCreate, PintorResponse } from '../types/pintor';
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

  const register = async (formData: FormularioRegistro) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // 1. Armamos el paquete para FastAPI. El par ECDSA lo genera el servidor.
      const payload: PintorCreate = {
        nombre: formData.nombre,
        seudonimo: formData.seudonimo,
        email: formData.email,
        contrasena: formData.contrasena,
        foto_perfil_b64: formData.fotoBase64.startsWith("data:image") ? formData.fotoBase64 : null
      };

      // 2. API: Mandamos a guardar a PostgreSQL
      const backendResponse = await authService.registroPintor(payload);

      // 3. ÉXITO: el servidor solo guardó la pública; la privada viene UNA vez en la
      //    respuesta. La descargamos y no la dejamos en el estado de React.
      const nombreArchivo = `llave_privada_${formData.nombre.replace(/\s+/g, '_').toLowerCase()}.pem`;
      descargarArchivoTexto(backendResponse.clave_privada_pem, nombreArchivo);

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
      setIsLoading(false);
    }
  };

  return { register, isLoading, error, result };
};