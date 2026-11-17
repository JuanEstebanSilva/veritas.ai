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

export type SupportedFileType = 'docx' | 'doc' | 'pdf' | 'txt' | 'odt' | 'rtf' | 'md' | 'csv' | 'html';

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

    const normalizedText = rawText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n\n');

    const paragraphsCount = normalizedText ? normalizedText.split('\n\n').length : 0;

    return {
      text: normalizedText,
      paragraphsCount,
    };
  }

  /**
   * Extrae el texto y estructura de un archivo PDF en memoria
   */
  public static async extractTextFromPdf(buffer: Buffer): Promise<{
    text: string;
    paragraphsCount: number;
  }> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PDFParse } = require('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      const rawText = (result?.text || '').trim();

      const normalizedText = rawText
        .split(/\r?\n/)
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .join('\n\n');

      const paragraphsCount = normalizedText.split('\n\n').filter(Boolean).length;

      return {
        text: normalizedText,
        paragraphsCount: Math.max(1, paragraphsCount),
      };
    } finally {
      try {
        await parser.destroy();
      } catch {
        // Ignorar cleanup si ya fue cerrado
      }
    }
  }

  /**
   * Extrae el texto de un archivo OpenDocument Text (.odt) en memoria usando JSZip
   */
  public static async extractTextFromOdt(buffer: Buffer): Promise<{
    text: string;
    paragraphsCount: number;
  }> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const JSZip = require('jszip');
    const zip = await JSZip.loadAsync(buffer);
    const contentXmlFile = zip.file('content.xml');
    if (!contentXmlFile) {
      throw new Error('El archivo .odt no contiene content.xml válido.');
    }
    const xml = await contentXmlFile.async('text');

    const paragraphs: string[] = [];
    const pRegex = /<text:(p|h)[^>]*>([\s\S]*?)<\/text:\1>/gi;
    let match: RegExpExecArray | null;
    while ((match = pRegex.exec(xml)) !== null) {
      const content = match[2]
        .replace(/<text:tab\s*\/?>/gi, '\t')
        .replace(/<text:line-break\s*\/?>/gi, '\n')
        .replace(/<text:s\s+text:c="(\d+)"\s*\/?>/gi, (_: string, count: string) => ' '.repeat(parseInt(count, 10)))
        .replace(/<text:s\s*\/?>/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .trim();
      if (content.length > 0) {
        paragraphs.push(content);
      }
    }

    const normalizedText = paragraphs.join('\n\n');
    return {
      text: normalizedText,
      paragraphsCount: paragraphs.length,
    };
  }

  /**
   * Extrae texto de un archivo Rich Text Format (.rtf)
   */
  public static extractTextFromRtf(buffer: Buffer): {
    text: string;
    paragraphsCount: number;
  } {
    const str = buffer.toString('latin1');
    let output = '';
    let i = 0;
    const len = str.length;
    let groupStack = 0;
    let skipGroupAt = -1;

    while (i < len) {
      const ch = str[i];
      if (ch === '{') {
        groupStack++;
        const nextWord = str.slice(i, i + 30);
        if (/^\{(\\\*|\\fonttbl|\\colortbl|\\stylesheet|\\info|\\pict|\\header|\\footer)/i.test(nextWord)) {
          if (skipGroupAt === -1) skipGroupAt = groupStack;
        }
        i++;
      } else if (ch === '}') {
        if (skipGroupAt === groupStack) {
          skipGroupAt = -1;
        }
        groupStack--;
        i++;
      } else if (skipGroupAt !== -1) {
        i++;
      } else if (ch === '\\') {
        i++;
        if (i >= len) break;
        const nextChar = str[i];
        if (nextChar === '\\' || nextChar === '{' || nextChar === '}') {
          output += nextChar;
          i++;
        } else if (nextChar === "'") {
          const hex = str.slice(i + 1, i + 3);
          if (/^[0-9a-fA-F]{2}$/.test(hex)) {
            output += Buffer.from([parseInt(hex, 16)]).toString('latin1');
            i += 3;
          } else {
            i++;
          }
        } else {
          let word = '';
          while (i < len && /[a-zA-Z]/.test(str[i])) {
            word += str[i++];
          }
          let param = '';
          if (i < len && (str[i] === '-' || /[0-9]/.test(str[i]))) {
            param += str[i++];
            while (i < len && /[0-9]/.test(str[i])) {
              param += str[i++];
            }
          }
          if (i < len && str[i] === ' ') {
            i++;
          }
          const w = word.toLowerCase();
          if (w === 'par' || w === 'line') {
            output += '\n\n';
          } else if (w === 'tab') {
            output += '\t';
          } else if (w === 'u') {
            const code = parseInt(param, 10);
            if (!isNaN(code)) {
              output += String.fromCharCode(code < 0 ? code + 65536 : code);
            }
            if (i < len && str[i] === '?') i++;
          }
        }
      } else {
        if (ch !== '\r' && ch !== '\n') {
          output += ch;
        }
        i++;
      }
    }

    const normalizedText = output
      .split(/\n\s*\n/)
      .map((p) => p.replace(/[ \t]+/g, ' ').trim())
      .filter((p) => p.length > 0)
      .join('\n\n');

    return {
      text: normalizedText,
      paragraphsCount: normalizedText ? normalizedText.split('\n\n').length : 0,
    };
  }

  /**
   * Extrae texto de un archivo Word legacy (.doc) 97-2004 o documento compuesto
   */
  public static async extractTextFromDoc(buffer: Buffer): Promise<{
    text: string;
    paragraphsCount: number;
  }> {
    // 1. Si en realidad es un archivo ZIP / DOCX renombrado
    if (buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4b) {
      return this.extractTextFromBuffer(buffer);
    }

    // 2. Si en realidad es un RTF guardado como .doc
    const headStr = buffer.slice(0, 10).toString('latin1');
    if (headStr.startsWith('{\\rtf')) {
      return this.extractTextFromRtf(buffer);
    }

    // 3. Extracción de secuencias de texto UTF-16LE y ASCII desde el binario OLE2
    const textPieces: string[] = [];

    // Intento 1: barrido de caracteres UTF-16LE
    let currentU16 = '';
    for (let i = 0; i < buffer.length - 1; i += 2) {
      const code = buffer.readUInt16LE(i);
      if ((code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9 || (code >= 160 && code <= 383)) {
        currentU16 += String.fromCharCode(code);
      } else {
        if (currentU16.trim().length >= 12) {
          textPieces.push(currentU16.trim());
        }
        currentU16 = '';
      }
    }
    if (currentU16.trim().length >= 12) {
      textPieces.push(currentU16.trim());
    }

    // Intento 2: barrido ASCII / CP1252 si UTF-16LE no arrojó contenido
    if (textPieces.length === 0) {
      let currentAscii = '';
      for (let i = 0; i < buffer.length; i++) {
        const b = buffer[i];
        if ((b >= 32 && b <= 126) || b === 10 || b === 13 || b === 9 || (b >= 160 && b <= 255)) {
          currentAscii += Buffer.from([b]).toString('latin1');
        } else {
          if (currentAscii.trim().length >= 12) {
            textPieces.push(currentAscii.trim());
          }
          currentAscii = '';
        }
      }
      if (currentAscii.trim().length >= 12) {
        textPieces.push(currentAscii.trim());
      }
    }

    // Filtrar metadatos típicos de plantillas de Word
    const filtered = textPieces.filter((p) => {
      if (
        p.includes('Normal.dot') ||
        p.includes('Microsoft Word') ||
        p.includes('Times New Roman') ||
        p.includes('Calibri') ||
        p.includes('Arial')
      ) {
        if (p.length < 40) return false;
      }
      return p.length >= 15;
    });

    const normalizedText = (filtered.length > 0 ? filtered : textPieces).join('\n\n');
    return {
      text: normalizedText,
      paragraphsCount: normalizedText ? normalizedText.split('\n\n').length : 0,
    };
  }

  /**
   * Extrae texto de archivos de texto plano (.txt, .md, .csv, .tsv)
   */
  public static extractTextFromPlainText(buffer: Buffer): {
    text: string;
    paragraphsCount: number;
  } {
    let raw = '';
    if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
      raw = buffer.toString('utf16le');
    } else if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
      raw = buffer.slice(3).toString('utf-8');
    } else {
      raw = buffer.toString('utf-8');
      if (raw.includes('\ufffd')) {
        const latin1 = buffer.toString('latin1');
        if (!latin1.includes('\ufffd')) {
          raw = latin1;
        }
      }
    }

    const normalizedText = raw
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
      .join('\n\n');

    return {
      text: normalizedText,
      paragraphsCount: normalizedText ? normalizedText.split('\n\n').length : 0,
    };
  }

  /**
   * Extrae texto de páginas o documentos HTML (.html, .htm)
   */
  public static extractTextFromHtml(buffer: Buffer): {
    text: string;
    paragraphsCount: number;
  } {
    const rawHtml = buffer.toString('utf-8');
    const withoutScripts = rawHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    const withBreaks = withoutScripts
      .replace(/<\/(p|div|h[1-6]|li|blockquote|tr)>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n');

    const stripped = withBreaks.replace(/<[^>]+>/g, ' ');

    const decoded = stripped
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

    const normalizedText = decoded
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split(/\n\s*\n/)
      .map((p) => p.replace(/[ \t]+/g, ' ').trim())
      .filter((p) => p.length > 0)
      .join('\n\n');

    return {
      text: normalizedText,
      paragraphsCount: normalizedText ? normalizedText.split('\n\n').length : 0,
    };
  }

  /**
   * Extrae texto de cualquier formato de documento soportado
   * (.docx, .doc, .pdf, .txt, .odt, .rtf, .md, .csv, .html)
   */
  public static async extractTextFromDocument(file: {
    buffer: Buffer;
    originalname: string;
    mimetype?: string;
  }): Promise<{
    text: string;
    paragraphsCount: number;
    fileType: SupportedFileType;
  }> {
    const ext = (file.originalname.split('.').pop() || '').toLowerCase();
    const mime = (file.mimetype || '').toLowerCase();

    // 1. PDF
    if (ext === 'pdf' || mime === 'application/pdf') {
      const res = await this.extractTextFromPdf(file.buffer);
      return { ...res, fileType: 'pdf' };
    }

    // 2. OpenDocument Text (.odt)
    if (ext === 'odt' || mime.includes('opendocument.text')) {
      const res = await this.extractTextFromOdt(file.buffer);
      return { ...res, fileType: 'odt' };
    }

    // 3. Rich Text Format (.rtf)
    if (ext === 'rtf' || mime.includes('rtf')) {
      const res = this.extractTextFromRtf(file.buffer);
      return { ...res, fileType: 'rtf' };
    }

    // 4. Word Legacy (.doc)
    if (ext === 'doc' || mime === 'application/msword') {
      const res = await this.extractTextFromDoc(file.buffer);
      return { ...res, fileType: 'doc' };
    }

    // 5. HTML (.html, .htm)
    if (ext === 'html' || ext === 'htm' || mime.includes('html')) {
      const res = this.extractTextFromHtml(file.buffer);
      return { ...res, fileType: 'html' };
    }

    // 6. Texto plano, Markdown, CSV, TSV
    if (
      ext === 'txt' ||
      ext === 'text' ||
      ext === 'md' ||
      ext === 'markdown' ||
      ext === 'csv' ||
      ext === 'tsv' ||
      mime.includes('text/plain') ||
      mime.includes('text/markdown') ||
      mime.includes('text/csv')
    ) {
      const res = this.extractTextFromPlainText(file.buffer);
      const fileType: SupportedFileType = ext === 'md' || ext === 'markdown' ? 'md' : ext === 'csv' || ext === 'tsv' ? 'csv' : 'txt';
      return { ...res, fileType };
    }

    // 7. Word DOCX (por defecto para docx y otros)
    try {
      const res = await this.extractTextFromBuffer(file.buffer);
      return { ...res, fileType: 'docx' };
    } catch {
      // Fallback a texto plano si falla mammoth
      const res = this.extractTextFromPlainText(file.buffer);
      return { ...res, fileType: 'txt' };
    }
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
