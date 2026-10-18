/**
 * components/painter/UploadArtworkModal.tsx
 * Modal para subir una nueva pintura: archivo maestro (arrastrar o elegir),
 * titulo, memoria descriptiva y confirmacion de autoria.
 *
 * Es un componente controlado desde afuera: la pagina decide cuando esta abierto (isOpen)
 * y recibe los datos al confirmar (onSubmit).
 */
import { useState } from 'react';
import type { ChangeEvent, DragEvent, FormEvent } from 'react';
import Icon from '../ui/Icon';

export interface UploadArtworkData {
  file: File;
  title: string;
  description: string;
}

interface UploadArtworkModalProps {
  isOpen: boolean;
  slotLabel: string; // Ej. "Slot 01 de 01"
  onClose: () => void;
  onSubmit: (data: UploadArtworkData) => void;
}

const fieldLabel =
  'font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-medium';

const fieldInput =
  'bg-surface-container rounded-lg text-on-surface placeholder:text-secondary font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container shadow-inner w-full';

export default function UploadArtworkModal({
  isOpen,
  slotLabel,
  onClose,
  onSubmit,
}: UploadArtworkModalProps) {
  /** STATE: campos del formulario. */
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [certified, setCertified] = useState(false);

  /** STATE: true mientras se arrastra un archivo encima de la zona de carga. */
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) {
    return null;
  }

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setCertified(false);
    setIsDragging(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setFile(e.dataTransfer.files?.[0] ?? null);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      return;
    }
    onSubmit({ file, title, description });
    resetForm();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-surface-container-lowest/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 lg:p-10"
      onClick={handleClose}
    >
      <div
        className="bg-surface-container-high w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col relative my-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Subir pintura digital"
      >
        {/* Encabezado */}
        <div className="p-space-lg bg-surface-container flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shadow">
              <Icon name="upload_file" className="text-[22px]" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Subir Pintura Digital
              </h2>
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                {slotLabel} • ArtClash Convocatoria Oficial
              </span>
            </div>
          </div>
          <button
            type="button"
            aria-label="Cerrar modal"
            onClick={handleClose}
            className="w-9 h-9 rounded-lg bg-surface-container-highest hover:bg-surface-bright text-on-surface flex items-center justify-center transition-colors cursor-pointer"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>

        {/* Formulario */}
        <form className="p-space-lg flex flex-col gap-space-lg" onSubmit={handleSubmit}>
          {/* Zona de carga */}
          <div className="flex flex-col gap-2">
            <span className="font-label-md text-label-md text-on-surface uppercase tracking-wider font-semibold">
              Archivo Maestro de Alta Resolución
            </span>
            <label
              onDragEnter={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative group rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer min-h-[180px] ${
                isDragging
                  ? 'bg-surface-container-highest'
                  : 'bg-surface-container-low hover:bg-surface-container'
              }`}
            >
              {/* Borde punteado con SVG para evitar clases de borde de Tailwind */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none rounded-xl"
                xmlns="http://www.w3.org/2000/svg"
              >
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
              <Icon
                name={file ? 'task' : 'cloud_upload'}
                className="text-[44px] text-primary group-hover:scale-110 transition-transform mb-2"
              />
              {file ? (
                <>
                  <span className="font-title-md text-title-md text-on-surface font-semibold break-all">
                    {file.name}
                  </span>
                  <span className="font-body-sm text-body-sm text-secondary mt-1">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • clic para cambiar el archivo
                  </span>
                </>
              ) : (
                <>
                  <span className="font-title-md text-title-md text-on-surface font-semibold">
                    Arrastra y suelta tu lienzo maestro aquí
                  </span>
                  <span className="font-body-sm text-body-sm text-secondary mt-1">
                    o <span className="text-primary underline">explora tus archivos locales</span>
                  </span>
                  <span className="font-label-sm text-label-sm text-outline mt-3">
                    Soporta JPG, PNG, entre otros sin compresión
                  </span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          {/* Titulo */}
          <div className="flex flex-col gap-1.5 w-full">
            <label htmlFor="titulo-obra" className={fieldLabel}>
              Título de la Obra *
            </label>
            <input
              id="titulo-obra"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. El Despertar del Leviatán"
              className={`${fieldInput} px-4 py-3`}
            />
          </div>

          {/* Memoria descriptiva */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="memoria-obra" className={fieldLabel}>
                Memoria Descriptiva / Concepto de la Pieza *
              </label>
              <span className="font-label-sm text-label-sm text-secondary">Máx. 500 palabras</span>
            </div>
            <textarea
              id="memoria-obra"
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el contexto narrativo, la iluminación, fuentes de inspiración y metodología del lienzo..."
              className={`${fieldInput} p-4 resize-none`}
            />
          </div>

          {/* Confirmacion de anonimato y autoria */}
          <div className="p-space-sm bg-surface-container rounded-lg flex items-start gap-space-sm">
            <input
              id="check-anon"
              type="checkbox"
              required
              checked={certified}
              onChange={(e) => setCertified(e.target.checked)}
              className="mt-1 w-4 h-4 accent-[#ff6b00] cursor-pointer"
            />
            <label htmlFor="check-anon" className="font-body-sm text-body-sm text-on-surface-variant cursor-pointer">
              Confirmo que el archivo cargado no contiene{' '}
              <span className="text-on-surface font-semibold">
                firmas, isotipos ni marcas de agua identificativas
              </span>
              , y que certifico la autoría humana original de la pintura.
            </label>
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-end gap-space-md pt-space-sm">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-lg bg-surface-container hover:bg-surface-bright text-on-surface font-label-md text-label-md uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!file}
              className="px-7 py-2.5 rounded-lg bg-primary-container hover:bg-tertiary-container text-on-primary font-label-md text-label-md uppercase tracking-wider font-bold transition-all shadow-[0_0_20px_rgba(255,107,0,0.35)] flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
