import Icon from '../ui/Icon';
import type { SeccionCripto } from '../../types';

interface PanelCriptograficoProps {
  titulo: string;
  secciones: SeccionCripto[];
  abierto?: boolean;
}

function colorValor(valor: string): string {
  if (valor.startsWith('✔')) return 'text-primary font-semibold';
  if (valor.startsWith('✘')) return 'text-error font-semibold';
  return 'text-on-surface';
}

export default function PanelCriptografico({ titulo, secciones, abierto = false }: PanelCriptograficoProps) {
  if (secciones.length === 0) return null;

  return (
    <details open={abierto} className="w-full rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-left">
      <summary className="cursor-pointer select-none flex items-center gap-2 px-space-md py-space-sm font-title-md text-title-md text-primary">
        <Icon name="key" className="text-[20px]" />
        <span>{titulo}</span>
      </summary>
      <div className="flex flex-col gap-space-md px-space-md pb-space-md">
        {secciones.map((seccion, indice) => (
          <div key={`${seccion.titulo}-${indice}`} className="flex flex-col gap-2">
            <h4 className="font-label-md text-label-md text-on-surface uppercase tracking-wider border-b border-outline-variant/30 pb-1">
              {seccion.titulo}
            </h4>
            {seccion.descripcion && (
              <p className="font-body-sm text-body-sm text-on-surface-variant">{seccion.descripcion}</p>
            )}
            <dl className="grid grid-cols-1 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] gap-x-space-md gap-y-1.5">
              {seccion.filas.map((fila) => (
                <div key={fila.etiqueta} className="contents">
                  <dt className="font-label-sm text-label-sm text-secondary pt-1">{fila.etiqueta}</dt>
                  <dd className="min-w-0">
                    <pre className={`font-mono text-[11px] leading-4 whitespace-pre-wrap break-all max-h-32 overflow-y-auto bg-surface-container rounded px-2 py-1 ${colorValor(fila.valor)}`}>
                      {fila.valor}
                    </pre>
                    {fila.nota && (
                      <span className="font-body-sm text-body-sm text-on-surface-variant">{fila.nota}</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </details>
  );
}
