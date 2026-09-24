import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { prisma } from '../config/prisma';
import { AIService } from '../services/AIService';
import { DocxService } from '../services/DocxService';
import { recordSuccessfulAnalysis } from '../middleware/dailyLimitGuard';
import { AnalysisType } from '@prisma/client';
import { SimilarityEngine } from '../utils/similarityCorpus';

export class AnalysisController {
  /**
   * Analizar texto pegado directamente
   */
  public static async analyzeText(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { text, title } = req.body;

      if (!text || typeof text !== 'string' || text.trim().length < 15) {
        res.status(400).json({
          success: false,
          message: 'El texto debe contener al menos 15 caracteres para poder ser analizado.',
        });
        return;
      }

      const trimmedText = text.trim();
      const firstWords = trimmedText.split(/\s+/).slice(0, 6).join(' ');
      const autoTitle = firstWords ? `${firstWords}${trimmedText.length > firstWords.length ? '...' : ''}` : 'Análisis de texto';
      const analysisTitle = title && title.trim().length > 0 ? title.trim() : autoTitle;

      // 1. Ejecutar análisis completo mediante AIService
      const { aiReport, similarityReport } = await AIService.runFullAnalysis(trimmedText);

      // 2. Persistir análisis y resultados en base de datos
      const analysis = await prisma.analysis.create({
        data: {
          user_id: user.id,
          type: AnalysisType.TEXT,
          title_or_filename: analysisTitle,
          original_text: trimmedText,
          ai_score: aiReport.overallAiScore,
          similarity_score: similarityReport.overallSimilarityScore,
          results: {
            create: aiReport.paragraphResults.map((pr) => ({
              paragraph_index: pr.paragraphIndex,
              paragraph_text: pr.paragraphText,
              paragraph_ai_score: pr.paragraphAiScore,
              indicators: JSON.stringify(pr.indicators),
              explanation: pr.explanation,
            })),
          },
          sources: {
            create: similarityReport.sources.map((src) => ({
              source_url: src.sourceUrl,
              source_title: src.sourceTitle,
              matched_text: src.matchedText,
              user_snippet: src.userSnippet,
              similarity_percentage: src.similarityPercentage,
            })),
          },
        },
        include: {
          results: true,
          sources: true,
        },
      });

      // 3. Registrar consumo exitoso del límite diario
      const updatedDailyCount = await recordSuccessfulAnalysis(user.id);

      res.status(201).json({
        success: true,
        message: 'Análisis completado exitosamente.',
        analysis: {
          id: analysis.id,
          title: analysis.title_or_filename,
          type: analysis.type,
          originalText: analysis.original_text,
          aiScore: analysis.ai_score,
          similarityScore: analysis.similarity_score,
          overallIndicators: aiReport.overallIndicators,
          summaryExplanation: aiReport.summaryExplanation,
          legalDisclaimer: aiReport.legalDisclaimer,
          similarityDisclaimer: similarityReport.disclaimer,
          paragraphs: analysis.results.map((r) => ({
            index: r.paragraph_index,
            text: r.paragraph_text,
            aiScore: r.paragraph_ai_score,
            indicators: JSON.parse(r.indicators),
            explanation: r.explanation,
          })),
          sources: similarityReport.sources.map((s, idx) => ({
            id: analysis.sources[idx]?.id || `src-${idx}`,
            url: s.sourceUrl,
            title: s.sourceTitle,
            matchedText: s.matchedText,
            userSnippet: s.userSnippet,
            similarityPercentage: s.similarityPercentage,
            apaCitation: s.apaCitation,
          })),
          createdAt: analysis.created_at,
          dailyCount: updatedDailyCount,
        },
      });
    } catch (error: any) {
      console.error('Error en analyzeText:', error);
      res.status(500).json({
        success: false,
        message: 'Ocurrió un error al procesar el análisis de texto.',
      });
    }
  }

  /**
   * Analizar documento (.docx o .pdf) cargado
   */
  public static async analyzeDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No se ha adjuntado ningún documento (.docx o .pdf) para analizar.',
        });
        return;
      }

      const originalName = req.file.originalname;

      // 1. Extraer texto estructurado del documento (.docx o .pdf)
      const { text: extractedText, fileType } = await DocxService.extractTextFromDocument({
        buffer: req.file.buffer,
        originalname: originalName,
        mimetype: req.file.mimetype,
      });

      if (!extractedText || extractedText.length < 15) {
        res.status(400).json({
          success: false,
          message: `El documento ${fileType.toUpperCase()} está vacío o no contiene suficiente texto procesable.`,
        });
        return;
      }

      // 2. Ejecutar análisis completo
      const { aiReport, similarityReport } = await AIService.runFullAnalysis(extractedText);

      // 3. Persistir en base de datos
      const analysis = await prisma.analysis.create({
        data: {
          user_id: user.id,
          type: AnalysisType.DOCX,
          title_or_filename: originalName,
          original_text: extractedText,
          ai_score: aiReport.overallAiScore,
          similarity_score: similarityReport.overallSimilarityScore,
          results: {
            create: aiReport.paragraphResults.map((pr) => ({
              paragraph_index: pr.paragraphIndex,
              paragraph_text: pr.paragraphText,
              paragraph_ai_score: pr.paragraphAiScore,
              indicators: JSON.stringify(pr.indicators),
              explanation: pr.explanation,
            })),
          },
          sources: {
            create: similarityReport.sources.map((src) => ({
              source_url: src.sourceUrl,
              source_title: src.sourceTitle,
              matched_text: src.matchedText,
              user_snippet: src.userSnippet,
              similarity_percentage: src.similarityPercentage,
            })),
          },
        },
        include: {
          results: true,
          sources: true,
        },
      });

      // 4. Registrar consumo exitoso del límite diario
      const updatedDailyCount = await recordSuccessfulAnalysis(user.id);

      res.status(201).json({
        success: true,
        message: `Documento ${fileType.toUpperCase()} analizado exitosamente.`,
        analysis: {
          id: analysis.id,
          title: analysis.title_or_filename,
          type: fileType.toUpperCase(),
          originalText: analysis.original_text,
          aiScore: analysis.ai_score,
          similarityScore: analysis.similarity_score,
          overallIndicators: aiReport.overallIndicators,
          summaryExplanation: aiReport.summaryExplanation,
          legalDisclaimer: aiReport.legalDisclaimer,
          similarityDisclaimer: similarityReport.disclaimer,
          paragraphs: analysis.results.map((r) => ({
            index: r.paragraph_index,
            text: r.paragraph_text,
            aiScore: r.paragraph_ai_score,
            indicators: JSON.parse(r.indicators),
            explanation: r.explanation,
          })),
          sources: similarityReport.sources.map((s, idx) => ({
            id: analysis.sources[idx]?.id || `src-${idx}`,
            url: s.sourceUrl,
            title: s.sourceTitle,
            matchedText: s.matchedText,
            userSnippet: s.userSnippet,
            similarityPercentage: s.similarityPercentage,
            apaCitation: s.apaCitation,
          })),
          createdAt: analysis.created_at,
          dailyCount: updatedDailyCount,
        },
      });
    } catch (error: any) {
      console.error('Error en analyzeDocument:', error);
      res.status(500).json({
        success: false,
        message: 'Ocurrió un error al procesar el archivo cargado.',
      });
    }
  }

  // Alias para retrocompatibilidad con clientes anteriores
  public static analyzeDocx = AnalysisController.analyzeDocument;


  /**
   * Obtener historial de análisis del usuario autenticado
   */
  public static async getHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;

      const analyses = await prisma.analysis.findMany({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          title_or_filename: true,
          type: true,
          ai_score: true,
          similarity_score: true,
          improved_ai_score: true,
          improved_similarity_score: true,
          created_at: true,
        },
      });

      res.status(200).json({
        success: true,
        analyses,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Error al consultar historial.' });
    }
  }

  /**
   * Obtener un análisis específico por ID con protección estricta de propiedad
   */
  public static async getAnalysisById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const id = req.params.id as string;

      const analysis: any = await prisma.analysis.findUnique({
        where: { id },
        include: {
          results: { orderBy: { paragraph_index: 'asc' } },
          sources: { orderBy: { similarity_percentage: 'desc' } },
        },
      });

      if (!analysis) {
        res.status(404).json({ success: false, message: 'Análisis no encontrado.' });
        return;
      }

      // Regla de seguridad fundamental: Un usuario solo puede acceder a sus propios análisis
      if (analysis.user_id !== user.id && user.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Acceso no autorizado: No tienes permiso para ver este análisis.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        analysis: {
          id: analysis.id,
          title: analysis.title_or_filename,
          type: analysis.type,
          originalText: analysis.original_text,
          improvedText: analysis.improved_text,
          aiScore: analysis.ai_score,
          similarityScore: analysis.similarity_score,
          improvedAiScore: analysis.improved_ai_score,
          improvedSimilarityScore: analysis.improved_similarity_score,
          createdAt: analysis.created_at,
          paragraphs: (analysis.results || []).map((r: any) => ({
            index: r.paragraph_index,
            text: r.paragraph_text,
            aiScore: r.paragraph_ai_score,
            indicators: JSON.parse(r.indicators),
            explanation: r.explanation,
          })),
          sources: (analysis.sources || []).map((s: any) => ({
            id: s.id,
            url: s.source_url,
            title: s.source_title,
            matchedText: s.matched_text,
            userSnippet: s.user_snippet,
            similarityPercentage: s.similarity_percentage,
            apaCitation: SimilarityEngine.buildApaCitation(s.source_title, s.source_url),
          })),
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Error al consultar análisis.' });
    }
  }

  /**
   * Eliminar un análisis del historial con verificación de pertenencia
   */
  public static async deleteAnalysis(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const id = req.params.id as string;

      const analysis = await prisma.analysis.findUnique({ where: { id } });

      if (!analysis) {
        res.status(404).json({ success: false, message: 'Análisis no encontrado.' });
        return;
      }

      if (analysis.user_id !== user.id && user.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Acceso no autorizado: No puedes eliminar análisis de otros usuarios.',
        });
        return;
      }

      await prisma.analysis.delete({ where: { id } });

      res.status(200).json({
        success: true,
        message: 'Análisis eliminado correctamente.',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Error al eliminar análisis.' });
    }
  }

  /**
   * Re-analizar la versión mejorada para comparar antes vs después
   */
  public static async reanalyzeImproved(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const id = req.params.id as string;

      const analysis = await prisma.analysis.findUnique({ where: { id } });

      if (!analysis) {
        res.status(404).json({ success: false, message: 'Análisis no encontrado.' });
        return;
      }

      if (analysis.user_id !== user.id && user.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'No autorizado.' });
        return;
      }

      if (!analysis.improved_text) {
        res.status(400).json({
          success: false,
          message: 'Este documento aún no cuenta con una versión mejorada para re-analizar.',
        });
        return;
      }

      const { aiReport, similarityReport } = await AIService.runFullAnalysis(analysis.improved_text);

      const updated = await prisma.analysis.update({
        where: { id },
        data: {
          improved_ai_score: aiReport.overallAiScore,
          improved_similarity_score: similarityReport.overallSimilarityScore,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Versión mejorada re-analizada exitosamente.',
        comparison: {
          original: {
            aiScore: updated.ai_score,
            similarityScore: updated.similarity_score,
          },
          improved: {
            aiScore: updated.improved_ai_score,
            similarityScore: updated.improved_similarity_score,
          },
          notice:
            'Aviso: La reescritura estilística busca optimizar la fluidez y claridad del texto. Ninguna modificación garantiza un resultado absoluto en detectores automáticos.',
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Error al re-analizar versión mejorada.' });
    }
  }
}
