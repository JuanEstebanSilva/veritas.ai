import { request } from './client';
import { User, AdminStats, AdminUserListItem, AdminAnalysisListItem } from '../../types';

export const adminApi = {
  getStats: () => request<{ success: boolean; stats: AdminStats }>('/users/stats'),

  getAllUsers: () =>
    request<{ success: boolean; users: AdminUserListItem[] }>('/users'),

  getAllAnalyses: () =>
    request<{ success: boolean; analyses: AdminAnalysisListItem[] }>('/users/analyses'),

  getUserById: (id: string) =>
    request<{ success: boolean; user: any }>(`/users/${id}`),

  createUser: (payload: {
    name: string;
    last_name: string;
    email: string;
    password: string;
    role?: 'USER' | 'ADMIN';
    is_premium?: boolean;
  }) =>
    request<{ success: boolean; user: User }>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateUser: (id: string, payload: Partial<User> & { password?: string; role?: 'USER' | 'ADMIN' }) =>
    request<{ success: boolean; user: User }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  toggleActive: (id: string) =>
    request<{ success: boolean; user: { id: string; is_active: boolean } }>(
      `/users/${id}/toggle-active`,
      { method: 'PATCH' }
    ),

  toggleRole: (id: string) =>
    request<{ success: boolean; user: { id: string; role: 'USER' | 'ADMIN' } }>(
      `/users/${id}/toggle-role`,
      { method: 'PATCH' }
    ),

  togglePremium: (id: string) =>
    request<{
      success: boolean;
      user: { id: string; is_premium: boolean; premium_since: string | null };
    }>(`/users/${id}/toggle-premium`, { method: 'PATCH' }),

  deleteUser: (id: string) =>
    request<{ success: boolean; message: string }>(`/users/${id}`, {
      method: 'DELETE',
    }),

  deleteAnalysis: (id: string) =>
    request<{ success: boolean; message: string }>(`/analyses/${id}`, {
      method: 'DELETE',
    }),
};
