/**
 * data/navigation.ts
 * Enlaces del menú principal (Header) y del pie de página (Footer).
 * Cada enlace dice qué tipo de usuario lo ve; sin `roles` lo ven todos.
 */
import type { NavItem, RolUsuario } from '../types';
import { PATHS } from '../routes/paths';

/** Menú principal del encabezado. */
export const MAIN_NAV: NavItem[] = [
  { label: 'Inicio', path: PATHS.inicio },
  { label: 'Registro Pintor', path: PATHS.registroPintor, roles: ['publico'] },
  { label: 'Panel Pintor', path: PATHS.panelPintor, roles: ['pintor'] },
  { label: 'Evaluación Jurado', path: PATHS.evaluacionJurado, roles: ['jurado'] },
  { label: 'Visto Bueno Presidente', path: PATHS.vistoBuenoPresidente, roles: ['presidente'] },
  { label: 'Resultados & Podio', path: PATHS.resultados },
];

/** Enlaces del menú que le tocan a un tipo de usuario. */
export function navegacionPara(rol: RolUsuario): NavItem[] {
  return MAIN_NAV.filter((item) => !item.roles || item.roles.includes(rol));
}

/** Enlaces informativos del footer (aún sin página propia, apuntan a "#"). */
export const FOOTER_LINKS: NavItem[] = [
  { label: 'Reglamento Oficial', path: '#' },
  { label: 'Guías Técnicas de Lienzo', path: '#' },
  { label: 'Criterios de Evaluación', path: '#' },
  { label: 'Términos y Privacidad', path: '#' },
];