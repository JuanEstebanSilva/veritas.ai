import { request } from './client';
import { User, AdminStats, AdminUserListItem } from '../../types';

export const adminApi = {
  getStats: () => request<{ success: boolean; stats: AdminStats }>('/users/stats'),

  getAllUsers: () =>
    request<{ success: boolean; users: AdminUserListItem[] }>('/users'),

  getUserById: (id: string) =>
    request<{ success: boolean; user: any }>(`/users/${id}`),

  createUser: (payload: {
    name: string;
    last_name: string;
    email: string;
    password: string;
    is_premium?: boolean;
  }) =>
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
    request<{ success: boolean; user: { id: string; is_active: boolean } }>(
      `/users/${id}/toggle-active`,
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
};
