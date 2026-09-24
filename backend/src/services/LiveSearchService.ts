import { ENV } from '../config/env';
import { TextSimilarity } from '../utils/TextSimilarity';
import { CitationService, CitationMetadata } from './CitationService';

export interface ApaCitation {
  inText: string;
  reference: string;
}

export interface MatchedSource {
  sourceUrl: string;
  sourceTitle: string;
  matchedText: string;
  userSnippet: string;
  similarityPercentage: number;
  apaCitation: ApaCitation;
  ieeeCitation?: { inText: string; reference: string };
}

export interface RawWebSearchResult {
  url: string;
  title: string;
  snippet: string;
  year?: number;
  author?: string;
  publisher?: string;
}

interface GoogleCustomSearchItem {
  title?: string;
  link?: string;
  snippet?: string;
  pagemap?: {
    metatags?: Array<Record<string, string>>;
  };
}

interface GoogleCustomSearchResponse {
  items?: GoogleCustomSearchItem[];
  error?: { message?: string; code?: number };
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

interface OpenAlexWork {
  display_name?: string;
  publication_year?: number;
  doi?: string;
  primary_location?: {
    landing_page_url?: string;
    source?: { display_name?: string };
  };
  authorships?: { author?: { display_name?: string } }[];
}

export class LiveSearchService {
  /**
   * Limpia etiquetas HTML y entidades codificadas de cadenas de texto
   */
  public static cleanHtml(str: string): string {
    return (str || '')
      .replace(/<[^>]*>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Genera consultas de búsqueda inteligentes y optimizadas a partir del texto:
   * 1. Citas textuales entre comillas ("...", «...», “...”)
   * 2. Oraciones de alta densidad semántica (evitando frases genéricas)
   * 3. Términos clave distintivos (n-gramas)
   * 
   * APLICACIÓN DE PRESUPUESTO ESTRICTO: Máximo 2-3 consultas para proteger la cuota de la API
   */
  public static generateSearchQueries(text: string, maxQueries: number = 3): string[] {
    const queries: string[] = [];

    // 1. Extraer citas textuales directas si existen (la mayor sospecha de plagio)
    const quoteMatches = text.match(/["«“]([^"»”]{18,120})["»”]/g);
    if (quoteMatches) {
      for (const q of quoteMatches.slice(0, 2)) {
        const cleanedQuote = q.replace(/["«“»”]/g, '').trim();
        if (cleanedQuote.length >= 18) {
          queries.push(cleanedQuote);
        }
      }
    }

    // 2. Extraer oraciones de alta informatividad (proposiciones salientes)
    const sentences = text
      .split(/[.!?\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 35 && s.length <= 140);

    // Evaluar cada oración por densidad de palabras con contenido sustantivo
    const scoredSentences = sentences.map((sent) => {
      const tokens = TextSimilarity.tokenize(sent);
      const contentTokens = TextSimilarity.filterStopWords(tokens);
      const density = contentTokens.length / Math.max(tokens.length, 1);
      return { sent, density, contentCount: contentTokens.length };
    });

    // Ordenar de mayor a menor densidad semántica
    scoredSentences.sort((a, b) => b.density - a.density || b.contentCount - a.contentCount);

    for (const item of scoredSentences) {
      if (queries.length >= maxQueries) break;
      if (!queries.some((q) => q.includes(item.sent) || item.sent.includes(q))) {
        queries.push(item.sent);
      }
    }

    // 3. Si aún no alcanzamos el límite, generar consulta por n-gramas distintivos
    if (queries.length < maxQueries) {
      const tokens = TextSimilarity.tokenize(text);
      const contentTokens = TextSimilarity.filterStopWords(tokens);
      const uniqueWords = Array.from(new Set(contentTokens));

      if (uniqueWords.length >= 4) {
        queries.push(uniqueWords.slice(0, 6).join(' '));
      }
    }

    return Array.from(new Set(queries)).slice(0, maxQueries);
  }

  /**
   * Búsqueda mediante Google Custom Search JSON API (Proveedor oficial preferido)
   */
  public static async searchGoogleCustomSearch(
    query: string,
    timeoutMs: number = 4000
  ): Promise<RawWebSearchResult[]> {
    const apiKey = ENV.GOOGLE_SEARCH_API_KEY;
    const cx = ENV.GOOGLE_SEARCH_CX;

    if (!apiKey || !cx) {
      return [];
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const endpoint = new URL('https://www.googleapis.com/customsearch/v1');
      endpoint.searchParams.set('key', apiKey);
      endpoint.searchParams.set('cx', cx);
      endpoint.searchParams.set('q', query);
      endpoint.searchParams.set('num', '5');
      endpoint.searchParams.set('hl', 'es');

      const res = await fetch(endpoint.toString(), {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timer);

      if (!res.ok) {
        const errorBody = await res.text().catch(() => '');
        console.warn(`[GoogleCustomSearch] Error HTTP ${res.status}: ${errorBody.slice(0, 200)}`);
        return [];
      }

      const data = (await res.json()) as GoogleCustomSearchResponse;
      if (!data.items || data.items.length === 0) {
        return [];
      }

      const results: RawWebSearchResult[] = [];

      for (const item of data.items) {
        if (!item.link || !item.title) continue;

        const url = item.link;
        const title = this.cleanHtml(item.title);
        const snippet = this.cleanHtml(item.snippet || '');

        // Extracción de metadatos desde el pagemap de Google
        const meta = item.pagemap?.metatags?.[0] || {};
        const author = meta['author'] || meta['article:author'] || meta['bauthor'] || undefined;
        const publisher = meta['og:site_name'] || meta['application-name'] || undefined;

        // Intentar deducir año de publicación
        let year: number | undefined;
        const dateStr =
          meta['article:published_time'] ||
          meta['date'] ||
          meta['pubdate'] ||
          meta['og:updated_time'];

        if (dateStr) {
          const match = /(\d{4})/.exec(dateStr);
          if (match) {
            year = parseInt(match[1], 10);
          }
        }

        if (!year) {
          const snippetYearMatch = /\b(20\d{2}|19\d{2})\b/.exec(snippet);
          if (snippetYearMatch) {
            year = parseInt(snippetYearMatch[1], 10);
          }
        }

        results.push({
          url,
          title,
          snippet,
          author,
          publisher,
          year,
        });
      }

      return results;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('[GoogleCustomSearch] Error en petición:', err.message || err);
      }
      return [];
    }
  }

  /**
   * Búsqueda mediante Tavily Search API (Alternativa especializada para IA e investigación)
   */
  public static async searchTavily(query: string, timeoutMs: number = 3500): Promise<RawWebSearchResult[]> {
    const apiKey = ENV.TAVILY_API_KEY;
    if (!apiKey) return [];

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: 'basic',
          max_results: 5,
          include_domains: [],
          exclude_domains: [],
        }),
      });
      clearTimeout(timer);

      if (!res.ok) return [];
      const data = (await res.json()) as {
        results?: Array<{ title: string; url: string; content: string; published_date?: string }>;
      };

      if (!data.results) return [];

      return data.results.map((r) => {
        let year: number | undefined;
        if (r.published_date) {
          const yMatch = /(\d{4})/.exec(r.published_date);
          if (yMatch) year = parseInt(yMatch[1], 10);
        }

        return {
          url: r.url,
          title: this.cleanHtml(r.title),
          snippet: this.cleanHtml(r.content || ''),
          year,
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * Búsqueda mediante Serper API (Alternativa Google SERP)
   */
  public static async searchSerper(query: string, timeoutMs: number = 3500): Promise<RawWebSearchResult[]> {
    const apiKey = ENV.SERPER_API_KEY;
    if (!apiKey) return [];

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query, gl: 'es', hl: 'es', num: 5 }),
      });
      clearTimeout(timer);

      if (!res.ok) return [];
      const data = (await res.json()) as {
        organic?: Array<{ title: string; link: string; snippet: string; date?: string }>;
      };

      if (!data.organic) return [];

      return data.organic.map((item) => {
        let year: number | undefined;
        if (item.date) {
          const m = /(\d{4})/.exec(item.date);
          if (m) year = parseInt(m[1], 10);
        }
        return {
          url: item.link,
          title: this.cleanHtml(item.title),
          snippet: this.cleanHtml(item.snippet || ''),
          year,
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * Búsqueda en catálogo científico global OpenAlex (250M+ obras académicas con DOIs)
   */
  public static async searchOpenAlex(keywords: string[], timeoutMs: number = 2800): Promise<RawWebSearchResult[]> {
    if (keywords.length === 0) return [];
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const q = encodeURIComponent(keywords.slice(0, 6).join(' '));
      const url = `https://api.openalex.org/works?search=${q}&per-page=3`;

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'VeritasAcademicSearch/2.0 (mailto:contact@veritas.ai)' },
      });
      clearTimeout(timer);

      if (!res.ok) return [];
      const data = (await res.json()) as { results?: OpenAlexWork[] };
      if (!data.results || data.results.length === 0) return [];

      const results: RawWebSearchResult[] = [];
      for (const item of data.results) {
        if (!item.display_name) continue;
        const title = item.display_name;
        const authors = (item.authorships || [])
          .map((a) => a.author?.display_name)
          .filter(Boolean)
          .slice(0, 2)
          .join(' & ');

        const year = item.publication_year || undefined;
        const url = item.doi || item.primary_location?.landing_page_url || 'https://openalex.org';
        const venue = item.primary_location?.source?.display_name || 'Publicación Científica';

        results.push({
          url,
          title: `${authors ? authors + ': ' : ''}${title}`,
          snippet: `Publicación académica indexada en OpenAlex: "${title}" (${venue}, ${year || 's.f.'}).`,
          year,
          author: authors || venue,
          publisher: venue,
        });
      }

      return results;
    } catch {
      return [];
    }
  }

  /**
   * Búsqueda en Crossref (Registro de DOIs y literatura científica indexada)
   */
  public static async searchCrossref(keywords: string[], timeoutMs: number = 2800): Promise<RawWebSearchResult[]> {
    if (keywords.length === 0) return [];
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const query = encodeURIComponent(keywords.slice(0, 7).join(' '));
      const url = `https://api.crossref.org/works?query=${query}&rows=2`;

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'VeritasAcademicSearch/2.0 (academic-plagiarism-checker; contact@veritas.ai)',
          Accept: 'application/json',
        },
      });
      clearTimeout(timer);

      if (!res.ok) return [];
      const json = (await res.json()) as { message?: { items?: CrossrefItem[] } };
      if (!json.message?.items) return [];

      const results: RawWebSearchResult[] = [];
      for (const item of json.message.items) {
        if (!item.title || item.title.length === 0) continue;
        const title = item.title[0];
        const authorObj = item.author?.[0];
        const authorFamily = authorObj?.family || '';
        const authorGiven = authorObj?.given || '';

        const authorName = authorFamily
          ? `${authorFamily}${authorGiven ? ', ' + authorGiven.charAt(0) + '.' : ''}`
          : item.publisher || 'Publicación Científica';

        const year = item.issued?.['date-parts']?.[0]?.[0] || undefined;
        const publisher = item['container-title']?.[0] || item.publisher || 'Editorial Académica';
        const sourceUrl = item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : 'https://crossref.org');

        results.push({
          url: sourceUrl,
          title: `${authorName}: ${title}`,
          snippet: `Publicación académica indexada en Crossref: "${title}" (${publisher}, ${year || 's.f.'}).`,
          year,
          author: authorName,
          publisher,
        });
      }

      return results;
    } catch {
      return [];
    }
  }

  /**
   * Búsqueda pública abierta (DuckDuckGo HTML) para entornos sin claves API
   */
  public static async searchDuckDuckGo(query: string, timeoutMs: number = 3500): Promise<RawWebSearchResult[]> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        },
      });
      clearTimeout(timer);

      if (!res.ok) return [];
      const html = await res.text();

      const results: RawWebSearchResult[] = [];
      const blocks = html.split(/class="[^"]*web-result\s*[^"]*"/);

      for (let i = 1; i < blocks.length; i++) {
        const block = blocks[i];
        if (block.includes('result--ad') || block.includes('ad_provider')) continue;

        const titleMatch = /<h2\s+class="result__title"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
        if (!titleMatch) continue;

        let rawUrl = titleMatch[1];
        if (rawUrl.includes('uddg=')) {
          const uddgMatch = /uddg=([^&]+)/.exec(rawUrl);
          if (uddgMatch) {
            try {
              rawUrl = decodeURIComponent(uddgMatch[1]);
            } catch {
              // conservar
            }
          }
        }

        if (!rawUrl.startsWith('http')) continue;

        const snippetMatch = /<a\s+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
        const snippet = snippetMatch ? this.cleanHtml(snippetMatch[1]) : '';
        const title = this.cleanHtml(titleMatch[2]);

        const dateMatch = /<span>&nbsp;\s*&nbsp;\s*([0-9]{4})-[0-9]{2}-[0-9]{2}[^<]*<\/span>/i.exec(block);
        const year = dateMatch ? parseInt(dateMatch[1], 10) : undefined;

        results.push({
          url: rawUrl,
          title,
          snippet,
          year,
        });
      }

      return results;
    } catch {
      return [];
    }
  }

  // Caché en memoria para evitar repetir búsquedas idénticas y ahorrar cuota / créditos
  private static QUERY_CACHE = new Map<string, { timestamp: number; results: RawWebSearchResult[] }>();
  private static CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 horas de persistencia en caché

  /**
   * Ejecuta la búsqueda según el proveedor configurado con caché integrada
   */
  public static async executeSearch(query: string): Promise<RawWebSearchResult[]> {
    const normalizedKey = query.trim().toLowerCase();
    const now = Date.now();

    // 1. Verificar si ya existe en caché para gastar 0 créditos
    const cached = this.QUERY_CACHE.get(normalizedKey);
    if (cached && now - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.results;
    }

    const provider = ENV.SEARCH_PROVIDER;
    let hits: RawWebSearchResult[] = [];

    // 2. Serper API (Si está configurado como proveedor preferido o auto)
    if (provider === 'serper' || (provider === 'auto' && ENV.SERPER_API_KEY)) {
      hits = await this.searchSerper(query);
    }

    // 3. Google Custom Search (Si serper no devolvió y google está activo)
    if (hits.length === 0 && (provider === 'google' || (provider === 'auto' && ENV.GOOGLE_SEARCH_API_KEY && ENV.GOOGLE_SEARCH_CX))) {
      hits = await this.searchGoogleCustomSearch(query);
    }

    // 4. Tavily Search
    if (hits.length === 0 && (provider === 'tavily' || (provider === 'auto' && ENV.TAVILY_API_KEY))) {
      hits = await this.searchTavily(query);
    }

    // 5. Fallback de catálogos académicos y web abierta
    if (hits.length === 0) {
      hits = await this.searchDuckDuckGo(query);
    }

    // Almacenar en caché si devolvió resultados
    if (hits.length > 0) {
      // Limitar tamaño de caché para prevenir fugas de memoria (máx. 500 consultas)
      if (this.QUERY_CACHE.size > 500) {
        const oldestKey = this.QUERY_CACHE.keys().next().value;
        if (oldestKey) this.QUERY_CACHE.delete(oldestKey);
      }
      this.QUERY_CACHE.set(normalizedKey, { timestamp: now, results: hits });
    }

    return hits;
  }

  /**
   * Ejecuta peticiones HTTP explícitas a motores de búsqueda (Serper API, Google Custom Search, etc.)
   * y devuelve los resultados brutos de la web (títulos, URLs, snippets y metadatos)
   * listos para ser consumidos por el LLM o el evaluador de similitud.
   */
  public static async fetchRawWebResults(userText: string): Promise<RawWebSearchResult[]> {
    const wordCount = userText.split(/\s+/).filter(Boolean).length;
    const maxQueriesAllowed = wordCount > 300 ? 2 : 1;

    const queries = this.generateSearchQueries(userText, maxQueriesAllowed);
    if (queries.length === 0) {
      return [];
    }

    try {
      const allCandidates: RawWebSearchResult[] = [];

      // Ejecución inteligente con interrupción temprana (Early Exit):
      // Si la primera consulta ya encuentra coincidencias con alta similitud,
      // no gasta más créditos en consultas secundarias.
      for (let i = 0; i < queries.length; i++) {
        const q = queries[i];
        const hits = await this.executeSearch(q);
        allCandidates.push(...hits);

        // Evaluar si ya tenemos coincidencias fuertes para frenar y ahorrar créditos
        if (hits.length > 0 && i < queries.length - 1) {
          const quickMatches = hits.filter((h) => {
            const score = TextSimilarity.scoreMatch(userText, h.snippet, h.title).similarityPercentage;
            return score >= 35;
          });

          if (quickMatches.length >= 2) {
            break;
          }
        }
      }

      // Si no hubo resultados en la web, consultar repositorios académicos abiertos (OpenAlex / Crossref: 0 créditos)
      if (allCandidates.length === 0) {
        const keywords = TextSimilarity.filterStopWords(TextSimilarity.tokenize(userText)).slice(0, 5);
        const [openAlexHits, crossrefHits] = await Promise.all([
          this.searchOpenAlex(keywords),
          this.searchCrossref(keywords),
        ]);
        allCandidates.push(...openAlexHits, ...crossrefHits);
      }

      return allCandidates;
    } catch (error) {
      console.warn('[LiveSearchService] Error al consultar motores de búsqueda:', error);
      return [];
    }
  }

  /**
   * Convierte candidatos brutos de la web en fuentes cotejadas con similitud matemática y citas APA 7 / IEEE
   */
  public static formatMatchedSources(userText: string, allCandidates: RawWebSearchResult[]): MatchedSource[] {
    if (!allCandidates || allCandidates.length === 0) {
      return [];
    }

    const scoredSources: MatchedSource[] = [];
    const seenDomains = new Set<string>();

    for (const candidate of allCandidates) {
      if (!candidate.url || !candidate.title) continue;

      let domain = '';
      try {
        domain = new URL(candidate.url).hostname.replace(/^www\./, '').toLowerCase();
      } catch {
        domain = candidate.url;
      }

      if (seenDomains.has(domain)) continue;

      // Calcular similitud matemática real usando el módulo de NLP TextSimilarity
      const matchResult = TextSimilarity.scoreMatch(
        userText,
        candidate.snippet,
        candidate.title
      );

      // Umbral de significancia: descartar fuentes con coincidencia puramente casual (< 10%)
      if (matchResult.similarityPercentage < 10) {
        continue;
      }

      seenDomains.add(domain);

      // Generar citas dinámicas según normas APA 7 e IEEE
      const citationMeta: CitationMetadata = {
        url: candidate.url,
        title: candidate.title,
        author: candidate.author,
        siteName: candidate.publisher,
        year: candidate.year,
      };

      const apa7 = CitationService.generateApa7(citationMeta);
      const ieee = CitationService.generateIeee(citationMeta, scoredSources.length + 1);

      scoredSources.push({
        sourceUrl: candidate.url,
        sourceTitle: candidate.title,
        matchedText: matchResult.matchedText,
        userSnippet: matchResult.userSnippet,
        similarityPercentage: matchResult.similarityPercentage,
        apaCitation: {
          inText: apa7.inText,
          reference: apa7.reference,
        },
        ieeeCitation: {
          inText: ieee.inText,
          reference: ieee.reference,
        },
      });
    }

    // Ordenar fuentes por porcentaje de similitud descendente
    scoredSources.sort((a, b) => b.similarityPercentage - a.similarityPercentage);

    return scoredSources.slice(0, 4);
  }

  /**
   * Rastreo web real y cotejo de similitud matemática contra el texto de entrada.
   * Optimizado con "Early-Exit" para consumir la menor cantidad posible de peticiones/créditos.
   */
  public static async searchInternetSources(userText: string): Promise<MatchedSource[]> {
    try {
      const candidates = await this.fetchRawWebResults(userText);
      return this.formatMatchedSources(userText, candidates);
    } catch (error) {
      console.warn('[LiveSearchService] Error al buscar fuentes en internet:', error);
      return [];
    }
  }

  /**
   * Helper para generación directa de cita APA 7 (mantiene retrocompatibilidad con tests)
   */
  public static buildApaCitation(
    sourceTitle: string,
    sourceUrl: string,
    author?: string,
    year?: number | string
  ): ApaCitation {
    const citation = CitationService.generateApa7({
      title: sourceTitle,
      url: sourceUrl,
      author,
      year,
    });
    return {
      inText: citation.inText,
      reference: citation.reference,
    };
  }
}
