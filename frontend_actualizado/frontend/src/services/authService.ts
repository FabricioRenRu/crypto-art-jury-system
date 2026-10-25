/**
 * services/painterService.ts
 * Peticiones al backend relacionadas con pintores.
 */
import { apiRequest } from '../api/apiClient';
import type { EstadoLlaveResponse, PintorCreate, PintorRegistroResponse } from '../types/pintor';
import { ENDPOINTS } from '../api/apiEndpoints';
import type { LoginRequest, TokenResponse } from '../types/login';

export const authService = {
  registroPintor: (data: PintorCreate) =>
    apiRequest<PintorRegistroResponse>(
      ENDPOINTS.AUTH.REGISTRO_PINTOR, 
      {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  loginPintor: (data: LoginRequest) => {
    return apiRequest<TokenResponse>(
      ENDPOINTS.AUTH.LOGIN_PINTOR,
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    )
  },

  loginJurado: (data: LoginRequest) => {
    return apiRequest<TokenResponse>(
      ENDPOINTS.AUTH.LOGIN_JURADO,
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    )
  },

  /** Paso 2 del login del pintor: el servidor valida el .pem contra tu pública y lo deja solo en RAM. */
  cargarLlavePintor: (pem: string) =>
    apiRequest<EstadoLlaveResponse>(ENDPOINTS.AUTH.LLAVE_PINTOR, {
      method: 'POST',
      body: JSON.stringify({ pem }),
    }),

  /** ¿La sesión actual todavía tiene la llave en RAM del servidor? */
  estadoLlavePintor: () =>
    apiRequest<EstadoLlaveResponse>(ENDPOINTS.AUTH.ESTADO_LLAVE_PINTOR),
};
