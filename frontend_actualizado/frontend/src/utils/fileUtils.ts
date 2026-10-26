export const descargarArchivoTexto = (contenido: string, nombreArchivo: string) => {
  const blob = new Blob([contenido], { type: 'application/x-pem-file' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};