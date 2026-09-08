import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { prisma } from '../config/prisma';
import { AIService } from '../services/AIService';
import { DocxService } from '../services/DocxService';

export class WritingController {
  /**
   * Genera la mejora y optimización de redacción legítima
   */
  public static async improveText(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { text, analysisId } = req.body;

      let textToImprove = text;
      let analysisRecord = null;

      if (analysisId) {
        analysisRecord = await prisma.analysis.findUnique({ where: { id: analysisId } });
        if (!analysisRecord || (analysisRecord.user_id !== user.id && user.role !== 'ADMIN')) {
          res.status(403).json({ success: false, message: 'Análisis no encontrado o no autorizado.' });
          return;
        }
        textToImprove = analysisRecord.original_text;
      }

      if (!textToImprove || typeof textToImprove !== 'string' || textToImprove.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Debes proporcionar un texto válido para realizar la mejora de redacción.',
        });
        return;
      }

      const { improvedText, summaryOfChanges } = await AIService.improveWriting(textToImprove);

      // Calcular inmediatamente la reducción de probabilidad de IA
      const [originalReport, improvedReport] = await Promise.all([
        analysisRecord ? Promise.resolve({ overallAiScore: analysisRecord.ai_score }) : AIService.analyzeAI(textToImprove),
        AIService.analyzeAI(improvedText),
      ]);

      const originalAiScore = originalReport.overallAiScore;
      const improvedAiScore = improvedReport.overallAiScore;

      // Si existe un analysisId asociado, actualizar en base de datos
      if (analysisId && analysisRecord) {
        await prisma.analysis.update({
          where: { id: analysisId },
          data: {
            improved_text: improvedText,
            improved_ai_score: improvedAiScore,
          },
        });
      }

      res.status(200).json({
        success: true,
        message: 'Redacción humanizada y optimizada exitosamente.',
        originalText: textToImprove,
        improvedText,
        summaryOfChanges,
        originalAiScore,
        improvedAiScore,
        aiReduction: Math.max(0, originalAiScore - improvedAiScore),
        notice:
          'Objetivo: Optimizar cadencia, léxico y naturalidad sintáctica preservando citas y significado original.',
      });
    } catch (error: any) {
      console.error('Error en improveText:', error);
      res.status(500).json({ success: false, message: 'Error al procesar la mejora de redacción.' });
    }
  }

  /**
   * Descargar el texto mejorado como documento DOCX formateado
   */
  public static async downloadDocx(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { improvedText, title, analysisId } = req.body;

      let content = improvedText;
      let docTitle = title || 'Documento Mejorado';
      let originalAiScore = undefined;
      let improvedAiScore = undefined;
      let similarityScore = undefined;

      if (analysisId) {
        const analysis = await prisma.analysis.findUnique({ where: { id: analysisId } });
        if (analysis) {
          content = analysis.improved_text || content || analysis.original_text;
          docTitle = analysis.title_or_filename;
          originalAiScore = analysis.ai_score;
          improvedAiScore = analysis.improved_ai_score ?? undefined;
          similarityScore = analysis.similarity_score;
        }
      }

      if (!content || content.trim().length === 0) {
        res.status(400).json({ success: false, message: 'No hay texto mejorado disponible para exportar.' });
        return;
      }

      const buffer = await DocxService.generateImprovedDocx({
        title: docTitle,
        improvedText: content,
        originalAiScore,
        improvedAiScore,
        similarityScore,
      });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      res.setHeader('Content-Disposition', 'attachment; filename="documento_mejorado.docx"');
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (error: any) {
      console.error('Error al generar DOCX:', error);
      res.status(500).json({ success: false, message: 'Error al generar el archivo DOCX.' });
    }
  }

  /**
   * Descargar el texto mejorado como archivo TXT plano
   */
  public static async downloadTxt(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { improvedText, title } = req.body;

      if (!improvedText || improvedText.trim().length === 0) {
        res.status(400).json({ success: false, message: 'No hay texto disponible para exportar.' });
        return;
      }

      const fileName = `${(title || 'documento_mejorado').replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(improvedText);
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Error al descargar archivo TXT.' });
    }
  }
}
