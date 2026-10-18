/**
 * data/juryQueue.ts
 * Cola de obras anonimas que el jurado debe calificar y las opciones de estrellas.
 * Los codigos anonimos de la 2da a la 6ta obra son de ejemplo (el diseno solo traia el de la primera).
 */
import type { JuryArtwork, StarOption } from '../types';

export const JURY_QUEUE: JuryArtwork[] = [
  {
    id: '#PNT-4092',
    title: 'Centinela del Abismo',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuATRcADVe_hujaiZeBHVhq8gCJvSCNywl66Y25WhaUoroK9Tgc4TwViuioz9nISIRj-kmaEgndjGO2Z5PkcH-zKvHxvFT1eVLzAzC7R-E-PIhsnpLaLuHVzAag8Z2gZtZ95ecC8ZHBRvYgl40loVFs6xz1gMFZtokkWC6tYnWGIgIAZa_mxoEGVIXv0SN3NOh0jFvZ126eb-D3emkrLmDXEKpQ6igpTYR2ZNaOjyP0434REQdVQkzEe',
  },
  {
    id: '#PNT-4105',
    title: 'Lluvia Cibernética',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAgnVs6Vhy9fzKejbEXVH73JseobWhwSTL4jDufhWZOWzZQRz08v0p4bfrV-dAXbRqiPHdPkhYuLtorKiRq16vcjg_7krDlQdkvqlGv9OFtbAOR3_3PVRWqN1ZV5ezIvRmHNitkiP4Ezyo1xjDVMzX_Vo0mxlCtHTTmZ4-MwE_Om4HbiBfpjQdBPleMChuRUERlr4_5vdEyVdkYkxSzRt277FUBII-FK1KCP3PxgKlCm3Rwjvf7RpdH',
  },
  {
    id: '#PNT-4118',
    title: 'Santuario Aéreo',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDiYQh_V7RZV4sb4D_OUWJ6NST20SYF4r-5eI1vaZSDRhcm6r5i_wsJYwytlM19kGXXn5jw5KSSAyOY6Bml7cBbM3k3--vOGlf57b3WkhJa-d95kg_41l8pZABO1Ym1yQ9nNPzGlxwF5D5k97-S7vk4c5mtj8HnUnLMcgP34RwK9Bcta7HvWIXD2IbU9Q-LLJMWXmQ3mm7A10t4sEPKqb0sLKU-N4PM5w4qE05HerqMsIQXLwCswuFt',
  },
  {
    id: '#PNT-4127',
    title: 'Fractura Áurea',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAoObKE9pFLWF47RcTm0O3Od-kOyRCxUCG2ZDWHDm7A2XHlWncB_XsEcmzAK8xBsXfYqnQyLtFFMaTUCj5U8Hznxyo8vH0ENdo0DsGEEjy4BHzquUaWg_JHFuOHjswoN2OV1WefRCpekbVG7GnwoR4kmaf5ClB93iLwbfMPK0o-iMPi3SdM1SjM6vvSCGEmmGCmFxNAevAjVDPVhcuaXgdlZ3jIUA1Ho1cD-oKcTyO_K8vaQrWLTntR',
  },
  {
    id: '#PNT-4133',
    title: 'Fosa Abisal',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD0UlQj_DZX5nb9OvdFwKeRUft3wPii1smePdW0R1hNfVrKUjj6CgAZzEzAfCsZ26jTkH0Tx3LR0L9Y_bnjT4FdN50AJUPCz8swmCE-g7pFjqJwYqbRtZ7fLUtdMbnCWhW8FVkHsV1dkr85kqfbGO6vlipv4tmO8vLbD_OwcG-tBIWlV09_3vuY-rihQa9nOYYTf9heELbixLyCScKW8GLjg0pMTJ0HYAt8QUpPpibbPsfWfXa41kvF',
  },
  {
    id: '#PNT-4146',
    title: 'Protocolo Titán',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB4vR-ZHSHelgBxeqnTioo3d6S9E9iiYlo4cUuj_Y8oC1xvzoL4m6H5uSuhXMP3NIjqmitxKNp-_sn4mNbBZvUEpHP7pGcdi3a7uC9O-umur90vBZCcd8HD8U3-Igqh-qzp8bF7ypc2AUo2I69Tw0IqI2ZUvzZay_ptT1LQxKD8ZE6wKhFzFXPFmomczbYnn7oChPQs7S6w_oNL3_CJZm2887nd7H6VkUeEJ-aIsi2tPs1_v3Gufvxj',
  },
];

/** Las tres opciones de calificacion (1 a 3 estrellas) de la hoja del jurado. */
export const STAR_OPTIONS: StarOption[] = [
  { value: 1, label: '1 Estrella', description: 'Not good enough' },
  { value: 2, label: '2 Estrellas', description: 'Good' },
  { value: 3, label: '3 Estrellas', description: 'The work is outstanding' },
];

/** Resumen del turno del jurado (progreso mostrado en el encabezado). */
export const JURY_TURN = {
  assigned: 25,
  completed: 18,
};
