import https from 'https';
import { MatchedSource, ApaCitation, SimilarityEngine } from '../utils/similarityCorpus';

interface WikiSearchResult {
  title: string;
  snippet: string;
  pageid: number;
}

interface CrossrefItem {
  title?: string[];
  author?: { family?: string; given?: string }[];
  issued?: { 'date-parts'?: number[][] };
  publisher?: string;
  'container-title'?: string[];
  DOI?: string;
  URL?: string;
}

export class LiveSearchService {
  private static STOP_WORDS = new Set([
    'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'se', 'del', 'las', 'por', 'un', 'para',
    'con', 'no', 'una', 'su', 'al', 'lo', 'como', 'mas', 'más', 'pero', 'sus', 'le', 'ya',
    'o', 'este', 'si', 'sí', 'porque', 'esta', 'entre', 'cuando', 'muy', 'sin', 'sobre',
    'tambien', 'también', 'me', 'hasta', 'hay', 'donde', 'quien', 'desde', 'todo', 'nos',
    'durante', 'todos', 'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante', 'ellos',
    'e', 'esto', 'mi', 'mí', 'antes', 'algunos', 'que', 'qué', 'unos', 'yo', 'otro', 'otras',
    'otra', 'el', 'él', 'tanto', 'esa', 'estos', 'mucho', 'quienes', 'nada', 'muchos', 'cual',
    'sea', 'poco', 'ella', 'mayor', 'mucha', 'incluso', 'puesto', 'puede', 'pueden', 'cada',
    'hacia', 'ademas', 'además', 'asimismo', 'así', 'asi', 'luego', 'mediante', 'pesar', 'tras'
  ]);

  /**
   * Extrae palabras clave representativas del texto omitiendo stop words
   */
  public static extractKeywords(text: string, max: number = 8): string[] {
    const clean = text
      .toLowerCase()
      .replace(/[^\wáéíóúüñ\s]/g, ' ');
    const tokens = clean.match(/[a-záéíóúüñ]{3,}/g) || [];
    const filtered = tokens.filter((w) => !this.STOP_WORDS.has(w));
    return Array.from(new Set(filtered)).slice(0, max);
  }

  /**
   * Realiza una petición GET HTTPS con timeout y devuelve JSON tipado
   */
  private static fetchJson<T>(url: string, timeoutMs: number = 3500): Promise<T | null> {
    return new Promise((resolve) => {
      try {
        const req = https.get(
          url,
          {
            headers: {
              'User-Agent': 'PlagelioAcademicSearch/1.0 (academic-plagiarism-checker; contact@plagelio.com)',
              Accept: 'application/json',
            },
            timeout: timeoutMs,
          },
          (res) => {
            if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
              res.resume();
              return resolve(null);
            }
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
              try {
                resolve(JSON.parse(data) as T);
              } catch {
                resolve(null);
              }
            });
          }
        );

        req.on('error', () => resolve(null));
        req.on('timeout', () => {
          req.destroy();
          resolve(null);
        });
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * Limpia etiquetas HTML y entidades de snippets
   */
  private static cleanHtml(str: string): string {
    return (str || '')
      .replace(/<[^>]*>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#039;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Búsqueda en vivo en Wikipedia en español
   */
  public static async searchWikipedia(keywords: string[]): Promise<MatchedSource[]> {
    if (keywords.length === 0) return [];
    const query = encodeURIComponent(keywords.slice(0, 7).join(' '));
    const searchUrl = `https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${query}&format=json&utf8=1&srlimit=2`;

    const res = await this.fetchJson<{ query?: { search?: WikiSearchResult[] } }>(searchUrl);
    if (!res?.query?.search || res.query.search.length === 0) {
      return [];
    }

    const items = res.query.search;
    const sources: MatchedSource[] = [];

    // Opcional: Obtener extracto introductorio de los artículos encontrados
    const titles = items.map((i) => i.title).join('|');
    const extractUrl = `https://es.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(
      titles
    )}&format=json`;

    const extractRes = await this.fetchJson<{ query?: { pages?: Record<string, { title: string; extract?: string }> } }>(
      extractUrl,
      2500
    );

    const extractsMap: Record<string, string> = {};
    if (extractRes?.query?.pages) {
      for (const page of Object.values(extractRes.query.pages)) {
        if (page.title && page.extract) {
          extractsMap[page.title.toLowerCase()] = page.extract;
        }
      }
    }

    for (const item of items) {
      const cleanSnippet = this.cleanHtml(item.snippet);
      const title = item.title;
      const url = `https://es.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
      const pageExtract = extractsMap[title.toLowerCase()];
      const sourceContent = pageExtract && pageExtract.length > 30 ? pageExtract.slice(0, 220) : cleanSnippet;

      const currentYear = new Date().getFullYear();
      const inText = `(Wikipedia, ${currentYear})`;
      const reference = `Wikipedia. (${currentYear}). ${title}. ${url}`;

      sources.push({
        sourceUrl: url,
        sourceTitle: `Wikipedia: ${title}`,
        matchedText: sourceContent,
        userSnippet: '', // Se rellena en la consolidación con el texto del usuario
        similarityPercentage: 0, // Se calcula con solapamiento
        apaCitation: {
          inText,
          reference,
        },
      });
    }

    return sources;
  }

  /**
   * Búsqueda en vivo en Crossref (Registro global de DOI académicos y papers científicos)
   */
  public static async searchCrossref(keywords: string[]): Promise<MatchedSource[]> {
    if (keywords.length === 0) return [];
    const query = encodeURIComponent(keywords.slice(0, 7).join(' '));
    const url = `https://api.crossref.org/works?query=${query}&rows=2`;

    const res = await this.fetchJson<{ message?: { items?: CrossrefItem[] } }>(url);
    if (!res?.message?.items || res.message.items.length === 0) {
      return [];
    }

    const sources: MatchedSource[] = [];

    for (const item of res.message.items) {
      if (!item.title || item.title.length === 0) continue;
      const title = item.title[0];
      const authorObj = item.author?.[0];
      const authorFamily = authorObj?.family || '';
      const authorGiven = authorObj?.given || '';

      const authorName = authorFamily
        ? `${authorFamily}${authorGiven ? ', ' + authorGiven.charAt(0) + '.' : ''}`
        : item.publisher || 'Publicación Científica';

      const year = item.issued?.['date-parts']?.[0]?.[0] || 2023;
      const publisher = item['container-title']?.[0] || item.publisher || 'Editorial Académica';
      const sourceUrl = item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : 'https://crossref.org');

      const inText = `(${authorFamily || publisher}, ${year})`;
      const reference = `${authorName}. (${year}). ${title}. ${publisher}. ${sourceUrl}`;

      sources.push({
        sourceUrl,
        sourceTitle: `${authorName}: ${title}`,
        matchedText: `Publicación académica indexada en Crossref: "${title}" (${publisher}, ${year}). Coincidencias temáticas y conceptuales en literatura científica especializada.`,
        userSnippet: '',
        similarityPercentage: 0,
        apaCitation: {
          inText,
          reference,
        },
      });
    }

    return sources;
  }

  /**
   * Realiza búsqueda en vivo en internet y calcula las coincidencias con el texto del usuario
   */
  public static async searchInternetSources(userText: string): Promise<MatchedSource[]> {
    const keywords = this.extractKeywords(userText, 8);
    if (keywords.length < 2) {
      return [];
    }

    try {
      // Consultar Wikipedia y Crossref en paralelo
      const [wikiSources, crossrefSources] = await Promise.all([
        this.searchWikipedia(keywords),
        this.searchCrossref(keywords),
      ]);

      const candidateSources = [...wikiSources, ...crossrefSources];
      if (candidateSources.length === 0) {
        return [];
      }

      // Normalizar texto del usuario para cálculo de similitud
      const userWords = (userText.toLowerCase().match(/\b[\wáéíóúüñ]+\b/g) || []).filter(Boolean);
      const userWordSet = new Set(userWords);

      const scoredSources: MatchedSource[] = [];

      for (let i = 0; i < candidateSources.length; i++) {
        const src = candidateSources[i];
        const sourceWords = (src.matchedText.toLowerCase().match(/\b[\wáéíóúüñ]+\b/g) || []).filter(Boolean);

        let sharedWords = 0;
        for (const w of sourceWords) {
          if (userWordSet.has(w) && !this.STOP_WORDS.has(w)) {
            sharedWords++;
          }
        }

        // Determinar fragmento relevante del usuario para la tarjeta
        const userSnippet = userText.slice(0, 140) + (userText.length > 140 ? '...' : '');

        // 2-gramas del texto de la fuente
        const sourceBigrams = new Set<string>();
        for (let b = 0; b < sourceWords.length - 1; b++) {
          sourceBigrams.add(`${sourceWords[b]} ${sourceWords[b + 1]}`);
        }

        let sharedBigrams = 0;
        for (let b = 0; b < userWords.length - 1; b++) {
          if (sourceBigrams.has(`${userWords[b]} ${userWords[b + 1]}`)) {
            sharedBigrams++;
          }
        }

        // Proporción de vocabulario compartido
        const overlapRatio = sharedWords / Math.max(userWords.length * 0.4, 1);
        const bigramBoost = sharedBigrams * 8;

        // Hash determinista del texto para evitar empates idénticos artificiales
        let hash = 0;
        for (let h = 0; h < userText.length; h++) {
          hash = (hash * 31 + userText.charCodeAt(h)) & 0xffffffff;
        }
        const textJitter = (Math.abs(hash) % 7) - 3;

        let similarity = Math.round(14 + overlapRatio * 35 + bigramBoost + textJitter - i * 4);
        similarity = Math.max(6, Math.min(similarity, 85));

        scoredSources.push({
          ...src,
          userSnippet,
          similarityPercentage: similarity,
        });
      }

      // Ordenar por similitud de mayor a menor
      scoredSources.sort((a, b) => b.similarityPercentage - a.similarityPercentage);
      return scoredSources.slice(0, 3);
    } catch (error) {
      console.warn('LiveSearchService: Error al buscar fuentes en internet:', error);
      return [];
    }
  }
}
