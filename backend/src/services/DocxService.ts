import mammoth from 'mammoth';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
} from 'docx';

export class DocxService {
  /**
   * Extrae el texto y estructura de un archivo DOCX en memoria
   */
  public static async extractTextFromBuffer(buffer: Buffer): Promise<{
    text: string;
    paragraphsCount: number;
  }> {
    const result = await mammoth.extractRawText({ buffer });
    const rawText = result.value.trim();

    // Limpiar saltos excesivos y normalizar
    const normalizedText = rawText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n\n');

    const paragraphsCount = normalizedText.split('\n\n').length;

    return {
      text: normalizedText,
      paragraphsCount,
    };
  }

  /**
   * Genera un nuevo documento DOCX formateado profesionalmente con el texto mejorado
   */
  public static async generateImprovedDocx(options: {
    title: string;
    improvedText: string;
    originalAiScore?: number;
    improvedAiScore?: number;
    similarityScore?: number;
  }): Promise<Buffer> {
    const paragraphsRaw = options.improvedText.split(/\n\n+/);

    const docChildren: (Paragraph)[] = [];

    // Título Principal
    docChildren.push(
      new Paragraph({
        text: options.title || 'Documento Mejorado - Plagelio',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200, before: 100 },
      })
    );

    // Subtítulo de Información de Mejora
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [
          new TextRun({
            text: `Generado por Plagelio Writing Assistant  |  ${new Date().toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}`,
            italics: true,
            color: '666666',
            size: 20, // 10pt
          }),
        ],
      })
    );

    // Banner de métricas (si están disponibles)
    if (options.improvedAiScore !== undefined || options.similarityScore !== undefined) {
      docChildren.push(
        new Paragraph({
          spacing: { after: 250, before: 100 },
          children: [
            new TextRun({
              text: `[ Informe de Calidad: IA Estimada: ${options.improvedAiScore ?? 'N/A'}%  |  Índice de Similitud: ${
                options.similarityScore ?? 'N/A'
              }% ]`,
              bold: true,
              color: '1E40AF', // Blue 800
              size: 20,
            }),
          ],
        })
      );
    }

    // Separador visual
    docChildren.push(
      new Paragraph({
        text: '─────────────────────────────────────────────────────────────',
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      })
    );

    // Párrafos del texto mejorado
    for (const pText of paragraphsRaw) {
      if (pText.trim().length === 0) continue;

      // Si parece subtítulo (breve y sin punto final)
      if (pText.length < 70 && !pText.endsWith('.')) {
        docChildren.push(
          new Paragraph({
            text: pText,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 120 },
          })
        );
      } else {
        docChildren.push(
          new Paragraph({
            spacing: { after: 180, line: 360 }, // Interlineado 1.5
            alignment: AlignmentType.JUSTIFIED,
            children: [
              new TextRun({
                text: pText,
                size: 24, // 12pt
                font: 'Calibri',
              }),
            ],
          })
        );
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: 'Plagelio - Documento Optimizado',
                      size: 16,
                      color: '888888',
                    }),
                  ],
                }),
              ],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'Página ',
                      size: 18,
                    }),
                    new TextRun({
                      children: [PageNumber.CURRENT],
                    }),
                    new TextRun({
                      text: ' de ',
                      size: 18,
                    }),
                    new TextRun({
                      children: [PageNumber.TOTAL_PAGES],
                    }),
                  ],
                }),
              ],
            }),
          },
          children: docChildren,
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }
}
