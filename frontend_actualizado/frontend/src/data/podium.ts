/**
 * data/podium.ts
 * Finalistas del concurso con las calificaciones de los 3 jurados, ordenados por puesto.
 * El promedio (estrellas totales) se calcula en el componente, no se guarda aqui.
 * Los codigos ART-xxxx coinciden con los del modal de verificacion de firma.
 */
import type { Finalist } from '../types';

export const FINALISTS: Finalist[] = [
  {
    position: 1,
    heroImageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAZBdxo02zQjJaoTMnxMJMD3hLxtQPRS2NgN5X3E7Aqjh3GFtZSaxHiQbeqzgNOu6RMCuLdH-bT_ZLlK6MnUJCxo1y8IQm0zvOnMpV-Ce9A0870y70mKBRvgGthfOsaLETn1Wqr7eJ4BZ4KFYmKzY0u4nfrGxWrWu3ha15SuNz9ezanpo452l091M4wPDrE31MQZWf644oIQ7A8aAL091zYeTJY3fY2VWTW1EgzeOMdnhWjxJxP8uSB',
    id: 'ART-9012',
    title: 'El Susurro de las Estrellas',
    artist: 'Elena Rostova',
    country: 'Rusia',
    category: 'Neo-Fantasía Cósmica',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDttxPAJo821wm0r5mcfr_Z-PrgkGbw8BcaFJydJobrhCQY4Aw0WmGBDMfcRwF39OzHGF0t-aEG8cVufChqbfjScLam8WYryfw8vlVuwr197D49ZWWeytvisciZURnQqJZQP0uKUUw34v4KX_qxdT7AgenS1Av0wpyMew7pqKELYtHBzZA0JAdhvfWUJPuvRagFCgrVzwVc0N5t-9Iq6DfJKG0cMBJjh2d1pLvupeMyLfDoj5ZJZJvy',
    juryScores: [9.0, 9.0, 9.0],
    juryComments: [
      'Composición celestial con una armonía lumínica insuperable.',
      'Manejo sublime de la paleta cósmica y narrativa visual lírica.',
      'Perfección técnica absoluta y ejecución digital de nivel maestro.',
    ],
    prize: '$12,000 USD',
  },
  {
    position: 2,
    heroImageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBDV419yjXcPTyRNMZ04KwZ49Mcd8041j7MDmC5vYkZvSbbruWE_pQhd1I8Ee5q9XI0qwZWLu6kzx7jyVg9WA_CuzTFcnF0X7xRj94-GnyVNJ8RFZ0YBl7O2KALPNBmOYinnhQEpw7_or9FbyXJEw7RXqo-TXBPUrJepXFvjor4qK6ccspFTeAr1HPmozt9pINl5GJ38NO9OHx5ZBZgApPe8uQn5l3pvtj3DdPPnSdUbRjR9RlYN-Ps',
    id: 'ART-9034',
    title: 'Ecos del Cíber-Oeste',
    artist: 'Mateo Silva',
    country: 'España',
    category: 'Cyber-Surrealismo',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBpJU_ZdmaXXm69wlm07ceAoly-MpZ_-wU3Q8glPHY7k0PZDtxCaR7vQSQTdqsL8JU-IEcznyr7G57X6sKSFxDdKdM-kmmweHdwqulqlc2lJ86MxkieqtWNzZR8hrWwmUq_l_8hgp_7CltXTqxyqdyD-_lavZxW0goBlPj2mposkJtqpBOUzI3JXI89N7LIq-fRWHvGt1m5mkVa3A_1tFejwLf57NUXpakGPI1fLTfVvZi54GmkIoSG',
    juryScores: [8.8, 8.9, 8.7],
    juryComments: [
      'Fusión estilística audaz con texturas mecánicas de enorme riqueza.',
      'Tratamiento del atardecer y perspectiva atmosférica impecables.',
      'Carácter visceral y sólido diseño conceptual en cada plano.',
    ],
    prize: '$7,000 USD',
  },
  {
    position: 3,
    heroImageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD9pRhm8QKpWY9Vzvzkz-W5k1A_nN_5OTCZAI_LprtiSeedRPmueeXfAzONRWZmps6TTmT09lmo_LRaqoxyhDhXI_JNYxpTDNITnT_K-b_a2fotjJ1ucSd_G7HwjJoxZPcVFLOhONtxBZkVAIfSIiB3PRB6MA0RXSw7vj2wklIDSaTSL8buV1ntV7IBj24OVmBezW_tRhLkh_xFtwVTmzixBXJstHqwsbQJGylkG4hq8tpvuBmKCQ0J',
    id: 'ART-9045',
    title: 'Luz entre las Ruinas',
    artist: 'Aiko Tanaka',
    country: 'Japón',
    category: 'Fantasía Ambiental',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDx-ACpJOSSAEyeo1wyCnMfTGBs7pmh4UDHOutl04NZD1OsV-EbkMttVWv6-41L68Ewnx_7owpD7p03-_0p0BbJljzM1hjJZL41M2yrMnifQds9rhr5Rwq69l7lmRL5FeABKZ_UDI7WIv68qIk0QKz8aLhyaEVOomX1NoNMM0wYMs6V8mPAtXm1ctIt3_HvPhSJxN5mrvOb8hmh-V2AwOC0audVPRKLWrBfzemT81K13q93lMkR_8aZ',
    juryScores: [8.5, 8.6, 8.4],
    juryComments: [
      'Sensibilidad poética única con juego de contraluces orgánicos.',
      'Ambiente sereno que transmite nostalgia y gran profundidad botánica.',
      'Elegante gradación tonal en las sombras y niebla volumétrica.',
    ],
    prize: '$4,000 USD',
  },
  {
    position: 4,
    id: 'ART-9071',
    title: 'La Memoria del Mercurio',
    artist: 'Marcus Vance',
    country: 'Canadá',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCYs2zY5ll-_ojq0S0U0c1ZDPZUa3irghJLddp3jlz75FZAvjxZYDJGoSPOcF96o0oTCbwr7El9plLFh8ZxHLAADRe7jab6MSlghybY6PSkxwiQTOsacOULyVpaBUcBLXHrm-SxPnMrWZC4ILKoQhQNnqW7M9nnof9RJMDABOye1JUXpgGEuPTiltOFdufHFTlY7vUZpUDLOmbZjLPt3eCc8W36GSfWPPZFsw7xTpSrpaFfsBpmIiQw',
    juryScores: [8.4, 8.3, 8.5],
    juryComments: [
      'Excelente reflejo metálico y control dinámico del color plateado.',
      'Concepto surrealista potente con notable precisión anatómica.',
      'Gran fuerza expresiva aunque ligeramente denso en el tercio inferior.',
    ],
    prize: null,
  },
  {
    position: 5,
    id: 'ART-9082',
    title: 'Núcleo en Ignición',
    artist: 'Chloe Dubois',
    country: 'Francia',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAIRFLoYHncIbqGjMcLuDBXxBntne4Teq1pHQTxwPBFf8M--0ad_Uv-US8yGNxXMm-_YHNjEkIdRH6ih6HN6_tN02UiNjcbbJOEpXQREL70m7IskQSAbCozxmv68igJ4fehsA_Gz5J4oMFxSgksc_ne0oJjjp7qRWaXwwqF8fdoroBokFT4n0TraMkLdJ0B7XIkpWbP4dBhOMdZy11RIsFw4OTOXj9DjwSsASo9IS8Rgc1DL8r3HV9F',
    juryScores: [8.3, 8.2, 8.4],
    juryComments: [
      'Intensidad lumínica ardiente y audaz dispersión de partículas.',
      'Energía cinética palpable; balance de contrastes muy acertado.',
      'Excelente gradiente térmico con texturas volcánicas vibrantes.',
    ],
    prize: null,
  },
  {
    position: 6,
    id: 'ART-9099',
    title: 'Catedral de Humo',
    artist: 'Krzysztof Nowak',
    country: 'Polonia',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAkfocnInwC7QCMaxXRlhgAqMV-84W90ROj_RWN2HwLNCE4R2PKPenUW5aE5cNb5wHkyF42mcfCRmnZxNCc3DrXh-HmZi3g-qeZclSAeCYnvbcCPALio1d-Uz_6DySVsKQ3UlM8FASVpoXjMP48n3ycFOyJ4NXLj7Iuo7GB7q-LVz1YndO3mIPB94sgZuYNEcgV3UdLGIZdg5PPq5dNbnnC7M2nKjQd3Q0MUdjOFWXsoWVk55OiNJqh',
    juryScores: [8.2, 8.1, 8.3],
    juryComments: [
      'Estructura gótica imponente envuelta en brumas etéreas sublimes.',
      'Atmósfera densa y cautivadora; misterio plástico muy logrado.',
      'Dominio de la escala monumental y el dibujo arquitectónico.',
    ],
    prize: null,
  },
];

/** Llave publica y hash de ejemplo mostrados en el modal de verificacion de firma ciega. */
export const PRESIDENT_SIGNATURE = {
  publicKey: '0x7F4A8812B9DE0034CC788B89C',
  hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  scheme: 'BLIND-RSA-2024',
};
