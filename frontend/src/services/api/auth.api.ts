import { request } from './client';
import { User } from '../../types';

export const authApi = {
  register: (payload: {
    name: string;
    last_name: string;
    email: string;
    password: string;
    confirm_password: string;
  }) =>
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
