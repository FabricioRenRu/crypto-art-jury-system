/**
 * data/categories.ts
 * Las cuatro categorías oficiales del concurso que se muestran en la página de Inicio.
 */
import type { Category } from '../types';

export const CATEGORIES: Category[] = [
  {
    id: 'concept-art',
    title: 'Concept Art & Sci-Fi',
    description:
      'Diseño de entornos cinemáticos, naves, estructuras futuristas y mundos de ficción para producción digital.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCwmKaX_A5xFtIg654RolWlP6sz_Ju0r7btdSGRTpyICtowaBKgS1yblSw93bjdjVvYsTvEXVjt0iGYrEzdfmALqaC0mBKJPVSoVEOjuhMamWRyRMKNcJf6eMhFrERziNHvOgyScToUii_QkhOB4T9JmlP6F8e-K4RNlTeARg6M_Cz9BU3L4sJTUK6YSHILFvM7-YD17vqfxhn3pau6PIkOFG519mry4WV-ESe2F2eK6bJfOrYzrq6P',
  },
  {
    id: 'oleo-digital',
    title: 'Óleo Digital & Fantasía',
    description:
      'Técnica clásica adaptada al pincel digital, con texturas matéricas, misticismo y narrativa fantástica.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDcV2DnBf1zd-KHKyh4EbzSDQw5kYnyFitESlZ0iP7tveGQJCcfQcd38hzCUErurAjHPkHBlWZJavUrSY2XXD6SrRwlUTmHcFrzUkfCJ6ydP7UbDCKoS7jWPf0cEve5dJpCxfEshJS0oRfNFRviDIWcyzONmqsz3sDsn0i3q9hCb0kDtIZvG6IwKWVshyNjd2ifgJYV3pN6mnQTxXfdulgtuko6z6aWOpCBkoL_2vuFWuSkbUX8vCYT',
  },
  {
    id: 'retrato',
    title: 'Retrato Hiperrealista',
    description:
      'Profundidad psicológica y dominio anatómico mediante un manejo minucioso de luces, sombras y microtexturas.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC9X3cE_nbQBqDuOp-spB5YLQKZdNiFsbzk3IXTqK53Mn_9FkizvCc2VKrhrsHPJ10aLorRNyc0pU40K_7eFfEaFjdMxGXbtYMXOwasqf0ej2qeL1b-mTwn5BjK8xBBPJ9wqGmK8UcS2B8WCg2L6CGs_uVfLY5i0Ta1hsT93cbX7J538zROnhZy46PHhpLvA6rxFY4KoFKTQcwhRVT214SZ3_ntjRIuIrOJfClqyFVdVZgrYdx8nSFz',
  },
  {
    id: 'ilustracion-libre',
    title: 'Ilustración Libre',
    description:
      'Exploración de vanguardias visuales, surrealismo y lenguaje gráfico con libertad de soporte e interpretación.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBBLaFq3J0tAzmztkDI-P0VW-P-e0kwdREseTvPlMwz_87bW7pBmf21qZArBXLe9ggobSoCYclgjIx6b85E32uH5zDBK6bxdb2CO96F4FHvDDIW2QipiTU0U2TXPNiAafJNU68PfO5zbWCR3RhOpEUajmfGxtXurX15ke8lbuEWNIvlsz6b-tPXAq5f64sbD6T6EFBN9QBg7OSEsxS0-73Ce8saxe6d-s5Uk-jsqiq6Hf-xP376aziX',
  },
];
