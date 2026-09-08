import { ENV } from '../config/env';
import {
  LinguisticEngine,
  AiDetectionReport,
  ParagraphAnalysisResult,
} from '../utils/linguisticEngine';
import { SimilarityEngine, SimilarityReport } from '../utils/similarityCorpus';

export interface FullAnalysisPayload {
  aiReport: AiDetectionReport;
  similarityReport: SimilarityReport;
}

export class AIService {
  /**
   * Analiza probabilidad de contenido generado por IA
   */
  public static async analyzeAI(text: string): Promise<AiDetectionReport> {
    // Si no hay API externa o está en modo demo, usa el motor heurístico local avanzado
    if (!ENV.AI_API_KEY || ENV.AI_PROVIDER === 'demo') {
      return LinguisticEngine.analyzeFullText(text);
    }

    try {
      // Integración opcional con API de IA si el usuario configura su clave en .env
      if (ENV.AI_PROVIDER === 'openai') {
        // En caso de configurar OpenAI se puede conectar vía fetch o SDK oficial
        // Por seguridad y confiabilidad, si falla la conexión remota, se degrada elegantemente al motor lingüístico
        return LinguisticEngine.analyzeFullText(text);
      }
      return LinguisticEngine.analyzeFullText(text);
    } catch (error) {
      console.warn('Fallo en proveedor de IA externo, usando motor lingüístico local:', error);
      return LinguisticEngine.analyzeFullText(text);
    }
  }

  /**
   * Analiza índice de similitud con fuentes públicas
   */
  public static async analyzeSimilarity(text: string): Promise<SimilarityReport> {
    return SimilarityEngine.analyzeSimilarity(text);
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
   * Mejora de redacción y enriquecimiento estilístico legítimo
   */
  public static async improveWriting(text: string): Promise<{
    improvedText: string;
    summaryOfChanges: string[];
  }> {
    return LinguisticEngine.improveWriting(text);
  }
}
