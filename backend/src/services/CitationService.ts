/**
 * Servicio Especializado de Generación Dinámica de Referencias Bibliográficas
 * Normas: APA 7ª Edición e IEEE
 */

export interface CitationMetadata {
  url: string;
  title: string;
  author?: string;
  siteName?: string;
  year?: number | string;
  month?: string | number;
  day?: number;
  accessedDate?: Date;
}

export interface FormattedCitation {
  inText: string;
  reference: string;
  style: 'APA7' | 'IEEE';
}

export class CitationService {
  /**
   * Dominios y medios institucionales conocidos para asignación de autoría corporativa
   */
  private static readonly KNOWN_PORTALS: Record<string, string> = {
    'elpais.com': 'El País',
    'bbc.com': 'BBC News',
    'bbc.co.uk': 'BBC News',
    'infobae.com': 'Infobae',
    'elmundo.es': 'El Mundo',
    'xataka.com': 'Xataka',
    'genbeta.com': 'Genbeta',
    'theverge.com': 'The Verge',
    'techcrunch.com': 'TechCrunch',
    'wired.com': 'Wired',
    'nytimes.com': 'The New York Times',
    'lanacion.com.ar': 'La Nación',
    'clarin.com': 'Clarín',
    'eldiario.es': 'El Diario',
    'scielo.org': 'SciELO',
    'redalyc.org': 'Redalyc',
    'dialnet.unirioja.es': 'Dialnet',
    'nature.com': 'Nature',
    'science.org': 'Science',
    'unesco.org': 'UNESCO',
    'who.int': 'Organización Mundial de la Salud',
    'paho.org': 'Organización Panamericana de la Salud',
    'cepal.org': 'CEPAL',
    'iadb.org': 'Banco Interamericano de Desarrollo',
    'es.wikipedia.org': 'Wikipedia en español',
    'wikipedia.org': 'Wikipedia',
    'medium.com': 'Medium',
    'github.com': 'GitHub',
    'developer.mozilla.org': 'MDN Web Docs',
    'mozilla.org': 'MDN Web Docs',
    'react.dev': 'React Documentation',
  };

  /**
   * Limpia el título retirando sufijos automáticos agregados por sitios o buscadores
   */
  public static cleanTitle(title: string): string {
    return (title || '')
      .replace(/\s*[-|–—]\s*(El País|BBC News|Infobae|El Mundo|Xataka|The Verge|TechCrunch|Wired|The New York Times|Wikipedia|SciELO|Redalyc|GitHub|Medium).*$/i, '')
      .replace(/\s*at DuckDuckGo$/i, '')
      .replace(/\.\.\.$/, '')
      .trim() || 'Sin título';
  }

  /**
   * Infiere el nombre del portal o autor corporativo a partir del hostname de la URL
   */
  public static extractSiteName(url: string): string {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

      if (this.KNOWN_PORTALS[host]) {
        return this.KNOWN_PORTALS[host];
      }

      // Obtener dominio principal capitalizado
      const parts = host.split('.');
      const domainName = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
      return domainName.charAt(0).toUpperCase() + domainName.slice(1);
    } catch {
      return 'Fuente web';
    }
  }

  /**
   * Formatea un autor personal en estándar APA: Apellido, Inicial(es).
   */
  public static formatPersonalAuthorApa(author: string): { referenceAuthor: string; inTextAuthor: string } {
    const trimmed = author.trim();

    // Comprobar si es autor corporativo/institucional
    const corporateKeywords = [
      'organización', 'organizacion', 'ministerio', 'instituto', 'universidad',
      'asociación', 'asociacion', 'comisión', 'comision', 'fundación', 'fundacion',
      'news', 'times', 'post', 'journal', 'editorial', 'center', 'centre', 'banco',
      'unesco', 'oms', 'ops', 'cepal', 'bid', 'bbc', 'infobae', 'el país', 'elpais',
      'xataka', 'clarín', 'la nación', 'wikipedia', 'github'
    ];
    const lower = trimmed.toLowerCase();
    if (corporateKeywords.some((kw) => lower.includes(kw)) || trimmed.length <= 4) {
      return { referenceAuthor: trimmed, inTextAuthor: trimmed };
    }

    // Manejo de múltiples autores separados por & o 'y'
    if (trimmed.includes('&') || /\s+(?:y|and)\s+/i.test(trimmed)) {
      const parts = trimmed.split(/\s+(?:&|y|and)\s+/i);
      if (parts.length === 2) {
        const a1 = this.formatSingleAuthorName(parts[0]);
        const a2 = this.formatSingleAuthorName(parts[1]);
        return {
          referenceAuthor: `${a1.reference}, & ${a2.reference}`,
          inTextAuthor: `${a1.lastName} & ${a2.lastName}`,
        };
      } else if (parts.length > 2) {
        const a1 = this.formatSingleAuthorName(parts[0]);
        return {
          referenceAuthor: `${a1.reference} et al.`,
          inTextAuthor: `${a1.lastName} et al.`,
        };
      }
    }

    const single = this.formatSingleAuthorName(trimmed);
    return {
      referenceAuthor: single.reference,
      inTextAuthor: single.lastName,
    };
  }

  private static formatSingleAuthorName(name: string): { lastName: string; reference: string } {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      return { lastName: 'Fuente web', reference: 'Fuente web' };
    }
    if (words.length === 1) {
      return { lastName: words[0], reference: words[0] };
    }

    // Formato latino típico: "Nombre1 [Nombre2] Apellido1 [Apellido2]"
    if (words.length === 4) {
      const lastName = `${words[2]} ${words[3]}`;
      const initials = `${words[0].charAt(0)}. ${words[1].charAt(0)}.`;
      return { lastName: words[2], reference: `${lastName}, ${initials}` };
    } else if (words.length === 3) {
      const lastName = `${words[1]} ${words[2]}`;
      const initial = `${words[0].charAt(0)}.`;
      return { lastName: words[1], reference: `${lastName}, ${initial}` };
    } else {
      // 2 palabras: "Nombre Apellido"
      const lastName = words[1];
      const initial = `${words[0].charAt(0)}.`;
      return { lastName, reference: `${lastName}, ${initial}` };
    }
  }

  /**
   * Genera cita bibliográfica en formato APA 7ª Edición
   */
  public static generateApa7(meta: CitationMetadata): FormattedCitation {
    const siteName = meta.siteName || this.extractSiteName(meta.url);
    const cleanedTitle = this.cleanTitle(meta.title);

    // 1. Determinar fecha según APA 7 (año o s.f.)
    let dateStr = 's.f.';
    let yearForInText = 's.f.';

    if (meta.year) {
      const yearNum = typeof meta.year === 'number' ? meta.year : parseInt(String(meta.year), 10);
      if (!isNaN(yearNum) && yearNum >= 1900 && yearNum <= 2100) {
        yearForInText = String(yearNum);
        dateStr = String(yearNum);
      }
    }

    // 2. Determinar autoría
    let inText = '';
    let reference = '';

    if (meta.author && meta.author.trim().length > 0) {
      const { referenceAuthor, inTextAuthor } = this.formatPersonalAuthorApa(meta.author);
      inText = `(${inTextAuthor}, ${yearForInText})`;

      // En APA 7: Si el autor es diferente al nombre del sitio, se incluye el sitio
      const isAuthorSameAsSite = referenceAuthor.toLowerCase() === siteName.toLowerCase();
      const siteSuffix = isAuthorSameAsSite ? '' : ` ${siteName}.`;

      const authorPrefix = referenceAuthor.endsWith('.') ? referenceAuthor : `${referenceAuthor}.`;
      reference = `${authorPrefix} (${dateStr}). ${cleanedTitle}.${siteSuffix} ${meta.url}`;
    } else {
      // Sin autor específico identificado:
      // Se utiliza el nombre corporativo del sitio web como autor
      inText = `(${siteName}, ${yearForInText})`;
      const sitePrefix = siteName.endsWith('.') ? siteName : `${siteName}.`;
      reference = `${sitePrefix} (${dateStr}). ${cleanedTitle}. ${meta.url}`;
    }

    return {
      inText,
      reference,
      style: 'APA7',
    };
  }

  /**
   * Genera cita bibliográfica en formato IEEE
   */
  public static generateIeee(meta: CitationMetadata, citationIndex: number = 1): FormattedCitation {
    const siteName = meta.siteName || this.extractSiteName(meta.url);
    const cleanedTitle = this.cleanTitle(meta.title);
    const yearStr = meta.year ? String(meta.year) : 'n.d.';
    const authorStr = meta.author ? meta.author.trim() : siteName;

    const accessDate = meta.accessedDate || new Date();
    const months = [
      'ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.',
      'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'
    ];
    const accessStr = `${accessDate.getDate()} de ${months[accessDate.getMonth()]}, ${accessDate.getFullYear()}`;

    const inText = `[${citationIndex}]`;
    const reference = `[${citationIndex}] ${authorStr}, "${cleanedTitle}," ${siteName}, ${yearStr}. [En línea]. Disponible: ${meta.url}. [Accedido: ${accessStr}].`;

    return {
      inText,
      reference,
      style: 'IEEE',
    };
  }
}
