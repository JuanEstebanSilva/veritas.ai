/**
 * client.ts — Función base HTTP con autenticación JWT y tipado genérico.
 * Todos los módulos de API importan desde aquí.
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
  isLimitReached?: boolean;
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('plagelio_token') || localStorage.getItem('veritas_token');

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type');
    let data: any = null;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else if (
      contentType &&
      (contentType.includes('word') ||
        contentType.includes('octet-stream') ||
        contentType.includes('text/plain'))
    ) {
      data = await response.blob();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMessage = data?.message || `Error en la solicitud (Código ${response.status})`;
      return {
        error: errorMessage,
        status: response.status,
        isLimitReached: data?.isLimitReached || response.status === 429,
      };
    }

    return { data: data as T, status: response.status };
  } catch (err: any) {
    return {
      error: err.message || 'No se pudo conectar con el servidor backend.',
      status: 0,
    };
  }
}
