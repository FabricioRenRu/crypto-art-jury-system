/**
 * components/podium/ResultsTable.tsx
 * Tabla general de posiciones con buscador por artista, obra o pais.
 */
import { useState } from 'react';
import Icon from '../ui/Icon';
import { averageScore } from '../../utils/scores';
import type { Finalist } from '../../types';

interface ResultsTableProps {
  finalists: Finalist[];
}

/** Color del circulo de puesto segun la posicion (igual que el diseno original). */
function rankClass(position: number): string {
  if (position === 1) {
    return 'bg-primary-container text-on-primary';
  }
  if (position === 2) {
    return 'bg-secondary text-surface';
  }
  if (position === 3) {
    return 'bg-tertiary-container text-on-primary';
  }
  return 'bg-surface-variant text-on-surface';
}

export default function ResultsTable({ finalists }: ResultsTableProps) {
  /** STATE: texto escrito en el buscador. */
  const [query, setQuery] = useState('');

  const normalized = query.toLowerCase().trim();
  const visibles = finalists.filter(
    (finalista) =>
      finalista.artist.toLowerCase().includes(normalized) ||
      finalista.title.toLowerCase().includes(normalized) ||
      finalista.country.toLowerCase().includes(normalized),
  );

  const juryCount = finalists[0]?.juryScores.length ?? 0;
  const juryNumbers = Array.from({ length: juryCount }, (_, i) => i + 1);

  return (
    <section className="w-full px-gutter py-space-xl max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Tabla General de Posiciones</h2>
          <p className="font-body-md text-body-md text-secondary">
            Clasificación consolidada de los finalistas de la temporada.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar artista u obra..."
            className="w-full bg-surface-container pl-10 pr-4 py-2.5 rounded text-on-surface font-body-md text-body-md placeholder:text-secondary focus:outline-none focus:ring-1 focus:ring-primary-container transition-all"
          />
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-xl bg-surface-container-high shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-highest text-secondary font-label-sm text-label-sm uppercase tracking-wider">
              <th className="py-4 px-4 font-medium text-center w-16">Puesto</th>
              <th className="py-4 px-6 font-medium">Obra</th>
              <th className="py-4 px-4 font-medium">Artista</th>
              {juryNumbers.map((numero) => (
                <th key={`nota-${numero}`} className="py-4 px-3 font-medium text-center">
                  Jurado {numero}
                </th>
              ))}
              {juryNumbers.map((numero) => (
                <th key={`comentario-${numero}`} className="py-4 px-4 font-medium min-w-[200px]">
                  Comentarios J{numero}
                </th>
              ))}
              <th className="py-4 px-6 font-medium text-right">Estrellas Totales</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant font-body-md text-body-md">
            {visibles.map((finalista) => (
              <tr key={finalista.id} className="hover:bg-surface-bright/50 transition-colors">
                <td className="py-4 px-4 text-center">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold font-label-md text-label-md ${rankClass(finalista.position)}`}
                  >
                    #{finalista.position}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <img
                      alt={finalista.title}
                      className="w-10 h-10 rounded object-cover shadow-sm"
                      src={finalista.imageUrl}
                    />
                    <span className="font-title-md text-title-md text-on-surface font-bold">
                      {finalista.title}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  <span className="text-on-surface font-medium block">{finalista.artist}</span>
                  <span className="font-label-sm text-label-sm text-secondary">{finalista.country}</span>
                </td>
                {finalista.juryScores.map((nota, indice) => (
                  <td key={`nota-${indice}`} className="py-4 px-3 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 font-label-md text-label-md text-primary font-medium">
                      <Icon name="star" filled className="text-[16px]" />
                      {nota.toFixed(1)}/9
                    </span>
                  </td>
                ))}
                {finalista.juryComments.map((comentario, indice) => (
                  <td
                    key={`comentario-${indice}`}
                    className="py-4 px-4 text-body-sm text-secondary italic min-w-[200px]"
                  >
                    “{comentario}”
                  </td>
                ))}
                <td className="py-4 px-6 text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-1.5 justify-end">
                    <Icon name="star" filled className="text-[18px] text-primary" />
                    <span className="font-headline-sm text-headline-sm text-primary-container font-bold">
                      {averageScore(finalista.juryScores).toFixed(1)}
                    </span>
                    <span className="font-label-sm text-label-sm text-secondary">/ 9</span>
                  </div>
                </td>
              </tr>
            ))}
            {visibles.length === 0 && (
              <tr>
                <td
                  colSpan={4 + juryCount * 2}
                  className="py-10 text-center text-secondary font-body-md text-body-md"
                >
                  No hay resultados para "{query}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
