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


/** Perfil mostrado en el encabezado del Panel del Pintor. */
export interface PainterProfile {
  name: string;
  tournament: string;
  avatarUrl: string;
}

/** Una obra subida por el pintor (tarjeta del Panel del Pintor). */
export interface PainterArtwork {
  id: string;
  slot: number; // Numero de slot que ocupa (1, 2, ...)
  totalSlots: number; // Slots disponibles en total
  title: string;
  description: string;
  status: string; // Ej. "En Evaluación"
  imageUrl: string;
}

/** Una obra anonima en la cola del jurado. */
export interface JuryArtwork {
  id: string; // Codigo anonimo, ej. "#PNT-4092"
  title: string;
  imageUrl: string;
}

/** Una opcion de la hoja de calificacion del jurado (1 a 3 estrellas). */
export interface StarOption {
  value: number;
  label: string;
  description: string;
}

/** Un finalista del concurso con las calificaciones de los 3 jurados. */
export interface Finalist {
  position: number; // 1 = primer lugar
  id: string; // ID anonimo, ej. "ART-9012"
  title: string;
  artist: string;
  country: string;
  category?: string; // Solo se muestra en el podio (top 3)
  heroImageUrl?: string; // Imagen grande del podio (top 3)
  imageUrl: string; // Miniatura de la tabla
  juryScores: number[]; // Una calificacion por jurado (escala 1-9)
  juryComments: string[]; // Un comentario por jurado
  prize: string | null; // Premio en efectivo; null si no recibe
}
