/**
 * services/painterService.ts
 * Peticiones del Panel del Pintor. El cifrado AES-256-GCM, la firma ECDSA del
 * consentimiento y los sobres de llave ocurren en el backend.
 */
import { apiRequest, apiRequestBlob } from '../api/apiClient';
import { ENDPOINTS } from '../api/apiEndpoints';
import type {
  MisObrasResponse,
  PerfilPintorResponse,
  PinturaResponse,
} from '../types/pintor';

export const painterService = {
  obtenerPerfil: () => apiRequest<PerfilPintorResponse>(ENDPOINTS.PINTORES.ME),

  listarMisObras: () => apiRequest<MisObrasResponse>(ENDPOINTS.PINTURAS.MIS_OBRAS),

  /** Sube la imagen en claro (por HTTPS); el servidor la cifra, firma y reparte los sobres. */
  cargarObra: (archivo: File, titulo: string, descripcion: string) => {
    const form = new FormData();
    form.append('archivo', archivo);
    form.append('titulo', titulo);
    form.append('descripcion', descripcion);
    return apiRequest<PinturaResponse>(ENDPOINTS.PINTURAS.CARGAR, {
      method: 'POST',
      body: form,
    });
  },

  /** Imagen descifrada de la propia obra (requiere sesión; no hay URL pública). */
  obtenerImagen: (idPintura: string) =>
    apiRequestBlob(ENDPOINTS.PINTURAS.IMAGEN(idPintura)),
};
