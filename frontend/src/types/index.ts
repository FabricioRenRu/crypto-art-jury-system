/**
 * types/index.ts
 * Tipos e interfaces de TypeScript compartidos en toda la app
 * (navegación, categorías, fases del concurso y obras a validar).
 */

/** Un enlace del menú de navegación principal. */
export interface NavItem {
  label: string;
  path: string;
}

/** Una categoría oficial del concurso (tarjetas de la página de Inicio). */
export interface Category {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

/** Una fase del concurso (sección "Fases del Concurso" en Inicio). */
export interface ContestPhase {
  number: string; // "01", "02", ...
  title: string;
  description: string;
}

/** Una obra en revisión anónima para el visto bueno del presidente. */
export interface Artwork {
  id: string; // ID anónimo, ej. "ART-9012"
  title: string;
  category: string;
  score: number; // Puntuación sobre 10
  status: string; // Ej. "Listo para firma"
}

/** Variantes del encabezado: público (Inicio) o competencia (resto de páginas). */
export type HeaderVariant = 'public' | 'competition';
