/**
 * data/artworks.ts
 * Obras de ejemplo (datos simulados) que el presidente revisa en "Visto Bueno Presidente".
 * Cuando exista un backend, esta lista se reemplaza por una petición a la API.
 */
import type { Artwork } from '../types';

export const ARTWORKS_FOR_APPROVAL: Artwork[] = [
  { id: 'ART-9012', title: 'El Susurro de las Estrellas', category: 'Fantasía Digital', score: 9.4, status: 'Listo para firma' },
  { id: 'ART-9034', title: 'Ecos del Cíber-Oeste', category: 'Concept Art', score: 9.2, status: 'Listo para firma' },
  { id: 'ART-9078', title: 'Luz entre las Ruinas', category: 'Óleo Digital', score: 9.1, status: 'Listo para firma' },
  { id: 'ART-9105', title: 'Vórtice Carmesí', category: 'Ilustración Libre', score: 8.9, status: 'Listo para firma' },
  { id: 'ART-9118', title: 'Sinfonía Mecánica', category: 'Concept Art', score: 8.8, status: 'Listo para firma' },
];
