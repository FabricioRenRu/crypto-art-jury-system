/**
 * api/apiClient.ts
 * Cliente base para hablar con el backend. Todas las peticiones pasan por aquí,
 * así la URL, los headers y el manejo de errores están en un solo lugar.
 */
const API_URL = "http://localhost:8000";   // DESPUES CAMBIARLO POR UN .ENV

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!response.ok) {
    //Leemos el JSON DEL BACKEND
    const errorData = await response.json().catch(() => ({}));

    const serverMessage = errorData.detail || errorData.message || errorData.error;

    throw new Error(serverMessage ?? `Error ${response.status}`);
  }

  return response.json() as Promise<T>;
}