/**
 * data/painterSession.ts
 * Pintor "en sesión". Todavía no hay login ni endpoint que diga quién es el pintor actual,
 * así que se toma de variables de entorno (ver frontend/.env.example).
 *
 * VITE_PAINTER_ID debe ser el UUID del pintor que ya existe en la tabla `pintores`.
 */
export const PINTOR_ACTUAL = {
  id: import.meta.env.VITE_PAINTER_ID ?? '00000000-0000-0000-0000-000000000000',
  nombre: import.meta.env.VITE_PAINTER_NAME ?? 'Kaelen Voss',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDnLc-IbUukRYHnOjwQ7cwbyIrnSyeWcuepX9J8YkD7PK_YO5wWor585XD51ux__mgiKwkYUFDjmchwt2WJsOVSBTqlkJqrb2zWRDr_sBHOCo4d325Zi5YoZsbPNZEUPGjPMCueIjXNSBjTDUtvZ9Jv_gXti2MGt-sTq2rl4FqxvNZaC6FDWb1MWfSqzWBV1bkXVKjYg2XChdjPwuoKoXZbTQy0OY-mI5VdgLX3bY4-k3aE8famyEuK',
} as const;
