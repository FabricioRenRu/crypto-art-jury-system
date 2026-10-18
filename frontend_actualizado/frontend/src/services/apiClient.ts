/**
 * services/apiClient.ts
 * Cliente base para hablar con el backend. Todas las peticiones pasan por aquí,
 * así la URL, los headers y el manejo de errores están en un solo lugar.
 */
const API_URL = import.meta.env.VITE_API_URL;

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail ?? `Error ${response.status}`);
  }

  return response.json() as Promise<T>;
}