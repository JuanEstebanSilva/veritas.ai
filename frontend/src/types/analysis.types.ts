export interface ParagraphResult {
  index: number;
  text: string;
  aiScore: number;
  indicators: string[];
  explanation: string;
}

export interface ApaCitation {
  inText: string;
  reference: string;
}

export interface MatchedSource {
  id?: string;
  url: string;
  title: string;
  matchedText: string;
  userSnippet: string;
  similarityPercentage: number;
  apaCitation?: ApaCitation;
}

export interface Analysis {
  id: string;
  title: string;
  type: 'TEXT' | 'DOCX' | 'PDF' | string;
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
