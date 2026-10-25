/**
 * api/apiClient.ts
 * Cliente base para hablar con el backend. Todas las peticiones pasan por aquí,
 * así la URL, los headers y el manejo de errores están en un solo lugar.
 */
export const API_URL = "http://localhost:8000";   // DESPUES CAMBIARLO POR UN .ENV

/** Headers de autenticación con el JWT guardado al iniciar sesión. */
function authHeaders(): Record<string, string> {
  const token = sessionStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Convierte una respuesta no exitosa en un Error con el mensaje del backend. */
async function lanzarError(response: Response): Promise<never> {
  const errorData = await response.json().catch(() => ({}));
  const detail = errorData.detail;
  const serverMessage =
    (typeof detail === 'string' ? detail : undefined) ||
    errorData.message ||
    errorData.error;
  throw new Error(serverMessage ?? `Error ${response.status}`);
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Con FormData el navegador pone solo el Content-Type (con el boundary)
  const esFormData = options.body instanceof FormData;
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(esFormData ? {} : { 'Content-Type': 'application/json' }),
      ...authHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    await lanzarError(response);
  }

  return response.json() as Promise<T>;
}

/** Descarga un recurso binario protegido (p. ej. una imagen) y lo devuelve como Blob. */
export async function apiRequestBlob(endpoint: string): Promise<Blob> {
  const response = await fetch(`${API_URL}${endpoint}`, { headers: authHeaders() });
  if (!response.ok) {
    await lanzarError(response);
  }
  return response.blob();
}
