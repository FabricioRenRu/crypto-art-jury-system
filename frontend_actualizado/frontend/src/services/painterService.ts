/**
 * services/painterService.ts
 * Peticiones del Panel del Pintor. Las pinturas se cifran en el worker antes de subirlas.
 */
import { apiRequest, apiRequestBlob } from '../api/apiClient';
import { ENDPOINTS } from '../api/apiEndpoints';
import type {
  MisObrasResponse,
  PerfilPintorResponse,
  PinturaResponse,
} from '../types/pintor';

export interface PinturaCifrada {
  id_pintura: string;
  cifrado: Uint8Array;
}

export const painterService = {
  obtenerPerfil: () => apiRequest<PerfilPintorResponse>(ENDPOINTS.PINTORES.ME),

  listarMisObras: () => apiRequest<MisObrasResponse>(ENDPOINTS.PINTURAS.MIS_OBRAS),

  /** Sube el paquete cifrado y el consentimiento firmado por el cliente. */
  cargarObra: (
    pintura: PinturaCifrada,
    documento: string,
    firma: string,
    tipoMime: string,
    tamanoOriginal: number,
    titulo: string,
    descripcion: string,
  ) => {
    const form = new FormData();
    const datosCifrados = new ArrayBuffer(pintura.cifrado.byteLength);
    new Uint8Array(datosCifrados).set(pintura.cifrado);
    form.append(
      'archivo',
      new Blob([datosCifrados], { type: 'application/octet-stream' }),
      `${pintura.id_pintura}.bin`,
    );
    form.append('id_pintura', pintura.id_pintura);
    form.append('tipo_mime', tipoMime);
    form.append('tamano_original', String(tamanoOriginal));
    form.append('documento_consentimiento', documento);
    form.append('firma_consentimiento', firma);
    form.append('titulo', titulo);
    form.append('descripcion', descripcion);
    return apiRequest<PinturaResponse>(ENDPOINTS.PINTURAS.CARGAR, {
      method: 'POST',
      body: form,
    });
  },

  /** Descarga el paquete cifrado; solo se descifra si la llave sigue en memoria. */
  obtenerImagen: (idPintura: string) =>
    apiRequestBlob(ENDPOINTS.PINTURAS.IMAGEN(idPintura)),
};
