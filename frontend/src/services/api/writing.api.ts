import { request } from './client';

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

  improveDocument: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{
      success: boolean;
      originalText: string;
      improvedText: string;
      summaryOfChanges: string[];
      originalAiScore?: number;
      improvedAiScore?: number;
      aiReduction?: number;
      filename?: string;
      fileType?: string;
      notice: string;
    }>('/writing/improve-document', {
      method: 'POST',
      body: formData,
    });
  },

  extractDocumentText: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{
      success: boolean;
      text: string;
      paragraphsCount: number;
      fileType: string;
      filename: string;
    }>('/writing/extract-text', {
      method: 'POST',
      body: formData,
    });
  },

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
