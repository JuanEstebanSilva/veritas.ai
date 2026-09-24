import { createHash } from 'crypto';
import { ENV } from '../config/env';
import {
  LinguisticEngine,
  AiDetectionReport,
} from '../utils/linguisticEngine';
import { SimilarityEngine, SimilarityReport } from '../utils/similarityCorpus';
import { LiveSearchService, RawWebSearchResult } from './LiveSearchService';
import { CitationService } from './CitationService';

export interface FullAnalysisPayload {
  aiReport: AiDetectionReport;
  similarityReport: SimilarityReport;
}

export interface WritingImprovementResult {
  improvedText: string;
  summaryOfChanges: string[];
}

interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

export class AIService {
  private static readonly CACHE_TTL_MS = 1000 * 60 * 60 * 2; // 2 horas de vida útil en caché
  private static readonly MAX_CACHE_SIZE = 1000;
  private static readonly HUMANIZER_CACHE = new Map<string, CacheEntry<WritingImprovementResult>>();
  private static readonly AI_REPORT_CACHE = new Map<string, CacheEntry<AiDetectionReport>>();

  /**
   * Genera un hash SHA-256 criptográfico a partir del texto normalizado
   */
  private static getHash(text: string): string {
    return createHash('sha256').update(text.trim()).digest('hex');
  }

  /**
   * Almacena en caché respetando el límite de elementos para prevenir fugas de memoria
   */
  private static setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T): void {
    if (cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey) cache.delete(oldestKey);
    }
    cache.set(key, { timestamp: Date.now(), data });
  }

  /**
   * Analiza probabilidad de contenido generado por IA (100% offline, 0 tokens)
   */
  public static async analyzeAI(text: string): Promise<AiDetectionReport> {
    if (!text || text.trim().length === 0) {
      return LinguisticEngine.analyzeFullText(text);
    }

    const hash = this.getHash(text);
    const cached = this.AI_REPORT_CACHE.get(hash);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }

    const report = LinguisticEngine.analyzeFullText(text);
    this.setCache(this.AI_REPORT_CACHE, hash, report);
    return report;
  }

  /**
   * Analiza índice de similitud con fuentes públicas cotejadas en tiempo real.
   * Flujo arquitectónico:
   * 1. Consulta web explícita mediante peticiones HTTP (Serper API, Google Custom Search o repositorios).
   * 2. Pasa el texto extraído y los fragmentos reales de internet al LLM (Gemini con Grounding o OpenAI)
   *    para calcular el porcentaje real y generar las citas formales en APA 7ma edición e IEEE.
   * 3. Fallback algorítmico local determinista cuando no hay clave externa de LLM o en modo local.
   */
  public static async analyzeSimilarity(text: string): Promise<SimilarityReport> {
    if (!text || text.trim().length < 15) {
      return SimilarityEngine.analyzeSimilarity(text);
    }

    try {
      // 1. Petición HTTP explícita a la API de búsqueda web
      const rawWebResults = await LiveSearchService.fetchRawWebResults(text);

      // 2. Si hay LLM configurado (Gemini con Grounding o OpenAI), evaluar similitud y citas con el LLM
      const llmReport = await this.evaluateSimilarityWithLLM(text, rawWebResults);
      if (llmReport && Array.isArray(llmReport.sources)) {
        return llmReport;
      }

      // 3. Fallback algorítmico local determinista
      return SimilarityEngine.analyzeFromRawCandidates(text, rawWebResults);
    } catch (err) {
      console.warn('[AIService] Error en analyzeSimilarity:', err);
      return SimilarityEngine.analyzeSimilarity(text);
    }
  }

  /**
   * Ejecuta ambos análisis en conjunto de forma óptima
   */
  public static async runFullAnalysis(text: string): Promise<FullAnalysisPayload> {
    const [aiReport, similarityReport] = await Promise.all([
      this.analyzeAI(text),
      this.analyzeSimilarity(text),
    ]);

    return {
      aiReport,
      similarityReport,
    };
  }

  /**
   * Pipeline de Humanización y Transformación Estilística.
   * 
   * AHORRO RADICAL DE TOKENS:
   * 1. Consulta la caché SHA-256; si ya existe, devuelve inmediatamente con 0 TOKENS consumidos.
   * 2. Si existe API externa, envía un prompt de alta densidad lingüística y aplica un límite estricto
   *    de max_tokens ajustado al tamaño exacto del texto de entrada.
   * 3. Si no hay API externa o falla la conexión, usa el motor heurístico offline sin dependencias externas.
   */
  public static async improveWriting(text: string): Promise<WritingImprovementResult> {
    if (!text || text.trim().length < 15) {
      return {
        improvedText: text,
        summaryOfChanges: ['Texto demasiado breve para reestructuración estilométrica.'],
      };
    }

    const hash = this.getHash(text);
    const cached = this.HUMANIZER_CACHE.get(hash);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }

    const provider = ENV.AI_PROVIDER;
    const openaiKey = ENV.OPENAI_API_KEY || (provider === 'openai' ? ENV.AI_API_KEY : '');
    const geminiKey = ENV.GEMINI_API_KEY || (provider === 'gemini' ? ENV.AI_API_KEY : '');

    let result: WritingImprovementResult | null = null;

    // 1. Intentar proveedor OpenAI
    if ((provider === 'openai' || openaiKey) && openaiKey) {
      try {
        const model = ENV.AI_MODEL || 'gpt-4o-mini';
        result = await this.humanizeWithOpenAI(text, openaiKey, model, ENV.AI_TEMPERATURE);
      } catch (err) {
        console.warn('[AIService] OpenAI falló, recurriendo a motor lingüístico:', err);
      }
    }

    // 2. Intentar proveedor Google Gemini
    if (!result && (provider === 'gemini' || geminiKey) && geminiKey) {
      try {
        const model = ENV.AI_MODEL || 'gemini-1.5-flash';
        result = await this.humanizeWithGemini(text, geminiKey, model, ENV.AI_TEMPERATURE);
      } catch (err) {
        console.warn('[AIService] Gemini falló, recurriendo a motor lingüístico:', err);
      }
    }

    // 3. Fallback Heurístico Estilístico Offline (cero consumo de tokens externos)
    if (!result) {
      result = LinguisticEngine.improveWriting(text);
    }

    // Almacenar en caché para subsecuentes consultas idénticas
    this.setCache(this.HUMANIZER_CACHE, hash, result);
    return result;
  }

  /**
   * Reescritura y Humanización mediante OpenAI API con presupuesto estricto de tokens
   */
  private static async humanizeWithOpenAI(
    text: string,
    apiKey: string,
    model: string,
    temperature: number = 0.7
  ): Promise<WritingImprovementResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    // Prompt conciso de alta densidad para ahorrar ~200 tokens de entrada en cada llamada
    const systemPrompt = `Actúa como editor académico senior y escritor profesional.
Humaniza el texto erradicando clichés de IA ("es crucial destacar", "un tapiz de", "en conclusión", "juega un papel fundamental") y variando el ritmo oracional con burstiness orgánico.
Elimina completamente notas al pie numéricas ([n]), corchetes de referencia enciclopédica y paréntesis ortopédicos, integrando las ideas en prosa humana fluida y natural.
Preserva intactas citas textuales entre comillas ("..."), cifras numéricas y nombres propios.
Devuelve EXCLUSIVAMENTE este JSON válido:
{"improvedText": "Texto humanizado completo...", "summaryOfChanges": ["cambio estilístico 1", "cambio 2"]}`;

    // Límite estricto de tokens de salida proporcional al texto original
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const maxTokens = Math.min(2500, Math.max(250, Math.ceil(wordCount * 2.2)));

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
      }),
    });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`OpenAI HTTP ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as any;
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Respuesta vacía de OpenAI');
    }

    const parsed = JSON.parse(content);
    return {
      improvedText: parsed.improvedText || text,
      summaryOfChanges: Array.isArray(parsed.summaryOfChanges) && parsed.summaryOfChanges.length > 0
        ? parsed.summaryOfChanges
        : ['Optimización de cadencia sintáctica', 'Eliminación de conectores predecibles'],
    };
  }

  /**
   * Reescritura y Humanización mediante Google Gemini REST API con presupuesto estricto de tokens
   */
  private static async humanizeWithGemini(
    text: string,
    apiKey: string,
    model: string,
    temperature: number = 0.7
  ): Promise<WritingImprovementResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    const prompt = `Actúa como editor académico senior y escritor profesional.
Humaniza el texto eliminando clichés de IA y variando el ritmo sintáctico con cadencia humana orgánica.
Elimina notas al pie numéricas ([n]), corchetes de fuentes y paréntesis ortopédicos, integrando las ideas en prosa fluida y natural.
Preserva intactas citas textuales entre comillas, cifras numéricas y nombres propios.

Devuelve ÚNICAMENTE un JSON válido con este esquema:
{"improvedText": "Texto reescrito completo...", "summaryOfChanges": ["cambio 1", "cambio 2"]}

Texto a humanizar:
${text}`;

    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const maxOutputTokens = Math.min(2500, Math.max(250, Math.ceil(wordCount * 2.2)));

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens,
          responseMimeType: 'application/json',
        },
      }),
    });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`Gemini HTTP ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as any;
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Respuesta vacía de Gemini');
    }

    const cleaned = candidateText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      improvedText: parsed.improvedText || text,
      summaryOfChanges: Array.isArray(parsed.summaryOfChanges) && parsed.summaryOfChanges.length > 0
        ? parsed.summaryOfChanges
        : ['Ajuste de cadencia estilométrica', 'Reestructuración sintáctica natural'],
    };
  }

  /**
   * Evalúa la originalidad del texto cotejándolo con los resultados brutos de búsqueda web mediante LLM.
   * Si el proveedor es Gemini, activa Grounding con Google Search.
   */
  public static async evaluateSimilarityWithLLM(
    text: string,
    webSources: RawWebSearchResult[]
  ): Promise<SimilarityReport | null> {
    const provider = ENV.AI_PROVIDER;
    const geminiKey = ENV.GEMINI_API_KEY || (provider === 'gemini' ? ENV.AI_API_KEY : '');
    const openaiKey = ENV.OPENAI_API_KEY || (provider === 'openai' ? ENV.AI_API_KEY : '');

    // 1. Prioridad: Gemini con Google Search Grounding si está configurado
    if ((provider === 'gemini' || geminiKey) && geminiKey) {
      try {
        const model = ENV.AI_MODEL || 'gemini-1.5-flash';
        const report = await this.evaluateSimilarityWithGemini(text, webSources, geminiKey, model);
        if (report) return report;
      } catch (err) {
        console.warn('[AIService] Gemini Grounding falló, intentando alternativa:', err);
      }
    }

    // 2. OpenAI si está configurado
    if ((provider === 'openai' || openaiKey) && openaiKey) {
      try {
        const model = ENV.AI_MODEL || 'gpt-4o-mini';
        const report = await this.evaluateSimilarityWithOpenAI(text, webSources, openaiKey, model);
        if (report) return report;
      } catch (err) {
        console.warn('[AIService] OpenAI similitud falló:', err);
      }
    }

    return null;
  }

  /**
   * Evaluación de similitud mediante Google Gemini REST API con parámetro de Grounding activado:
   * tools: [{ googleSearch: {} }]
   */
  private static async evaluateSimilarityWithGemini(
    text: string,
    webSources: RawWebSearchResult[],
    apiKey: string,
    model: string
  ): Promise<SimilarityReport | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);

    const sourcesContext = (webSources || []).slice(0, 5).map((s, idx) => 
      `[Fuente ${idx + 1}] Título: ${s.title}\nURL: ${s.url}\nFragmento: ${s.snippet}\nAño: ${s.year || 's.f.'}\nAutor: ${s.author || 'Desconocido'}`
    ).join('\n\n');

    const prompt = `Actúa como auditor académico de originalidad y experto en normas bibliográficas APA 7ma edición e IEEE.
Analiza el siguiente texto de un estudiante y compáralo con los resultados reales obtenidos de la búsqueda web.
Verifica si existen oraciones copiadas, parafraseadas sin citar, o citas textuales legítimas entre comillas.

Resultados reales de la búsqueda web (para contrastación):
${sourcesContext || 'No se obtuvieron fuentes directas de la consulta previa; utiliza Google Search Grounding para verificar si el texto corresponde a alguna obra indexada en internet.'}

Texto del estudiante a analizar:
"""
${text}
"""

Instrucciones:
1. Determina el porcentaje de similitud real (overallSimilarityScore de 0 a 100). Si el texto es original o las citas están debidamente entrecomilladas, el puntaje debe ser bajo.
2. Identifica las fuentes coincidentes más relevantes (máximo 4).
3. Para cada fuente, proporciona el porcentaje de coincidencia, el fragmento coincidente (matchedText), el fragmento del usuario (userSnippet) y la cita bibliográfica en normas APA 7ma edición (inText y reference).
4. Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta:
{
  "overallSimilarityScore": 25,
  "sources": [
    {
      "sourceUrl": "https://...",
      "sourceTitle": "Título de la obra...",
      "matchedText": "Fragmento coincidente de la fuente...",
      "userSnippet": "Fragmento del texto del estudiante...",
      "similarityPercentage": 25,
      "apaCitation": {
        "inText": "(Apellido, 2024)",
        "reference": "Apellido, A. (2024). Título de la obra. Editorial o Sitio. URL"
      }
    }
  ],
  "disclaimer": "Análisis verificado mediante búsqueda web en tiempo real y Grounding de Google Search."
}`;

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          // Activación explícita de Grounding con Google Search
          tools: [{ googleSearch: {} }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2000,
          },
        }),
      });
      clearTimeout(timer);

      if (!res.ok) {
        console.warn(`[Gemini Grounding] HTTP ${res.status}: ${await res.text()}`);
        return null;
      }

      const data = (await res.json()) as any;
      const candidate = data.candidates?.[0];
      const candidateText = candidate?.content?.parts?.map((p: any) => p.text || '').join('') || '';
      if (!candidateText) return null;

      const jsonMatch = candidateText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]);
      if (typeof parsed.overallSimilarityScore !== 'number') return null;

      // Enriquecer con metadatos de Grounding devueltos por Google Search si están disponibles
      const groundingChunks = candidate.groundingMetadata?.groundingChunks;
      const sources = Array.isArray(parsed.sources) ? parsed.sources : [];

      if (Array.isArray(groundingChunks) && groundingChunks.length > 0 && sources.length === 0) {
        for (let i = 0; i < Math.min(groundingChunks.length, 3); i++) {
          const chunk = groundingChunks[i];
          const uri = chunk.web?.uri || 'https://google.com';
          const title = chunk.web?.title || `Fuente Web ${i + 1}`;
          const apa = CitationService.generateApa7({ title, url: uri });
          const ieee = CitationService.generateIeee({ title, url: uri }, i + 1);

          sources.push({
            sourceUrl: uri,
            sourceTitle: title,
            matchedText: 'Coincidencia contrastada mediante Google Search Grounding.',
            userSnippet: text.slice(0, 140),
            similarityPercentage: Math.max(10, Math.round(parsed.overallSimilarityScore / (i + 1))),
            apaCitation: {
              inText: apa.inText,
              reference: apa.reference,
            },
            ieeeCitation: {
              inText: ieee.inText,
              reference: ieee.reference,
            },
          });
        }
      }

      // Asegurar que cada fuente tenga citas APA 7 consistentes
      for (let idx = 0; idx < sources.length; idx++) {
        const s = sources[idx];
        if (!s.apaCitation || !s.apaCitation.reference) {
          const apa = CitationService.generateApa7({ title: s.sourceTitle, url: s.sourceUrl });
          s.apaCitation = { inText: apa.inText, reference: apa.reference };
        }
        if (!s.ieeeCitation) {
          const ieee = CitationService.generateIeee({ title: s.sourceTitle, url: s.sourceUrl }, idx + 1);
          s.ieeeCitation = { inText: ieee.inText, reference: ieee.reference };
        }
      }

      return {
        overallSimilarityScore: Math.min(100, Math.max(0, Math.round(parsed.overallSimilarityScore))),
        sources,
        disclaimer: parsed.disclaimer || 'Aviso: Índice de similitud contrastado con fuentes web y Grounding de Google Search en tiempo real.',
      };
    } catch (err) {
      console.warn('[AIService] Error en evaluateSimilarityWithGemini:', err);
      return null;
    }
  }

  /**
   * Evaluación de similitud mediante OpenAI API con fragmentos de búsqueda web
   */
  private static async evaluateSimilarityWithOpenAI(
    text: string,
    webSources: RawWebSearchResult[],
    apiKey: string,
    model: string
  ): Promise<SimilarityReport | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    const sourcesContext = (webSources || []).slice(0, 5).map((s, idx) => 
      `[Fuente ${idx + 1}] Título: ${s.title}\nURL: ${s.url}\nFragmento: ${s.snippet}\nAño: ${s.year || 's.f.'}\nAutor: ${s.author || 'Desconocido'}`
    ).join('\n\n');

    const systemPrompt = `Actúa como auditor académico de originalidad y normas bibliográficas (APA 7ma edición e IEEE).
El usuario te proporcionará un texto y un listado de fragmentos reales recuperados mediante una API de búsqueda web (Serper / Google Custom Search).
Compara el texto contra las fuentes reales, determina si hay similitud o parafraseo no atribuido, calcula el porcentaje real global (overallSimilarityScore) de 0 a 100 y genera las citas en formato APA 7ma edición.
Devuelve EXCLUSIVAMENTE un JSON válido con este esquema:
{
  "overallSimilarityScore": 0,
  "sources": [
    {
      "sourceUrl": "https://...",
      "sourceTitle": "...",
      "matchedText": "...",
      "userSnippet": "...",
      "similarityPercentage": 0,
      "apaCitation": { "inText": "(...)", "reference": "..." }
    }
  ],
  "disclaimer": "..."
}`;

    const userPrompt = `Fuentes web reales recuperadas por Serper / Google Search:\n${sourcesContext || 'No se encontraron fuentes directas.'}\n\nTexto a analizar:\n${text}`;

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.2,
          max_tokens: 1800,
          response_format: { type: 'json_object' },
        }),
      });
      clearTimeout(timer);

      if (!res.ok) return null;

      const data = (await res.json()) as any;
      const content = data.choices?.[0]?.message?.content;
      if (!content) return null;

      const parsed = JSON.parse(content);
      if (typeof parsed.overallSimilarityScore !== 'number') return null;

      const sources = Array.isArray(parsed.sources) ? parsed.sources : [];
      for (let idx = 0; idx < sources.length; idx++) {
        const s = sources[idx];
        if (!s.apaCitation || !s.apaCitation.reference) {
          const apa = CitationService.generateApa7({ title: s.sourceTitle, url: s.sourceUrl });
          s.apaCitation = { inText: apa.inText, reference: apa.reference };
        }
        if (!s.ieeeCitation) {
          const ieee = CitationService.generateIeee({ title: s.sourceTitle, url: s.sourceUrl }, idx + 1);
          s.ieeeCitation = { inText: ieee.inText, reference: ieee.reference };
        }
      }

      return {
        overallSimilarityScore: Math.min(100, Math.max(0, Math.round(parsed.overallSimilarityScore))),
        sources,
        disclaimer: parsed.disclaimer || 'Aviso: Índice de similitud contrastado con fuentes web indexadas en tiempo real.',
      };
    } catch (err) {
      console.warn('[AIService] Error en evaluateSimilarityWithOpenAI:', err);
      return null;
    }
  }
}

