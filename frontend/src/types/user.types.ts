export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  last_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_premium: boolean;
  premium_since?: string | null;
  daily_analysis_count: number;
  available_today?: number | string;
  total_analyses?: number;
  created_at?: string;
}
