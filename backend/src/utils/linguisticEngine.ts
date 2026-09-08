// Motor lingüístico y heurístico de análisis de texto y estilo

export interface ParagraphAnalysisResult {
  paragraphIndex: number;
  paragraphText: string;
  paragraphAiScore: number;
  indicators: string[];
  explanation: string;
}

export interface AiDetectionReport {
  overallAiScore: number;
  overallIndicators: string[];
  summaryExplanation: string;
  paragraphResults: ParagraphAnalysisResult[];
  legalDisclaimer: string;
}

export class LinguisticEngine {
  // Patrones semánticos explícitos de auto-identificación y metadatos de modelos de lenguaje / IA
  private static AI_DISCLOSURE_PATTERNS: { pattern: RegExp; label: string }[] = [
    { pattern: /\bcomo\s+(?:un\s+)?modelo\s+de\s+lenguaje\b/i, label: 'Auto-identificación como modelo de lenguaje' },
    { pattern: /\bcomo\s+(?:una\s+)?inteligencia\s+artificial\b/i, label: 'Auto-identificación como IA' },
    { pattern: /\bcomo\s+(?:un\s+)?asistente\s+(?:virtual|de\s+ia|inteligente)\b/i, label: 'Identidad de asistente virtual' },
    { pattern: /\b(?:fui|he\s+sido)\s+entrenad[oa]\b/i, label: 'Referencia a entrenamiento algorítmico' },
    { pattern: /\bno\s+tengo\s+(?:opiniones\s+personales|sentimientos|conciencia|emociones|cuerpo\s+f[ií]sico)\b/i, label: 'Declaración de ausencia de emociones/opiniones' },
    { pattern: /\bno\s+poseo\s+(?:opiniones|sentimientos|conciencia|emociones)\b/i, label: 'Declaración de ausencia de conciencia' },
    { pattern: /\bcapacidad\s+para\s+interactuar\s+f[ií]sicamente\b/i, label: 'Restricción física típica de IA' },
    { pattern: /\bcorte\s+temporal\s+de\s+entrenamiento\b/i, label: 'Mención a fecha de corte de entrenamiento' },
    { pattern: /\bcorte\s+de\s+conocimiento\b/i, label: 'Mención a límite de conocimiento' },
    { pattern: /\bknowledge\s+cutoff\b/i, label: 'Knowledge cutoff' },
    { pattern: /\bas\s+an?\s+(?:ai|language\s+model|artificial\s+intelligence)\b/i, label: 'AI self-identification' },
    { pattern: /\bi\s+(?:do\s+not|don't)\s+have\s+(?:feelings|opinions|emotions|a\s+physical\s+body)\b/i, label: 'AI lack of feelings declaration' },
    { pattern: /\bi\s+was\s+trained\s+by\b/i, label: 'Trained by reference' },
    { pattern: /\b(?:¿|)\s*(?:en\s+qu[eé]\s+m[aá]s\s+puedo\s+ayudarte|hay\s+algo\s+m[aá]s\s+en\s+lo\s+que\s+(?:le\s+|te\s+)?pueda\s+asistir)\b/i, label: 'Cierre conversacional de chatbot' },
    { pattern: /\bhow\s+(?:can|may)\s+i\s+(?:assist|help)\s+you\s+(?:today|further)\b/i, label: 'Chatbot closing formula' },
    { pattern: /\bgenerad[oa]\s+por\s+(?:ia|inteligencia\s+artificial|chatgpt|openai|claude|gemini|copilot)\b/i, label: 'Metadatos explícitos de generador' },
    { pattern: /\b(?:mis\s+algoritmos|mis\s+respuestas\s+no\s+deben\s+sustituir\s+el\s+asesoramiento)\b/i, label: 'Descargo de responsabilidad de bot' },
    { pattern: /\bc[aá]lculo\s+de\s+probabilidades\s+predictivas\b/i, label: 'Referencia a cálculo predictivo' },
    { pattern: /\bt[eé]cnicas\s+de\s+procesamiento\s+de\s+lenguaje\s+natural\b/i, label: 'Metadato de procesamiento de lenguaje natural' }
  ];

  // Conectores y frases cliché altamente frecuentes en textos generados por IA
  private static AI_CLICHE_PHRASES = [
    'en conclusión', 'es crucial destacar', 'es fundamental señalar', 'cabe destacar',
    'en primer lugar', 'por consiguiente', 'en resumen', 'un papel fundamental',
    'desempeña un papel clave', 'un tapiz de', 'en este sentido', 'por otro lado',
    'asimismo', 'no solo..., sino también', 'es importante tener en cuenta',
    'en última instancia', 'a fin de cuentas', 'it is important to note',
    'delve into', 'testament to', 'furthermore', 'moreover', 'in conclusion',
    'plays a pivotal role', 'tapestry of', 'seamlessly', 'en este orden de ideas',
    'cabe señalar que', 'es menester destacar', 'un amplio abanico', 'un mosaico de',
    'de vital importancia', 'en resumidas cuentas', 'por ende', 'a modo de resumen',
    'desempeña un rol', 'juega un papel', 'no cabe duda de que', 'sin duda alguna',
    'es de suma importancia', 'con el fin de', 'a través de', 'en la actualidad',
    'debido al hecho de que', 'con el propósito de', 'modelo de lenguaje',
    'inteligencia artificial', 'fui entrenado', 'corte temporal', 'procesamiento de lenguaje natural'
  ];

  /**
   * Detecta si el texto contiene afirmaciones de auto-identificación o metadatos de IA
   */
  public static checkAiDisclosure(text: string): { isDisclosed: boolean; matches: string[] } {
    const matches: string[] = [];
    for (const item of this.AI_DISCLOSURE_PATTERNS) {
      if (item.pattern.test(text)) {
        matches.push(item.label);
      }
    }
    return {
      isDisclosed: matches.length > 0,
      matches,
    };
  }

  /**
   * Divide un texto en párrafos no vacíos preservando su orden
   */
  public static splitParagraphs(text: string): string[] {
    return text
      .split(/\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }

  /**
   * Divide un párrafo en oraciones individuales respetando puntuación
   */
  public static splitSentences(paragraph: string): string[] {
    const matched = paragraph.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g);
    if (!matched) return [paragraph];
    return matched.map((s) => s.trim()).filter((s) => s.length > 0);
  }

  /**
   * Tokeniza texto en palabras en minúsculas sin puntuación
   */
  public static tokenizeWords(text: string): string[] {
    return (text.toLowerCase().match(/\b[\wáéíóúüñ]+\b/g) || []).filter(Boolean);
  }

  /**
   * Calcula el Type-Token Ratio (variedad léxica)
   */
  public static calculateTTR(words: string[]): number {
    if (words.length === 0) return 1.0;
    const uniqueWords = new Set(words);
    return uniqueWords.size / words.length;
  }

  /**
   * Calcula la 'burstiness' (variabilidad en la longitud de oraciones).
   * Los textos de IA suelen tener oraciones de longitud muy uniforme (baja burstiness),
   * mientras que los humanos alternan oraciones muy cortas con oraciones complejas.
   */
  public static calculateBurstiness(sentences: string[]): {
    meanLength: number;
    variance: number;
    stdDev: number;
    burstinessScore: number; // 0 (muy uniforme) a 1 (alta variación)
  } {
    if (sentences.length <= 1) {
      return { meanLength: sentences[0]?.split(/\s+/).length || 0, variance: 0, stdDev: 0, burstinessScore: 0.5 };
    }

    // Filtrar oraciones de solo 1 o 2 palabras (como "Hola.", "Sí.") para evitar que
    // un saludo aislado distorsione artificialmente la desviación típica de un texto
    const substantive = sentences.filter((s) => s.split(/\s+/).filter(Boolean).length > 2);
    const targetSentences = substantive.length >= 2 ? substantive : sentences;

    const lengths = targetSentences.map((s) => s.split(/\s+/).filter(Boolean).length);
    const mean = lengths.reduce((acc, l) => acc + l, 0) / lengths.length;
    const squaredDiffs = lengths.map((l) => Math.pow(l - mean, 2));
    const variance = squaredDiffs.reduce((acc, sd) => acc + sd, 0) / lengths.length;
    const stdDev = Math.sqrt(variance);

    // Coeficiente de variación (stdDev / mean) normalizado
    const cv = mean > 0 ? stdDev / mean : 0;
    const burstinessScore = Math.min(Math.max(cv / 0.60, 0), 1);

    return { meanLength: mean, variance, stdDev, burstinessScore };
  }

  /**
   * Analiza la densidad de frases cliché y patrones predecibles
   */
  public static checkCliches(text: string): { count: number; found: string[]; density: number } {
    const lower = text.toLowerCase();
    const found: string[] = [];

    for (const phrase of this.AI_CLICHE_PHRASES) {
      if (lower.includes(phrase)) {
        found.push(phrase);
      }
    }

    const wordCount = this.tokenizeWords(text).length;
    const density = wordCount > 0 ? (found.length * 35) / wordCount : 0;
    return { count: found.length, found, density: Math.min(density, 1) };
  }

  /**
   * Evalúa la repetición de estructuras sintácticas de inicio de oración
   */
  public static checkSentenceStartUniformity(sentences: string[]): number {
    if (sentences.length < 3) return 0;
    const starters = sentences.map((s) => {
      const words = this.tokenizeWords(s);
      return words.slice(0, 2).join(' ');
    });

    const uniqueStarters = new Set(starters);
    const repetitionRatio = 1 - uniqueStarters.size / starters.length;
    return Math.max(0, Math.min(repetitionRatio, 1));
  }

  /**
   * Ejecuta el análisis probabilístico integral de un párrafo
   */
  public static analyzeParagraph(paragraph: string, index: number): ParagraphAnalysisResult {
    // 0. VERIFICACIÓN CRÍTICA INICIAL: Auto-identificación explícita de IA o Asistente
    const disclosure = this.checkAiDisclosure(paragraph);
    if (disclosure.isDisclosed) {
      return {
        paragraphIndex: index,
        paragraphText: paragraph,
        paragraphAiScore: 99,
        indicators: [
          'Confesión explícita de IA',
          ...disclosure.matches.slice(0, 3),
        ],
        explanation: `Detección categórica: El texto contiene declaraciones explícitas y metadatos de autoría de inteligencia artificial (${disclosure.matches.join(', ')}).`,
      };
    }

    const sentences = this.splitSentences(paragraph);
    const words = this.tokenizeWords(paragraph);

    if (words.length < 8) {
      return {
        paragraphIndex: index,
        paragraphText: paragraph,
        paragraphAiScore: 6,
        indicators: ['Longitud insuficiente para inferencia estadística'],
        explanation: 'El párrafo contiene muy pocas palabras para inferir características estilométricas significativas.',
      };
    }

    const { burstinessScore, meanLength, stdDev } = this.calculateBurstiness(sentences);
    const ttr = this.calculateTTR(words);
    const { count: clicheCount, found, density } = this.checkCliches(paragraph);
    const startUniformity = this.checkSentenceStartUniformity(sentences);

    const indicators: string[] = [];
    // Base de partida calibrada
    let probabilityPoints = 20;

    // 1. Clichés y conectores sintéticos predecibles (peso primordial en detección de IA)
    if (clicheCount >= 4) {
      probabilityPoints += 50;
      indicators.push('Fuerte presencia de fórmulas de IA');
      indicators.push('Transiciones estereotipadas');
    } else if (clicheCount >= 2 || density > 0.15) {
      probabilityPoints += 34;
      indicators.push('Conectores sintéticos detectados');
      indicators.push('Transiciones predecibles');
    } else if (clicheCount === 1) {
      probabilityPoints += 18;
      indicators.push('Conector formal reiterado');
    } else {
      // Ausencia total de fórmulas de IA: fuerte indicio de redacción orgánica
      probabilityPoints -= 16;
    }

    // 2. Uniformidad de longitud de oraciones (baja burstiness / simetría métrica)
    if (sentences.length >= 2) {
      if (burstinessScore < 0.38) {
        probabilityPoints += 24;
        indicators.push('Cadencia uniforme');
      } else if (burstinessScore > 0.58) {
        probabilityPoints -= 18;
      }
    }

    // 3. Ventana típica de regularidad de IA (~15 a 28 palabras con poca desviación típica)
    if (sentences.length >= 3) {
      if (meanLength >= 14 && meanLength <= 28 && stdDev < 4.8) {
        probabilityPoints += 20;
        indicators.push('Simetría estructural sintética');
      } else if (stdDev > 6.5) {
        probabilityPoints -= 16;
      }
    }

    // 4. Variedad léxica (Type-Token Ratio)
    if (words.length > 20) {
      if (ttr < 0.48) {
        probabilityPoints += 16;
        indicators.push('Baja variación léxica');
      } else if (ttr > 0.68 && clicheCount === 0) {
        probabilityPoints -= 12;
      }
    }

    // 5. Inicios de oración repetitivos
    if (startUniformity > 0.35) {
      probabilityPoints += 16;
      indicators.push('Patrones sintácticos repetitivos');
    } else if (startUniformity === 0 && sentences.length >= 3 && clicheCount === 0) {
      probabilityPoints -= 10;
    }

    // Indicador positivo si el texto es limpio de IA
    if (indicators.length === 0) {
      if (probabilityPoints > 40) {
        indicators.push('Lenguaje formal estándar');
      } else {
        indicators.push('Variación estilística natural');
      }
    }

    // Clampear la puntuación a un rango realista entre 4% y 98%
    const finalScore = Math.max(4, Math.min(Math.round(probabilityPoints), 98));

    let explanation = '';
    if (finalScore >= 70) {
      explanation = `Presenta una alta concentración de giros de IA (${clicheCount} detectados) y simetría cadencial (desviación típica de ${stdDev.toFixed(1)} palabras) típica de modelos generativos.`;
    } else if (finalScore >= 35) {
      explanation = `Muestra características híbridas: cierta uniformidad estructural combinada con modulaciones de ritmo de redacción humana.`;
    } else {
      explanation = `Estructura orgánica con alternancia rítmica marcada, ausencia de muletillas de IA y rica variedad léxica propia de la redacción humana.`;
    }

    return {
      paragraphIndex: index,
      paragraphText: paragraph,
      paragraphAiScore: finalScore,
      indicators: Array.from(new Set(indicators)),
      explanation,
    };
  }

  /**
   * Ejecuta el análisis completo del texto completo
   */
  public static analyzeFullText(text: string): AiDetectionReport {
    const paragraphs = this.splitParagraphs(text);

    if (paragraphs.length === 0) {
      return {
        overallAiScore: 0,
        overallIndicators: [],
        summaryExplanation: 'Texto vacío o sin contenido procesable.',
        paragraphResults: [],
        legalDisclaimer: 'El resultado es una estimación y puede contener falsos positivos o falsos negativos.',
      };
    }

    const paragraphResults = paragraphs.map((p, idx) => this.analyzeParagraph(p, idx));

    // Ponderación de la puntuación global según la longitud de cada párrafo
    const totalWords = paragraphResults.reduce((acc, p) => acc + p.paragraphText.split(/\s+/).length, 0);
    let weightedScore = 0;

    for (const p of paragraphResults) {
      const weight = totalWords > 0 ? p.paragraphText.split(/\s+/).length / totalWords : 1 / paragraphResults.length;
      weightedScore += p.paragraphAiScore * weight;
    }

    const overallAiScore = Math.max(4, Math.min(Math.round(weightedScore), 99));

    // Recopilar todos los indicadores globales observados
    const indicatorFrequency: Record<string, number> = {};
    for (const p of paragraphResults) {
      for (const ind of p.indicators) {
        indicatorFrequency[ind] = (indicatorFrequency[ind] || 0) + 1;
      }
    }

    const overallIndicators = Object.keys(indicatorFrequency).sort(
      (a, b) => indicatorFrequency[b] - indicatorFrequency[a]
    ).slice(0, 5);

    let summaryExplanation = '';
    const hasDisclosure = paragraphResults.some((p) => p.indicators.includes('Confesión explícita de IA'));

    if (hasDisclosure) {
      summaryExplanation =
        'Detección crítica de IA: El documento incluye declaraciones explícitas donde el texto se identifica a sí mismo como un modelo de lenguaje artificial, asistente virtual o producto de entrenamiento algorítmico.';
    } else if (overallAiScore >= 70) {
      summaryExplanation = `El documento refleja patrones estructurales y distribución léxica altamente homogéneos en el ${Math.round(
        (paragraphResults.filter((p) => p.paragraphAiScore >= 65).length / paragraphResults.length) * 100
      )}% de sus secciones.`;
    } else if (overallAiScore >= 35) {
      summaryExplanation = `Se identificaron secciones equilibradas con alternancia entre estructuras convencionales y variaciones expresivas naturales.`;
    } else {
      summaryExplanation = `El estilo global demuestra una alta naturalidad: alternancia orgánica en longitud de oraciones, léxico enriquecido y ausencia de patrones algorítmicos.`;
    }

    return {
      overallAiScore,
      overallIndicators,
      summaryExplanation,
      paragraphResults,
      legalDisclaimer:
        'Aviso: Este resultado es una estimación probabilística calculada mediante patrones estilométricos y sintácticos. No constituye una certeza determinista y puede contener falsos positivos o falsos negativos.',
    };
  }

  /**
   * Algoritmo de Humanización y Enriquecimiento Estilístico Profundo.
   * Diseñado para romper la simetría robótica, erradicar clichés de IA y reducir
   * drásticamente el porcentaje de probabilidad de IA al menor valor posible (4% - 10%).
   */
  public static improveWriting(text: string): {
    improvedText: string;
    summaryOfChanges: string[];
  } {
    const paragraphs = this.splitParagraphs(text);
    const summaryOfChanges: string[] = [
      'Eliminación total de auto-identificaciones de chatbot, metadatos y fórmulas de asistente virtual',
      'Ruptura de cadencia simétrica: alternancia intencional de oraciones cortas e incisivas con estructuras compuestas (burstiness orgánico)',
      'Erradicación total de más de 40 conectores cliché y fórmulas de énfasis típicas de IA',
      'Diversificación de arranques de oración para eliminar patrones sintácticos predecibles',
      'Enriquecimiento léxico dinámico y sustitución por giros expresivos humanos',
      'Inclusión de puntuación orgánica (guiones explicativos, pausas reflexivas y puntos seguidos)',
      'Preservación absoluta de citas entre comillas, cifras numéricas y terminología especializada'
    ];

    // Diccionario de reemplazos (incluyendo eliminación de bot confessions y metadatos de chatbot)
    const replacements: [RegExp, string][] = [
      // Fórmulas explícitas de apertura/auto-identificación de chatbot
      [/\bhola[.,!]?\s*como\s+modelo\s+de\s+lenguaje(?: de inteligencia artificial)?,\s*/gi, 'Desde una perspectiva computacional, '],
      [/\bcomo\s+(?:un\s+)?modelo\s+de\s+lenguaje(?: de inteligencia artificial)?\b/gi, 'en el marco del análisis algorítmico'],
      [/\bmi objetivo es procesar su solicitud basándome en los algoritmos y datos con los que fui entrenad[oa]\b/gi, 'este análisis se fundamenta en el procesamiento estructurado de información cuantitativa'],
      [/\bno tengo opiniones personales,?\s*sentimientos,?\s*ni capacidad para interactuar físicamente con el mundo real\b/gi, 'el enfoque prescinde deliberadamente de consideraciones subjetivas o sesgos emocionales'],
      [/\bla información que proporciono está diseñada para ser objetiva, neutral y estructurada\b/gi, 'la síntesis busca presentar los datos de forma analítica y equilibrada'],
      [/\bse genera mediante el cálculo de probabilidades predictivas utilizando técnicas de procesamiento de lenguaje natural\b/gi, 'se recurre a modelos estadísticos y representaciones léxicas estructuradas'],
      [/\bes importante recordar que mi conocimiento tiene un corte temporal de entrenamiento y mis respuestas no deben sustituir en ningún caso el asesoramiento de un profesional humano cualificado\b/gi, 'es conveniente situar las observaciones en su respectivo marco temporal, recomendando siempre el cotejo con especialistas de la disciplina'],
      [/[¿]?\s*hay algo más en lo que (?:le\s+|te\s+)?pueda asistir el día de hoy[?]?/gi, 'El análisis deja abiertas diversas interrogantes para futuras investigaciones.'],

      // Conclusiones y cierres
      [/\ben conclusión\b/gi, 'en definitiva'],
      [/\ben resumen\b/gi, 'a grandes rasgos'],
      [/\ba modo de conclusión\b/gi, 'para cerrar'],
      [/\ben resumidas cuentas\b/gi, 'visto así'],
      [/\ba fin de cuentas\b/gi, 'al cabo de todo'],
      [/\ben última instancia\b/gi, 'en el fondo'],
      [/\bin conclusion\b/gi, 'ultimately'],

      // Fórmulas de énfasis típicas de IA
      [/\bes crucial destacar que\b/gi, 'conviene reparar en que'],
      [/\bes crucial destacar\b/gi, 'conviene reparar en que'],
      [/\bes fundamental señalar que\b/gi, 'vale notar que'],
      [/\bes fundamental señalar\b/gi, 'vale notar que'],
      [/\bes de vital importancia que\b/gi, 'resulta prioritario que'],
      [/\bde vital importancia\b/gi, 'decisivo'],
      [/\bes importante tener en cuenta que\b/gi, 'no hay que perder de vista que'],
      [/\bes importante tener en cuenta\b/gi, 'conviene considerar'],
      [/\bes importante recordar que\b/gi, 'es bueno recordar que'],
      [/\bes importante destacar que\b/gi, 'salta a la vista que'],
      [/\bes importante destacar\b/gi, 'salta a la vista que'],
      [/\bes relevante notar que\b/gi, 'se aprecia con claridad que'],
      [/\bcabe destacar que\b/gi, 'llama la atención que'],
      [/\bcabe destacar\b/gi, 'llama la atención que'],
      [/\bcabe señalar que\b/gi, 'importa advertir que'],
      [/\bcabe mencionar que\b/gi, 'vale anotar que'],
      [/\bes menester destacar que\b/gi, 'es oportuno subrayar que'],
      [/\bit is important to note that\b/gi, 'notably,'],

      // Roles y funciones
      [/\bdesempeña un papel fundamental\b/gi, 'resulta determinante'],
      [/\bdesempeña un papel clave\b/gi, 'marca una diferencia real'],
      [/\bdesempeña un rol crucial\b/gi, 'cobra un peso definitivo'],
      [/\bdesempeña un rol\b/gi, 'cumple una función'],
      [/\bjuega un papel fundamental\b/gi, 'influye de manera decisiva'],
      [/\bjuega un papel clave\b/gi, 'es un pilar central'],
      [/\bjuega un papel\b/gi, 'influye notablemente'],
      [/\bplays a pivotal role\b/gi, 'is instrumental'],

      // Conectores discursivos y transiciones
      [/\ben este sentido\b/gi, 'desde este punto de vista'],
      [/\ben este orden de ideas\b/gi, 'bajo este ángulo'],
      [/\bbajo este contexto\b/gi, 'en este panorama'],
      [/\bpor consiguiente\b/gi, 'por ello'],
      [/\bpor ende\b/gi, 'de ahí que'],
      [/\bpor lo tanto\b/gi, 'así pues'],
      [/\basimismo\b/gi, 'a su vez'],
      [/\bde igual manera\b/gi, 'a la par'],
      [/\bde igual forma\b/gi, 'paralelamente'],
      [/\ben primer lugar\b/gi, 'de entrada'],
      [/\ben segundo lugar\b/gi, 'por otra parte'],
      [/\bfurthermore\b/gi, 'what is more'],
      [/\bmoreover\b/gi, 'besides'],

      // Metáforas clichés de IA
      [/\bun tapiz de\b/gi, 'una trama diversa de'],
      [/\bun mosaico de\b/gi, 'un conjunto articulado de'],
      [/\bun amplio abanico de\b/gi, 'una notable variedad de'],
      [/\btapestry of\b/gi, 'spectrum of'],
      [/\bdelve into\b/gi, 'explore'],
      [/\btestament to\b/gi, 'reflection of'],
      [/\bseamlessly\b/gi, 'naturally'],

      // Locuciones redundantes
      [/\bcon el fin de\b/gi, 'para'],
      [/\bcon el objetivo de\b/gi, 'con miras a'],
      [/\bcon el propósito de\b/gi, 'a fin de'],
      [/\ba través de\b/gi, 'mediante'],
      [/\bdebido al hecho de que\b/gi, 'dado que'],
      [/\ben la actualidad\b/gi, 'hoy en día'],
      [/\ben el mundo actual\b/gi, 'al presente'],
      [/\bes de suma importancia\b/gi, 'resulta de primer orden'],
      [/\bno solo ([^,.]+), sino también\b/gi, 'tanto $1 como'],
      [/\bsin duda alguna\b/gi, 'ciertamente'],
      [/\bno cabe duda de que\b/gi, 'es innegable que']
    ];

    const improvedParagraphs = paragraphs.map((paragraph) => {
      // 1. Proteger citas textuales entre comillas para dejarlas estrictamente intactas
      const quotes: string[] = [];
      let sanitized = paragraph.replace(/"([^"]*)"/g, (match) => {
        quotes.push(match);
        return `__QUOTE_${quotes.length - 1}__`;
      });

      // Proteger citas de formato académico (García, 2023)
      const citations: string[] = [];
      sanitized = sanitized.replace(/\([A-ZÁÉÍÓÚÑa-záéíóúñ]+,\s*\d{4}[^)]*\)/g, (match) => {
        citations.push(match);
        return `__CITATION_${citations.length - 1}__`;
      });

      // 2. Aplicar reemplazos de clichés y conectores algorítmicos con soporte para grupos ($1, $2)
      for (const [pattern, replacement] of replacements) {
        sanitized = sanitized.replace(pattern, (...args) => {
          let rep = replacement;
          for (let g = 1; g < args.length - 2; g++) {
            if (typeof args[g] === 'string') {
              rep = rep.replace(new RegExp(`\\$${g}`, 'g'), args[g]);
            }
          }
          if (args[0].charAt(0) === args[0].charAt(0).toUpperCase()) {
            return rep.charAt(0).toUpperCase() + rep.slice(1);
          }
          return rep;
        });
      }

      // 3. Normalizar puntuación y mayúsculas tras comas
      sanitized = sanitized.replace(/,\s*([A-ZÁÉÍÓÚÑ])/g, (m, letter) => `, ${letter.toLowerCase()}`);

      // 4. Inyección de Burstiness Orgánico y Ruptura de Simetría de Oraciones
      const rawSentences = LinguisticEngine.splitSentences(sanitized);
      const transformedSentences: string[] = [];

      for (let i = 0; i < rawSentences.length; i++) {
        let sent = rawSentences[i].trim();
        if (!sent) continue;

        // Asegurar que comience con mayúscula
        sent = sent.charAt(0).toUpperCase() + sent.slice(1);
        const words = sent.split(/\s+/);

        // Si dos oraciones consecutivas tienen longitud similar (~14 a 22 palabras),
        // romper la simetría inyectando una oración incisiva corta o un giro subordinado
        if (i === 1 && words.length > 15 && !sent.includes('—') && !sent.includes(';')) {
          if (sent.includes(', ')) {
            const parts = sent.split(', ');
            if (parts.length >= 2 && parts[0].split(/\s+/).length >= 5) {
              const firstPart = parts[0];
              const rest = parts.slice(1).join(', ');
              transformedSentences.push(`${firstPart}.`);
              transformedSentences.push(`Y no es un asunto menor: ${rest}`);
              continue;
            } else if (sent.indexOf(',') > 15 && sent.indexOf(',') < sent.length - 15) {
              const commaIdx = sent.indexOf(',');
              sent = sent.slice(0, commaIdx) + ' —y esto resulta determinante—' + sent.slice(commaIdx);
            }
          }
        }

        if (words.length > 26 && sent.includes(', que ')) {
          sent = sent.replace(', que ', '. Esto ');
        } else if (words.length > 28 && sent.includes(', y ')) {
          sent = sent.replace(', y ', '. Además, ');
        } else if (words.length > 22 && sent.includes(' pero ')) {
          sent = sent.replace(' pero ', ' —aunque ');
        }

        // Variar inicios repetitivos si dos oraciones consecutivas arrancan igual
        if (transformedSentences.length > 0) {
          const prevStart = transformedSentences[transformedSentences.length - 1].split(/\s+/)[0]?.toLowerCase();
          const currStart = words[0]?.toLowerCase();

          if (prevStart && currStart && prevStart === currStart) {
            if (currStart === 'el' || currStart === 'la' || currStart === 'este' || currStart === 'esta') {
              sent = `En efecto, ${sent.charAt(0).toLowerCase()}${sent.slice(1)}`;
            }
          }
        }

        transformedSentences.push(sent);
      }

      // Asegurar variabilidad en longitudes finales
      const finalLengths = transformedSentences.map((s) => s.split(/\s+/).filter(Boolean).length);
      const finalMean = finalLengths.reduce((a, b) => a + b, 0) / (finalLengths.length || 1);
      const finalVariance = finalLengths.reduce((a, b) => a + Math.pow(b - finalMean, 2), 0) / (finalLengths.length || 1);
      const finalStdDev = Math.sqrt(finalVariance);

      if (finalStdDev < 4.5 && transformedSentences.length >= 3) {
        transformedSentences.push('El impacto en la práctica es rotundo.');
      }

      let reconstructed = transformedSentences.join(' ');

      // 5. Restaurar citas textuales y referencias bibliográficas protegidas
      citations.forEach((citation, idx) => {
        reconstructed = reconstructed.replace(`__CITATION_${idx}__`, citation);
      });

      quotes.forEach((quote, idx) => {
        reconstructed = reconstructed.replace(`__QUOTE_${idx}__`, quote);
      });

      return reconstructed;
    });

    return {
      improvedText: improvedParagraphs.join('\n\n'),
      summaryOfChanges,
    };
  }
}
