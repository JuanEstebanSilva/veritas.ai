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

export interface ParagraphResult {
  index: number;
  text: string;
  aiScore: number;
  indicators: string[];
  explanation: string;
}

export interface MatchedSource {
  id?: string;
  url: string;
  title: string;
  matchedText: string;
  userSnippet: string;
  similarityPercentage: number;
}

export interface Analysis {
  id: string;
  title: string;
  type: 'TEXT' | 'DOCX';
  originalText: string;
  improvedText?: string | null;
  aiScore: number;
  similarityScore: number;
  improvedAiScore?: number | null;
  improvedSimilarityScore?: number | null;
  overallIndicators?: string[];
  summaryExplanation?: string;
  legalDisclaimer?: string;
  similarityDisclaimer?: string;
  paragraphs?: ParagraphResult[];
  sources?: MatchedSource[];
  createdAt: string;
  dailyCount?: number;
}

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
