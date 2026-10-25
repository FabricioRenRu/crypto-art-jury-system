/**
 * lib/formato.ts
 * Utilidades pequeñas para mostrar datos binarios en la interfaz y descargarlos.
 */

export function formatearBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

/** Hex de los primeros `max` bytes, en filas de 16 bytes ("a1 b2 c3 ..."). */
export function vistaHex(bytes: Uint8Array, max = 96): string {
  const filas: string[] = [];
  const tope = Math.min(bytes.length, max);
  for (let i = 0; i < tope; i += 16) {
    const fila = Array.from(bytes.slice(i, Math.min(i + 16, tope)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ');
    filas.push(fila);
  }
  return filas.join('\n') + (bytes.length > max ? '\n…' : '');
}

/** "9db689d7…f502ff" */
export function acortar(texto: string, inicio = 10, fin = 8): string {
  return texto.length <= inicio + fin + 1 ? texto : `${texto.slice(0, inicio)}…${texto.slice(-fin)}`;
}

/** Agrupa un hex en bloques de 4 para leerlo mejor: "9db6 89d7 61e7 ..." */
export function agruparHex(hex: string, tam = 4): string {
  return hex.match(new RegExp(`.{1,${tam}}`, 'g'))?.join(' ') ?? hex;
}

/** Dispara la descarga de un archivo generado en el navegador. */
export function descargar(nombre: string, contenido: Uint8Array<ArrayBuffer> | string, mime: string) {
  const blob = new Blob([contenido], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copiar(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}
