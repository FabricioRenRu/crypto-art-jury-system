/**
 * services/painterService.ts
 * Peticiones al backend relacionadas con pintores.
 */
import { apiRequest } from './apiClient';
import type { PainterCreate, PainterResponse } from '../types/painter';

export const painterService = {
  register: (data: PainterCreate) =>
    apiRequest<PainterResponse>('/api/painters/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};