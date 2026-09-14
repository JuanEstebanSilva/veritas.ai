import { UserRole } from './user.types';

export interface AdminStats {
  totalUsers: number;
  premiumUsers: number;
  freeUsers: number;
  totalAnalyses: number;
  analysesToday: number;
  recentUsers: Array<{
    id: string;
    name: string;
    last_name: string;
    email: string;
    role: UserRole;
    is_premium: boolean;
    is_active: boolean;
    created_at: string;
  }>;
}

export interface AdminUserListItem {
  id: string;
  name: string;
  last_name: string;
  fullName: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_premium: boolean;
  premium_since: string | null;
  totalAnalyses: number;
  dailyAnalysisCount: number;
  lastAccess: string;
  createdAt: string;
}
