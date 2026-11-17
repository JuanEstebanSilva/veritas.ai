import { LiveSearchService, MatchedSource, ApaCitation } from '../services/LiveSearchService';
import { CitationService } from '../services/CitationService';

export { MatchedSource, ApaCitation };

export interface SimilarityReport {
  overallSimilarityScore: number;
  sources: MatchedSource[];
  disclaimer: string;
}

export class SimilarityEngine {
  /**
   * Construye un informe de similitud a partir de un listado de fuentes ya cotejadas
   */
  public static buildReportFromSources(liveSources: MatchedSource[]): SimilarityReport {
    if (liveSources && liveSources.length > 0) {
      // Cálculo honesto del índice de similitud basado en las fuentes reales encontradas
      const topScores = liveSources.map((s) => s.similarityPercentage);
      const maxScore = topScores[0];
      const secondaryContribution = topScores
        .slice(1)
        .reduce((acc, score, idx) => acc + score / ((idx + 2) * 2.5), 0);

      const overallSimilarityScore = Math.min(
        100,
        Math.max(0, Math.round(maxScore + secondaryContribution))
      );

      return {
        overallSimilarityScore,
        sources: liveSources,
        disclaimer:
          'Aviso: El porcentaje representa un "Índice de similitud" verificado contra fuentes públicas de internet y repositorios académicos indexados en tiempo real. Una coincidencia no implica automáticamente plagio, ya que puede corresponder a citas legítimas o conceptos técnicos.',
      };
    }

    // Si no hay coincidencias reales en internet, reportar 0% honestamente
    return {
      overallSimilarityScore: 0,
      sources: [],
      disclaimer:
        'No se encontraron coincidencias directas con fuentes públicas indexadas en la web. El texto presenta alta originalidad.',
    };
  }

  /**
   * Analiza candidatos brutos de la web (Serper / Google Custom Search) y genera el informe
   */
  public static analyzeFromRawCandidates(
    userText: string,
    rawCandidates: import('../services/LiveSearchService').RawWebSearchResult[]
  ): SimilarityReport {
    const liveSources = LiveSearchService.formatMatchedSources(userText, rawCandidates);
    return this.buildReportFromSources(liveSources);
  }

  /**
   * Analiza el texto del usuario cotejándolo contra la web en tiempo real
   * mediante Google Custom Search API, repositorios académicos y motores abiertos.
   * 
   * NO CONTIENE DATOS QUEMADOS NI FUENTES HARDCODEADAS.
   */
  public static async analyzeSimilarity(userText: string): Promise<SimilarityReport> {
    if (!userText || userText.trim().length < 15) {
      return {
        overallSimilarityScore: 0,
        sources: [],
        disclaimer: 'El texto es demasiado breve para realizar un análisis de similitud confiable.',
      };
    }

    try {
      const rawCandidates = await LiveSearchService.fetchRawWebResults(userText);
      return this.analyzeFromRawCandidates(userText, rawCandidates);
    } catch (error) {
      console.warn('[SimilarityEngine] Error al ejecutar análisis de similitud en vivo:', error);
      return {
        overallSimilarityScore: 0,
        sources: [],
        disclaimer: 'No se pudo completar el cotejo web en este momento. Inténtalo nuevamente.',
      };
    }
  }

  /**
   * Genera cita en normas APA 7ma edición a partir de título y URL
   */
  public static buildApaCitation(
    sourceTitle: string,
    sourceUrl: string,
    author?: string,
    year?: number | string
  ): ApaCitation {
    const res = CitationService.generateApa7({
      title: sourceTitle,
      url: sourceUrl,
      author,
      year,
    });
    return {
      inText: res.inText,
      reference: res.reference,
    };
  }
}
