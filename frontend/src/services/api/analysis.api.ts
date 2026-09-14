import { request } from './client';
import { Analysis } from '../../types';

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
    request<{
      success: boolean;
      analyses: Array<
        Pick<
          Analysis,
          | 'id'
          | 'title'
          | 'type'
          | 'aiScore'
          | 'similarityScore'
          | 'improvedAiScore'
          | 'improvedSimilarityScore'
          | 'createdAt'
        >
      >;
    }>('/analyses/history'),

  getById: (id: string) =>
    request<{ success: boolean; analysis: Analysis }>(`/analyses/${id}`),

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
