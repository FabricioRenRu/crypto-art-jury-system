/**
 * data/phases.ts
 * Las cuatro fases del concurso que se muestran en la página de Inicio.
 */
import type { ContestPhase } from '../types';

export const CONTEST_PHASES: ContestPhase[] = [
  {
    number: '01',
    title: 'Inscripción',
    description: 'Envío de obra terminada con archivos fuente por capas y time-lapse de proceso.',
  },
  {
    number: '02',
    title: 'Calificación',
    description: 'Revisión anónima del jurado internacional aplicando las rúbricas oficiales de evaluación.',
  },
  {
    number: '03',
    title: 'Validación',
    description: 'Supervisión final y ratificación de puntajes por la Presidencia del Tribunal.',
  },
  {
    number: '04',
    title: 'Podio',
    description: 'Anuncio de los ganadores por categoría y entrega oficial de los reconocimientos.',
  },
];
