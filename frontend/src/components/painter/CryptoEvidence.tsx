/**
 * components/painter/CryptoEvidence.tsx
 * Muestra, en la interfaz, el resultado del cifrado AES-256-GCM y de la firma ECDSA:
 * tamaños, hashes, nonce, tag, bytes cifrados, consentimiento firmado y verificaciones.
 * Incluye dos pruebas de integridad (alterar el archivo / el consentimiento).
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import Icon from '../ui/Icon';
import { usePainterCrypto } from '../../hooks/usePainterCrypto';
import { acortar, copiar, descargar, formatearBytes, vistaHex } from '../../lib/formato';
import type { ObraCifrada, ResultadoPrueba } from '../../types/painterPanel';

interface CryptoEvidenceProps {
  obra: ObraCifrada;
}

function Fila({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-start gap-1 md:gap-space-md py-2">
      <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider md:w-44 shrink-0">
        {etiqueta}
      </span>
      <span className="font-label-md text-label-md text-on-surface break-all">{children}</span>
    </div>
  );
}

function Sello({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-sm text-label-sm uppercase tracking-wider ${
        ok ? 'bg-primary-container/15 text-primary' : 'bg-error-container text-on-error-container'
      }`}
    >
      <Icon name={ok ? 'check_circle' : 'cancel'} className="text-[16px]" />
      {texto}
    </span>
  );
}

const boton =
  'px-3.5 py-2 bg-surface-container hover:bg-surface-bright text-on-surface font-label-sm text-label-sm rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

export default function CryptoEvidence({ obra }: CryptoEvidenceProps) {
  const { probarAlteracionCifrado, probarAlteracionConsentimiento } = usePainterCrypto();
  const [verLlave, setVerLlave] = useState(false);
  const [pruebaCifrado, setPruebaCifrado] = useState<ResultadoPrueba | null>(null);
  const [pruebaConsent, setPruebaConsent] = useState<ResultadoPrueba | null>(null);
  const [probando, setProbando] = useState(false);

  const correr = async (
    fn: (o: ObraCifrada) => Promise<ResultadoPrueba>,
    guardar: (r: ResultadoPrueba) => void,
  ) => {
    setProbando(true);
    try {
      guardar(await fn(obra));
    } finally {
      setProbando(false);
    }
  };

  const c = obra.consentimiento;
  const sobrecarga = obra.cifrado.length - obra.tamanoOriginal;

  return (
    <section id="evidencia-cripto" className="flex flex-col gap-space-lg scroll-mt-28">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-xs">
          <Icon name="enhanced_encryption" className="text-primary text-[24px]" />
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Evidencia criptográfica</h2>
        </div>
        <div className="flex flex-wrap gap-space-sm">
          <Sello ok texto="AES-256-GCM" />
          <Sello ok={obra.verificaciones.descifradoCoincide} texto="Descifrado = original" />
          <Sello ok={obra.verificaciones.firmaValida} texto="Firma ECDSA válida" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
        {/* ---------- Cifrado ---------- */}
        <div className="bg-surface-container-high rounded-xl p-space-lg flex flex-col gap-space-sm shadow-lg">
          <h3 className="font-title-lg text-title-lg text-on-surface font-bold flex items-center gap-2">
            <Icon name="lock" className="text-primary text-[22px]" /> Obra cifrada
          </h3>
          <div className="divide-y divide-outline-variant/20">
            <Fila etiqueta="Archivo">{obra.nombreArchivo} ({obra.tipoMime})</Fila>
            <Fila etiqueta="Tamaño">
              {formatearBytes(obra.tamanoOriginal)} → {formatearBytes(obra.cifrado.length)} (+{sobrecarga} B: nonce 12 + tag 16)
            </Fila>
            <Fila etiqueta="SHA-256 original">{obra.hashOriginal}</Fila>
            <Fila etiqueta="SHA-256 cifrado">{obra.hashCifrado}</Fila>
            <Fila etiqueta="Nonce (96 bits)">{obra.nonce}</Fila>
            <Fila etiqueta="Tag GCM (128 bits)">{obra.tag}</Fila>
            <Fila etiqueta="Llave AES-256">
              <span className="flex flex-wrap items-center gap-space-sm">
                <span>{verLlave ? obra.llaveAes : '•'.repeat(44)}</span>
                <button className="text-primary underline" onClick={() => setVerLlave((v) => !v)}>
                  {verLlave ? 'ocultar' : 'mostrar'}
                </button>
                <button className="text-primary underline" onClick={() => copiar(obra.llaveAes)}>copiar</button>
              </span>
            </Fila>
          </div>
          <p className="font-body-sm text-body-sm text-secondary flex items-start gap-2">
            <Icon name="info" className="text-[16px] mt-0.5" />
            La llave se muestra solo para la demostración. En el protocolo final se cifra con la llave RSA de cada juez
            (sobres) y no se conserva en claro.
          </p>

          <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider mt-2">
            Primeros 96 bytes del archivo cifrado (hex)
          </span>
          <pre className="bg-surface-container-lowest text-primary p-space-sm rounded-lg font-label-md text-label-md overflow-auto">
            {vistaHex(obra.cifrado)}
          </pre>

          <div className="flex flex-wrap gap-space-sm pt-1">
            <button
              className={boton}
              onClick={() => descargar(`${obra.nombreArchivo}.enc`, obra.cifrado, 'application/octet-stream')}
            >
              <Icon name="download" className="text-[16px]" /> Descargar .enc
            </button>
          </div>
        </div>

        {/* ---------- Consentimiento ---------- */}
        <div className="bg-surface-container-high rounded-xl p-space-lg flex flex-col gap-space-sm shadow-lg">
          <h3 className="font-title-lg text-title-lg text-on-surface font-bold flex items-center gap-2">
            <Icon name="draw" className="text-primary text-[22px]" /> Consentimiento firmado
          </h3>
          <div className="divide-y divide-outline-variant/20">
            <Fila etiqueta="Algoritmo">{c.algoritmo} (firma r‖s, 64 bytes)</Fila>
            <Fila etiqueta="Huella firmante">{acortar(c.huellaFirmante, 16, 12)}</Fila>
            <Fila etiqueta="SHA-256 documento">{c.hashDocumento}</Fila>
            <Fila etiqueta="Firma (Base64)">{c.firma}</Fila>
          </div>

          <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider mt-2">
            Documento firmado (texto exacto)
          </span>
          <pre className="bg-surface-container-lowest text-on-surface-variant p-space-sm rounded-lg font-label-md text-label-md overflow-auto max-h-72">
            {c.documento}
          </pre>

          <div className="flex flex-wrap gap-space-sm pt-1">
            <button
              className={boton}
              onClick={() =>
                descargar(
                  'consentimiento_firmado.json',
                  JSON.stringify(
                    {
                      documento_consentimiento: c.documento,
                      firma_consentimiento: c.firma,
                      algoritmo: c.algoritmo,
                      clave_publica_firma: c.clavePublica,
                    },
                    null,
                    2,
                  ),
                  'application/json',
                )
              }
            >
              <Icon name="download" className="text-[16px]" /> Descargar consentimiento
            </button>
            <button className={boton} onClick={() => copiar(c.firma)}>
              <Icon name="content_copy" className="text-[16px]" /> Copiar firma
            </button>
          </div>
        </div>
      </div>

      {/* ---------- Pruebas de integridad ---------- */}
      <div className="bg-surface-container-high rounded-xl p-space-lg flex flex-col gap-space-md shadow-lg">
        <h3 className="font-title-lg text-title-lg text-on-surface font-bold flex items-center gap-2">
          <Icon name="science" className="text-primary text-[22px]" /> Pruebas de integridad
        </h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Altera un dato a propósito y comprueba que el sistema lo detecta.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
          <div className="flex flex-col gap-space-sm bg-surface-container rounded-lg p-space-md">
            <button
              className={`${boton} self-start`}
              disabled={probando}
              onClick={() => correr(probarAlteracionCifrado, setPruebaCifrado)}
            >
              <Icon name="edit_off" className="text-[16px]" /> Alterar 1 byte del archivo cifrado
            </button>
            {pruebaCifrado && (
              <p className={`font-body-sm text-body-sm flex items-start gap-2 ${pruebaCifrado.detectada ? 'text-primary' : 'text-error'}`}>
                <Icon name={pruebaCifrado.detectada ? 'verified_user' : 'warning'} className="text-[18px]" />
                {pruebaCifrado.mensaje}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-space-sm bg-surface-container rounded-lg p-space-md">
            <button
              className={`${boton} self-start`}
              disabled={probando}
              onClick={() => correr(probarAlteracionConsentimiento, setPruebaConsent)}
            >
              <Icon name="edit_off" className="text-[16px]" /> Alterar el consentimiento firmado
            </button>
            {pruebaConsent && (
              <p className={`font-body-sm text-body-sm flex items-start gap-2 ${pruebaConsent.detectada ? 'text-primary' : 'text-error'}`}>
                <Icon name={pruebaConsent.detectada ? 'verified_user' : 'warning'} className="text-[18px]" />
                {pruebaConsent.mensaje}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
