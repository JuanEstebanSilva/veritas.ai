import type { Analysis } from '../../types';
import { splitSentences, wordCount } from '../../motion/canvas';

/* ────────────────────────────────────────────────────────────────
   Datos del informe para las visualizaciones. Todo sale del análisis
   real; nada se inventa:
   - IA: cada oración hereda la puntuación de su párrafo (el backend
     puntúa por párrafo, no por oración).
   - Similitud: una oración coincide con una fuente si contiene el
     fragmento detectado (userSnippet) o el fragmento empieza por ella.
   - Humanizado: una oración está «reescrita» si no aparece literal en
     la versión humanizada.
   ──────────────────────────────────────────────────────────────── */
export interface SentenceInfo {
  text: string;
  /** Índice de párrafo (0…). */
  paragraph: number;
  /** Probabilidad de IA del párrafo, 0–100. */
  ai: number;
  /** Mayor similitud de una fuente que coincide, 0–100 (0 si ninguna). */
  sim: number;
  /** Índice de la fuente que coincide, o null. */
  source: number | null;
  /** null si no hay versión humanizada. */
  rewritten: boolean | null;
  words: number;
}

const norm = (s: string) => s.toLowerCase().replace(/[…]|\.\.\./g, ' ').replace(/[«»"“”]/g, '').replace(/\s+/g, ' ').trim();
const KEY = 32;

export function buildSentences(analysis: Analysis, improvedText?: string | null): SentenceInfo[] {
  const paras = analysis.paragraphs?.length
    ? analysis.paragraphs.map((p) => ({ text: p.text, ai: p.aiScore }))
    : [{ text: analysis.originalText || '', ai: analysis.aiScore }];
  const snippets = (analysis.sources || []).map((s) => norm(s.userSnippet || ''));
  const improved = improvedText ? norm(improvedText) : null;

  const out: SentenceInfo[] = [];
  paras.forEach((p, pi) => {
    splitSentences(p.text).forEach((text) => {
      const n = norm(text);
      let sim = 0, source: number | null = null;
      snippets.forEach((sn, si) => {
        if (sn.length < 12) return;
        const hit = n.includes(sn.slice(0, KEY)) || sn.startsWith(n.slice(0, KEY));
        const pct = analysis.sources![si].similarityPercentage;
        if (hit && pct > sim) { sim = pct; source = si; }
      });
      out.push({ text, paragraph: pi, ai: Math.round(p.ai), sim, source, rewritten: improved === null ? null : !improved.includes(n.replace(/[.!?]+$/, '')), words: wordCount(text) });
    });
  });
  return out;
}

/** Longitudes de oración (palabras) de un texto cualquiera. */
export const sentenceLengths = (text: string) => splitSentences(text).map(wordCount);

/** Dominio legible de una URL (sin «www.»). */
export const domainOf = (url: string) => {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
};

/** Tono de similitud con los umbrales del informe. */
export const simTone = (pct: number): 'ai' | 'mixed' | 'low' => (pct >= 35 ? 'ai' : pct >= 18 ? 'mixed' : 'low');
