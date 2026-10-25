/**
 * components/painter/UploadModal.tsx
 * Modal "Subir Pintura Digital" (arrastrar y soltar, título, memoria descriptiva y declaración).
 *
 * Al confirmar NO sube nada: entrega los datos a la página, que cifra el archivo (AES-256-GCM)
 * y firma el consentimiento (ECDSA). Mientras eso ocurre se muestra el avance por pasos.
 * El formulario vive en un componente interno para que su estado se reinicie al cerrar el modal.
 */
import { useEffect, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import Icon from '../ui/Icon';
import { formatearBytes } from '../../lib/formato';
import type { PasoProceso } from '../../types/painterPanel';

const MAX_BYTES = 40 * 1024 * 1024; // 40 MB: el archivo se copia varias veces en memoria WASM
const MAX_PALABRAS = 500;

export interface DatosFormulario {
  archivo: File;
  titulo: string;
  descripcion: string;
}

interface UploadModalProps {
  abierto: boolean;
  procesando: PasoProceso | null;
  error: string | null;
  /** Texto que explica por qué no se puede firmar todavía (sin llave, motor cargando…). */
  bloqueo: string | null;
  onCerrar: () => void;
  onEnviar: (datos: DatosFormulario) => void;
}

const PASOS: { id: PasoProceso; texto: string }[] = [
  { id: 'cifrando', texto: 'Cifrando la obra con AES-256-GCM' },
  { id: 'firmando', texto: 'Firmando el consentimiento con ECDSA P-256' },
  { id: 'verificando', texto: 'Verificando firma y descifrado' },
];

const campo =
  'bg-surface-container px-4 py-3 rounded-lg text-on-surface placeholder:text-secondary font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container shadow-inner w-full';
const etiqueta = 'font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-medium';

export default function UploadModal(props: UploadModalProps) {
  if (!props.abierto) return null;
  return <FormularioSubida {...props} />;
}

function FormularioSubida({ procesando, error, bloqueo, onCerrar, onEnviar }: UploadModalProps) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [miniatura, setMiniatura] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [aceptado, setAceptado] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const miniaturaRef = useRef<string | null>(null);

  const ocupado = procesando !== null;
  const palabras = descripcion.trim() ? descripcion.trim().split(/\s+/).length : 0;

  // Cerrar con Escape (salvo mientras se cifra)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !ocupado) onCerrar();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ocupado, onCerrar]);

  // Libera la URL de la miniatura al cerrar el modal
  useEffect(
    () => () => {
      if (miniaturaRef.current) URL.revokeObjectURL(miniaturaRef.current);
    },
    [],
  );

  const elegir = (f: File | undefined) => {
    setErrorArchivo(null);
    if (!f) return;
    if (!f.type.startsWith('image/')) return setErrorArchivo('El archivo debe ser una imagen (JPG, PNG…).');
    if (f.size > MAX_BYTES) return setErrorArchivo(`El archivo supera ${formatearBytes(MAX_BYTES)}.`);
    // Miniatura local del archivo elegido (se libera la anterior, si había)
    if (miniaturaRef.current) URL.revokeObjectURL(miniaturaRef.current);
    miniaturaRef.current = URL.createObjectURL(f);
    setMiniatura(miniaturaRef.current);
    setArchivo(f);
  };

  const alSoltar = (e: DragEvent) => {
    e.preventDefault();
    setArrastrando(false);
    elegir(e.dataTransfer.files?.[0]);
  };

  const puedeEnviar =
    !!archivo && titulo.trim() !== '' && descripcion.trim() !== '' && palabras <= MAX_PALABRAS && aceptado && !ocupado && !bloqueo;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-surface-container-lowest/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 lg:p-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div className="bg-surface-container-high w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col relative my-auto">
        {/* Encabezado */}
        <div className="p-space-lg bg-surface-container flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shadow">
              <Icon name="upload_file" className="text-[22px]" />
            </div>
            <div className="flex flex-col">
              <h2 id="upload-modal-title" className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Subir Pintura Digital
              </h2>
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                Slot 01 de 01 • ArtClash Convocatoria Oficial
              </span>
            </div>
          </div>
          <button
            aria-label="Cerrar modal"
            onClick={onCerrar}
            disabled={ocupado}
            className="w-9 h-9 rounded-lg bg-surface-container-highest hover:bg-surface-bright text-on-surface flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>

        <form
          className="p-space-lg flex flex-col gap-space-lg"
          onSubmit={(e) => {
            e.preventDefault();
            if (puedeEnviar && archivo) onEnviar({ archivo, titulo: titulo.trim(), descripcion: descripcion.trim() });
          }}
        >
          {/* Zona de arrastrar y soltar */}
          <div className="flex flex-col gap-2">
            <label className="font-label-md text-label-md text-on-surface uppercase tracking-wider font-semibold">
              Archivo Maestro de Alta Resolución
            </label>
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
              onDragEnter={(e) => { e.preventDefault(); setArrastrando(true); }}
              onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
              onDragLeave={(e) => { e.preventDefault(); setArrastrando(false); }}
              onDrop={alSoltar}
              className={`relative group rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer min-h-[180px] ${
                arrastrando ? 'bg-surface-container-highest' : 'bg-surface-container-low hover:bg-surface-container'
              }`}
            >
              {/* Contorno punteado con SVG (el diseño evita clases de borde de Tailwind) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-xl" xmlns="http://www.w3.org/2000/svg">
                <rect
                  className="group-hover:stroke-primary transition-colors"
                  fill="none"
                  height="calc(100% - 4px)"
                  rx="12"
                  stroke="#5a4136"
                  strokeDasharray="6 6"
                  strokeWidth="2"
                  width="calc(100% - 4px)"
                  x="2"
                  y="2"
                />
              </svg>

              {archivo && miniatura ? (
                <div className="flex items-center gap-space-md">
                  <img src={miniatura} alt="Vista previa" className="w-24 h-24 object-cover rounded-lg shadow" />
                  <div className="flex flex-col items-start text-left">
                    <span className="font-title-md text-title-md text-on-surface font-semibold break-all">{archivo.name}</span>
                    <span className="font-label-sm text-label-sm text-secondary">
                      {archivo.type} • {formatearBytes(archivo.size)}
                    </span>
                    <span className="font-body-sm text-body-sm text-primary underline mt-1">Cambiar archivo</span>
                  </div>
                </div>
              ) : (
                <>
                  <Icon name="cloud_upload" className="text-[44px] text-primary group-hover:scale-110 transition-transform mb-2" />
                  <span className="font-title-md text-title-md text-on-surface font-semibold">
                    Arrastra y suelta tu lienzo maestro aquí
                  </span>
                  <span className="font-body-sm text-body-sm text-secondary mt-1">
                    o <span className="text-primary underline">explora tus archivos locales</span>
                  </span>
                  <span className="font-label-sm text-label-sm text-outline mt-3">
                    Soporta JPG, PNG, entre otros sin compresión (máx. {formatearBytes(MAX_BYTES)})
                  </span>
                </>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                elegir(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            {errorArchivo && <p className="font-body-sm text-body-sm text-error">{errorArchivo}</p>}
          </div>

          {/* Título */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className={etiqueta} htmlFor="titulo-obra">Título de la Obra *</label>
            <input
              id="titulo-obra"
              className={campo}
              placeholder="Ej. El Despertar del Leviatán"
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          {/* Memoria descriptiva */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className={etiqueta} htmlFor="memoria-obra">Memoria Descriptiva / Concepto de la Pieza *</label>
              <span className={`font-label-sm text-label-sm ${palabras > MAX_PALABRAS ? 'text-error' : 'text-secondary'}`}>
                {palabras} / {MAX_PALABRAS} palabras
              </span>
            </div>
            <textarea
              id="memoria-obra"
              className={`${campo} resize-none`}
              placeholder="Describe el contexto narrativo, la iluminación, fuentes de inspiración y metodología del lienzo..."
              rows={4}
              required
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          {/* Declaración de cumplimiento y anonimato */}
          <div className="p-space-sm bg-surface-container rounded-lg flex items-start gap-space-sm">
            <input
              className="mt-1 w-4 h-4 rounded text-primary-container bg-surface-container-highest focus:ring-primary cursor-pointer"
              id="check-anon"
              type="checkbox"
              checked={aceptado}
              onChange={(e) => setAceptado(e.target.checked)}
            />
            <label className="font-body-sm text-body-sm text-on-surface-variant cursor-pointer" htmlFor="check-anon">
              Confirmo que el archivo cargado no contiene{' '}
              <span className="text-on-surface font-semibold">firmas, isotipos ni marcas de agua identificativas</span>, y que
              certifico la autoría humana original de la pintura. Esta declaración queda firmada digitalmente con mi llave ECDSA.
            </label>
          </div>

          {/* Avisos */}
          {bloqueo && !ocupado && (
            <p className="flex items-start gap-2 font-body-sm text-body-sm text-tertiary bg-surface-container rounded-lg p-space-sm">
              <Icon name="info" className="text-[18px]" />
              {bloqueo}
            </p>
          )}
          {error && (
            <p className="flex items-start gap-2 font-body-sm text-body-sm text-error bg-surface-container rounded-lg p-space-sm">
              <Icon name="error" className="text-[18px]" />
              {error}
            </p>
          )}

          {/* Avance del proceso criptográfico */}
          {ocupado && (
            <ol className="flex flex-col gap-2 bg-surface-container rounded-lg p-space-md">
              {PASOS.map((p, i) => {
                const actual = PASOS.findIndex((x) => x.id === procesando);
                const estado = i < actual ? 'hecho' : i === actual ? 'actual' : 'pendiente';
                return (
                  <li
                    key={p.id}
                    className={`flex items-center gap-2 font-body-md text-body-md ${
                      estado === 'pendiente' ? 'text-outline' : 'text-on-surface'
                    }`}
                  >
                    <Icon
                      name={estado === 'hecho' ? 'check_circle' : estado === 'actual' ? 'progress_activity' : 'radio_button_unchecked'}
                      className={`text-[20px] ${estado === 'actual' ? 'animate-spin text-primary' : estado === 'hecho' ? 'text-primary-container' : ''}`}
                    />
                    {p.texto}
                  </li>
                );
              })}
            </ol>
          )}

          {/* Acciones */}
          <div className="flex items-center justify-end gap-space-md pt-space-sm">
            <button
              type="button"
              onClick={onCerrar}
              disabled={ocupado}
              className="px-5 py-2.5 rounded-lg bg-surface-container hover:bg-surface-bright text-on-surface font-label-md text-label-md uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!puedeEnviar}
              className="px-7 py-2.5 rounded-lg bg-primary-container hover:bg-tertiary-container text-on-primary font-label-md text-label-md uppercase tracking-wider font-bold transition-all shadow-[0_0_20px_rgba(255,107,0,0.35)] flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <Icon name="publish" className="text-[18px]" />
              Confirmar y Registrar Lienzo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
