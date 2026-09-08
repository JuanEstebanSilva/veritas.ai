import { User, Analysis, AdminStats, AdminUserListItem } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Función auxiliar para realizar peticiones HTTP con JWT y tipado seguro
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; status: number; isLimitReached?: boolean }> {
  const token = localStorage.getItem('veritas_token');

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Si no es FormData, fijar Content-Type a JSON
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
    } else if (contentType && (contentType.includes('word') || contentType.includes('octet-stream') || contentType.includes('text/plain'))) {
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

    return {
      data: data as T,
      status: response.status,
    };
  } catch (err: any) {
    return {
      error: err.message || 'No se pudo conectar con el servidor backend.',
      status: 0,
    };
  }
}

// -------------------------------------------------------------
// SERVICIOS DE AUTENTICACIÓN
// -------------------------------------------------------------
export const authApi = {
  register: (payload: { name: string; last_name: string; email: string; password: string; confirm_password: string }) =>
    request<{ success: boolean; token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ success: boolean; token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getProfile: () => request<{ success: boolean; user: User }>('/auth/me'),

  updateProfile: (payload: { name?: string; last_name?: string }) =>
    request<{ success: boolean; user: User }>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};

// -------------------------------------------------------------
// SERVICIOS DE ANÁLISIS DE CONTENIDO
// -------------------------------------------------------------
export const analysisApi = {
  analyzeText: (text: string, title?: string) =>
    request<{ success: boolean; analysis: Analysis }>('/analyses/text', {
      method: 'POST',
      body: JSON.stringify({ text, title }),
    }),

  analyzeDocx: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ success: boolean; analysis: Analysis }>('/analyses/docx', {
      method: 'POST',
      body: formData,
    });
  },

  getHistory: () =>
    request<{ success: boolean; analyses: Array<Pick<Analysis, 'id' | 'title' | 'type' | 'aiScore' | 'similarityScore' | 'improvedAiScore' | 'improvedSimilarityScore' | 'createdAt'>> }>('/analyses/history'),

  getById: (id: string) => request<{ success: boolean; analysis: Analysis }>(`/analyses/${id}`),

  deleteAnalysis: (id: string) =>
    request<{ success: boolean; message: string }>(`/analyses/${id}`, {
      method: 'DELETE',
    }),

  reanalyzeImproved: (id: string) =>
    request<{
      success: boolean;
      comparison: {
        original: { aiScore: number; similarityScore: number };
        improved: { aiScore: number; similarityScore: number };
        notice: string;
      };
    }>(`/analyses/${id}/reanalyze-improved`, {
      method: 'POST',
    }),
};

// -------------------------------------------------------------
// SERVICIOS DE MEJORA Y DESCARGA
// -------------------------------------------------------------
export const writingApi = {
  improveText: (payload: { text?: string; analysisId?: string }) =>
    request<{
      success: boolean;
      originalText: string;
      improvedText: string;
      summaryOfChanges: string[];
      originalAiScore?: number;
      improvedAiScore?: number;
      aiReduction?: number;
      notice: string;
    }>('/writing/improve', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  downloadDocx: async (payload: { improvedText: string; title?: string; analysisId?: string }) => {
    const res = await request<Blob>('/writing/download-docx', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.data instanceof Blob) {
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'documento_mejorado.docx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    }
    return res;
  },

  downloadTxt: async (payload: { improvedText: string; title?: string }) => {
    const res = await request<Blob>('/writing/download-txt', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.data instanceof Blob) {
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(payload.title || 'documento_mejorado').replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    }
    return res;
  },
};

// -------------------------------------------------------------
// SERVICIOS DE PAGOS Y PREMIUM
// -------------------------------------------------------------
export const paymentApi = {
  createCheckout: () =>
    request<{ success: boolean; provider: string; checkoutUrl?: string }>('/payments/create-checkout-session', {
      method: 'POST',
    }),

  initSandbox: () =>
    request<{
      success: boolean;
      transaction: { transactionId: string; amount: number };
      testInstructions: any;
    }>('/payments/sandbox-init', {
      method: 'POST',
    }),

  confirmSandbox: (transactionId: string, simulateSuccess: boolean) =>
    request<{ success: boolean; message: string; isPremium: boolean }>('/payments/sandbox-confirm', {
      method: 'POST',
      body: JSON.stringify({ transactionId, simulateSuccess }),
    }),

  getHistory: () => request<{ success: boolean; payments: any[] }>('/payments/history'),
};

// -------------------------------------------------------------
// SERVICIOS ADMINISTRATIVOS (ADMIN ÚNICAMENTE)
// -------------------------------------------------------------
export const adminApi = {
  getStats: () => request<{ success: boolean; stats: AdminStats }>('/users/stats'),

  getAllUsers: () => request<{ success: boolean; users: AdminUserListItem[] }>('/users'),

  getUserById: (id: string) => request<{ success: boolean; user: any }>(`/users/${id}`),

  createUser: (payload: { name: string; last_name: string; email: string; password: string; is_premium?: boolean }) =>
    request<{ success: boolean; user: User }>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateUser: (id: string, payload: Partial<User> & { password?: string }) =>
    request<{ success: boolean; user: User }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  toggleActive: (id: string) =>
    request<{ success: boolean; user: { id: string; is_active: boolean } }>(`/users/${id}/toggle-active`, {
      method: 'PATCH',
    }),

  togglePremium: (id: string) =>
    request<{ success: boolean; user: { id: string; is_premium: boolean; premium_since: string | null } }>(
      `/users/${id}/toggle-premium`,
      {
        method: 'PATCH',
      }
    ),

  deleteUser: (id: string) =>
    request<{ success: boolean; message: string }>(`/users/${id}`, {
      method: 'DELETE',
    }),
};
