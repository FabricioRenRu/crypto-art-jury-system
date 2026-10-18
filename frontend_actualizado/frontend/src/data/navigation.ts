/**
 * data/navigation.ts
 * Enlaces del menú principal (Header) y del pie de página (Footer).
 */
import type { NavItem } from '../types';
import { PATHS } from '../routes/paths';

/** Menú principal del encabezado, en el mismo orden que el diseño original. */
export const MAIN_NAV: NavItem[] = [
  { label: 'Inicio', path: PATHS.inicio },
  { label: 'Registro Pintor', path: PATHS.registroPintor },
  { label: 'Registro Jurado', path: PATHS.registroJurado },
  { label: 'Panel Pintor', path: PATHS.panelPintor },
  { label: 'Evaluación Jurado', path: PATHS.evaluacionJurado },
  { label: 'Visto Bueno Presidente', path: PATHS.vistoBuenoPresidente },
  { label: 'Resultados & Podio', path: PATHS.resultados },
];

/** Enlaces informativos del footer (aún sin página propia, apuntan a "#"). */
export const FOOTER_LINKS: NavItem[] = [
  { label: 'Reglamento Oficial', path: '#' },
  { label: 'Guías Técnicas de Lienzo', path: '#' },
  { label: 'Criterios de Evaluación', path: '#' },
  { label: 'Términos y Privacidad', path: '#' },
];
