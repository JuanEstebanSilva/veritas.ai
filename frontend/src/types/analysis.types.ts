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
