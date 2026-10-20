/**
 * services/painterService.ts
 * Peticiones al backend relacionadas con pintores.
 */
import { apiRequest } from '../api/apiClient';
import type { PintorCreate, PintorResponse } from '../types/pintor';
import { ENDPOINTS } from '../api/apiEndpoints';
import type { LoginRequest, TokenResponse } from '../types/login';

export const authService = {
  registroPintor: (data: PintorCreate) =>
    apiRequest<PintorResponse>(
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
  }
};