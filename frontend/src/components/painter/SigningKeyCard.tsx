/**
 * components/painter/SigningKeyCard.tsx
 * Muestra y administra la llave de firma ECDSA P-256 del pintor.
 *
 * - "Generar": crea un par nuevo en el navegador (Python/Pyodide).
 * - "Importar": carga la llave privada PEM que ya se tenga (p. ej. la del pintor registrado
 *   en la BD) y calcula su llave pública y su huella.
 * La llave privada nunca se envía a ningún lado; solo se puede descargar a mano.
 */
import { useRef } from 'react';
import Icon from '../ui/Icon';
import { agruparHex, copiar, descargar } from '../../lib/formato';
import type { LlavesFirma } from '../../types/painterPanel';

interface SigningKeyCardProps {
  llaves: LlavesFirma | null;
  motorListo: boolean;
  ocupado: boolean;
  error: string | null;
  onGenerar: () => void;
  onImportar: (archivo: File) => void;
}

const botonSecundario =
  'px-3.5 py-2 bg-surface-container hover:bg-surface-bright text-on-surface font-label-sm text-label-sm rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

export default function SigningKeyCard({
  llaves,
  motorListo,
  ocupado,
  error,
  onGenerar,
  onImportar,
}: SigningKeyCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const bloqueado = !motorListo || ocupado;

  return (
    <section className="bg-surface-container-high rounded-xl p-space-lg flex flex-col gap-space-md shadow-lg">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-space-md">
        <div className="flex items-start gap-space-sm">
          <div className="w-10 h-10 rounded-lg bg-primary-container/20 text-primary-container flex items-center justify-center shrink-0">
            <Icon name="key" className="text-[22px]" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Llave de firma (ECDSA P-256)
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-2xl mt-1">
              Con esta llave firmas tu consentimiento. La pública es la que el servidor guarda en{' '}
              <code className="font-label-sm text-label-sm text-primary">clave_publica_firma</code>; la privada
              nunca sale de tu navegador.
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-sm text-label-sm uppercase tracking-wider ${
            motorListo ? 'bg-surface-container text-primary' : 'bg-surface-container text-secondary'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${motorListo ? 'bg-primary-container' : 'bg-tertiary animate-pulse'}`}
          />
          {motorListo ? 'Motor Python listo' : 'Cargando Python…'}
        </span>
      </div>

      {llaves ? (
        <div className="flex flex-col gap-space-sm bg-surface-container rounded-lg p-space-md">
          <div className="flex flex-wrap items-center gap-space-sm">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary bg-primary-container/15 px-2 py-0.5 rounded">
              {llaves.origen === 'generada' ? 'Generada aquí' : 'Importada'}
            </span>
            <span className="font-label-sm text-label-sm text-secondary uppercase">Huella SHA-256</span>
          </div>
          <p className="font-label-md text-label-md text-on-surface break-all">
            {agruparHex(llaves.huella.slice(0, 32))} …
          </p>
          <details className="group">
            <summary className="cursor-pointer font-label-sm text-label-sm text-primary uppercase tracking-wider select-none">
              Ver llave pública (PEM)
            </summary>
            <pre className="mt-2 bg-surface-container-lowest text-on-surface-variant p-space-sm rounded-lg font-label-md text-label-md overflow-auto">
              {llaves.publica}
            </pre>
          </details>
          <div className="flex flex-wrap gap-space-sm pt-1">
            <button className={botonSecundario} onClick={() => copiar(llaves.publica)}>
              <Icon name="content_copy" className="text-[16px]" />
              Copiar pública
            </button>
            <button
              className={botonSecundario}
              onClick={() => descargar('llave_privada_pintor.pem', llaves.privada, 'application/x-pem-file')}
            >
              <Icon name="download" className="text-[16px]" />
              Descargar privada
            </button>
          </div>
        </div>
      ) : (
        <p className="font-body-sm text-body-sm text-secondary bg-surface-container rounded-lg p-space-md">
          Aún no hay llave de firma cargada. Genera una nueva, o importa la llave privada del pintor registrado
          para que la firma coincida con la llave pública guardada en la base de datos.
        </p>
      )}

      {error && (
        <p className="flex items-start gap-2 font-body-sm text-body-sm text-error">
          <Icon name="error" className="text-[18px]" />
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-space-sm">
        <button
          onClick={onGenerar}
          disabled={bloqueado}
          className="px-4 py-2 bg-primary-container hover:bg-tertiary-container text-on-primary font-label-md text-label-md uppercase tracking-wider rounded-lg transition-all font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Icon name="vpn_key" className="text-[18px]" />
          {llaves ? 'Generar otra' : 'Generar par de llaves'}
        </button>
        <button onClick={() => inputRef.current?.click()} disabled={bloqueado} className={botonSecundario}>
          <Icon name="upload_file" className="text-[16px]" />
          Importar privada (.pem)
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pem,.key,text/plain"
          className="hidden"
          onChange={(e) => {
            const archivo = e.target.files?.[0];
            if (archivo) onImportar(archivo);
            e.target.value = ''; // permite volver a elegir el mismo archivo
          }}
        />
      </div>
    </section>
  );
}
