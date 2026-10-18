/**
 * data/painterPanel.ts
 * Datos de ejemplo del Panel del Pintor (perfil y obras subidas).
 * Cuando exista el backend, se reemplazan por la respuesta de la API.
 */
import type { PainterProfile, PainterArtwork } from '../types';

export const PAINTER_PROFILE: PainterProfile = {
  name: 'Kaelen Voss',
  tournament: 'Torneo Internacional ArtClash Pro 2024',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDnLc-IbUukRYHnOjwQ7cwbyIrnSyeWcuepX9J8YkD7PK_YO5wWor585XD51ux__mgiKwkYUFDjmchwt2WJsOVSBTqlkJqrb2zWRDr_sBHOCo4d325Zi5YoZsbPNZEUPGjPMCueIjXNSBjTDUtvZ9Jv_gXti2MGt-sTq2rl4FqxvNZaC6FDWb1MWfSqzWBV1bkXVKjYg2XChdjPwuoKoXZbTQy0OY-mI5VdgLX3bY4-k3aE8famyEuK',
};

export const PAINTER_ARTWORKS: PainterArtwork[] = [
  {
    id: 'obra-01',
    slot: 1,
    totalSlots: 1,
    title: 'El Susurro de las Estrellas',
    description:
      'Alegoría cósmica sobre la memoria y la gravedad estelar, desarrollada con iluminación difusa en espacio sRGB.',
    status: 'En Evaluación',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB3OKSbNVDewh79FGr0_FnC6qJq2OnE9YQG1lpvGForl5C2CXOlMetdNQ7gv8peYHcDMOBj1ds4BQ21Xk_iajehyLo_kpDQGkvWaajyLOnIOa18ELZoOjKRzVa_tpPsdmXqEG9yODkER1j_N5N0HwXMTnQfx-EhXFm9i0NvR6_RVeHzOBk54Z8MV_04e2Dzt7rGFPlxoavEvFN4i-jyXQ1XkSgqAkOyk5n6iy1hbgyp3x1w8SwRj_bT',
  },
];
