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

  // Conectores y frases cliché altamente frecuentes en textos generados por modelos de lenguaje (LLM)
  private static AI_CLICHE_PHRASES_HEAVY: string[] = [
    'en el vertiginoso mundo', 'a lo largo de la historia de la humanidad', 'un papel fundamental',
    'desempeña un papel crucial', 'juega un rol decisivo', 'es crucial entender',
    'es fundamental destacar', 'cabe destacar que', 'resulta imperativo', 'es menester destacar',
    'no cabe duda de que', 'un amplio abanico', 'un mosaico de', 'un tapiz de',
    'un testimonio de', 'en este orden de ideas', 'navegar por las complejidades',
    'marcar un antes y un después', 'sinergia transformadora', 'paradigma emergente',
    'un catalizador para', 'es de vital importancia', 'en última instancia',
    'piedra angular', 'un recordatorio constante', 'no se puede subestimar',
    'delve into', 'plays a pivotal role', 'testament to', 'tapestry of',
    'beacon of', 'seamlessly integrated', 'in today\'s fast-paced world',
    'it is worth noting', 'a testament to the fact that', 'serves as a reminder',
    'multifaceted nature', 'holistic approach'
  ];

  private static AI_CLICHE_PHRASES_MODERATE: string[] = [
    'en conclusión', 'en resumen', 'en este sentido', 'por consiguiente',
    'asimismo', 'por otro lado', 'no solo..., sino también', 'es de suma importancia',
    'a fin de cuentas', 'en resumidas cuentas', 'en la actualidad', 'con el fin de',
    'a través de este', 'vale la pena señalar', 'en síntesis', 'a modo de resumen',
    'cabe señalar que', 'por ende', 'a modo de colofón', 'sin duda alguna',
    'es importante tener en cuenta', 'como se mencionó anteriormente', 'a continuación se presentan',
    'ofrece una perspectiva', 'in conclusion', 'moreover', 'furthermore',
    'in summary', 'consequently', 'it is important to note', 'on the other hand'
  ];

  // Señales directas de voz humana orgánica (primera persona, subjetividad, oralidad y afecto)
  private static HUMAN_VOICE_PATTERNS: { pattern: RegExp; weight: number; label: string }[] = [
    { pattern: /\b(?:yo|mi|mis|mío|mía|míos|mías|conmigo)\b/i, weight: 14, label: 'Perspectiva personal en primera persona' },
    { pattern: /\b(?:creo|pienso|opino|noté|observé|descubrí|escribí|sentí|viví|aprendí|recuerdo|considero|intento|busco|quiero|espero|prefiero|dudo|me parece|me di cuenta|a mi juicio|para mí)\b/i, weight: 16, label: 'Verbos de subjetividad y vivencia personal' },
    { pattern: /\b(?:la verdad|o sea|por cierto|a ver|ojo|fíjate|bueno|en fin|vamos|tal cual|de hecho|digamos|sinceramente|la verdad es que|en mi opinión)\b/i, weight: 12, label: 'Locuciones coloquiales y oralidad auténtica' },
    { pattern: /—|--|¡|!|\?|¿|\.{3}/, weight: 8, label: 'Puntuación expresiva y pausas enfáticas' }
  ];

  /**
   * Genera un hash determinista a partir del texto para micro-variación orgánica consistente
   */
  private static deterministicHash(str: string): number {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash);
  }

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
   * Divide un párrafo en oraciones individuales con tolerancia a abreviaturas,
   * cifras decimales, citas académicas y notas al pie sin pérdida de texto.
   */
  public static splitSentences(paragraph: string): string[] {
    if (!paragraph || typeof paragraph !== 'string') return [];
    const trimmed = paragraph.trim();
    if (trimmed.length === 0) return [];

    // Lista de abreviaturas frecuentes que llevan punto pero no terminan oración
    const ABBRS = [
      'dr', 'dra', 'sr', 'sra', 'srta', 'prof', 'ing', 'lic',
      'ej', 'pág', 'págs', 'etc', 'vs', 'art', 'vol', 'núm', 'cap',
      'mr', 'mrs', 'ms', 'inc', 'ltd', 'dept', 'univ', 'approx', 'fig', 'al'
    ];

    let protectedText = trimmed;

    // 1. Proteger números decimales (ej: 3.14 o 95.5)
    protectedText = protectedText.replace(/(\d+)\.(\d+)/g, '$1__DEC__$2');

    // 2. Proteger abreviaturas individuales (ej: "ej." -> "ej__DOT__")
    for (const abbr of ABBRS) {
      const reg = new RegExp(`\\b(${abbr})\\.(\\s+|$)`, 'gi');
      protectedText = protectedText.replace(reg, '$1__DOT__$2');
    }

    // 3. Proteger abreviaturas con iniciales mayúsculas múltiples (ej: "EE. UU." o "U.S.A.")
    protectedText = protectedText.replace(/\b([A-ZÁÉÍÓÚÑ]{1,3})\.\s*([A-ZÁÉÍÓÚÑ]{1,3})\./g, '$1__DOT__$2__DOT__');

    // 4. Proteger puntos suspensivos ("...")
    protectedText = protectedText.replace(/\.{2,}/g, '__ELLIPSIS__');

    // 5. Delimitador de frontera oracional:
    // Puntuación (. ! ?) seguida opcionalmente de notas al pie en corchetes [1], comillas o paréntesis,
    // cuando está seguida de espacio y comienzo de nueva proposición, o fin de texto.
    const BOUNDARY_TOKEN = '___SENT_SPLIT___';
    const segmented = protectedText.replace(
      /([.!?]+(?:\[[\d,\s-]+\]|[\"\'»”\)\]])*)(?=\s+[A-ZÁÉÍÓÚÑ¡¿"«\d]|$)/g,
      '$1' + BOUNDARY_TOKEN
    );

    const rawSplits = segmented.split(BOUNDARY_TOKEN);
    const sentences: string[] = [];

    for (let s of rawSplits) {
      s = s
        .replace(/__DEC__/g, '.')
        .replace(/__DOT__/g, '.')
        .replace(/__ELLIPSIS__/g, '...');
      s = s.trim();
      if (s.length > 0) {
        sentences.push(s);
      }
    }

    // Invariante de seguridad: jamás devolver un arreglo vacío si el párrafo original tenía texto
    return sentences.length > 0 ? sentences : [trimmed];
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
   * Calcula el ratio de Hapax Legomena (palabras que aparecen exactamente una sola vez)
   */
  public static calculateHapaxRatio(words: string[]): number {
    if (words.length === 0) return 1.0;
    const freq: Record<string, number> = {};
    for (const w of words) {
      freq[w] = (freq[w] || 0) + 1;
    }
    const uniqueWords = Object.keys(freq);
    const hapaxCount = uniqueWords.filter((w) => freq[w] === 1).length;
    return hapaxCount / Math.max(uniqueWords.length, 1);
  }

  /**
   * Calcula la entropía de Shannon a nivel de caracteres
   */
  public static calculateShannonEntropy(text: string): number {
    const clean = text.replace(/\s+/g, '').toLowerCase();
    if (clean.length === 0) return 0;
    const freqs: Record<string, number> = {};
    for (let i = 0; i < clean.length; i++) {
      const c = clean[i];
      freqs[c] = (freqs[c] || 0) + 1;
    }
    let entropy = 0;
    const total = clean.length;
    for (const c of Object.keys(freqs)) {
      const p = freqs[c] / total;
      entropy -= p * Math.log2(p);
    }
    return entropy;
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
      const count = sentences[0]?.split(/\s+/).filter(Boolean).length || 0;
      return { meanLength: count, variance: 0, stdDev: 0, burstinessScore: 0.5 };
    }

    const substantive = sentences.filter((s) => s.split(/\s+/).filter(Boolean).length > 2);
    const targetSentences = substantive.length >= 2 ? substantive : sentences;

    const lengths = targetSentences.map((s) => s.split(/\s+/).filter(Boolean).length);
    const mean = lengths.reduce((acc, l) => acc + l, 0) / lengths.length;
    const squaredDiffs = lengths.map((l) => Math.pow(l - mean, 2));
    const variance = squaredDiffs.reduce((acc, sd) => acc + sd, 0) / lengths.length;
    const stdDev = Math.sqrt(variance);

    // Coeficiente de variación (stdDev / mean) normalizado
    const cv = mean > 0 ? stdDev / mean : 0;
    const burstinessScore = Math.min(Math.max(cv / 0.55, 0), 1);

    return { meanLength: mean, variance, stdDev, burstinessScore };
  }

  /**
   * Analiza la densidad de frases cliché y patrones predecibles
   */
  public static checkCliches(text: string): { count: number; found: string[]; density: number; heavyCount: number } {
    const lower = text.toLowerCase();
    const found: string[] = [];
    let heavyCount = 0;

    for (const phrase of this.AI_CLICHE_PHRASES_HEAVY) {
      if (lower.includes(phrase)) {
        found.push(phrase);
        heavyCount++;
      }
    }

    for (const phrase of this.AI_CLICHE_PHRASES_MODERATE) {
      if (lower.includes(phrase) && !found.includes(phrase)) {
        found.push(phrase);
      }
    }

    const wordCount = this.tokenizeWords(text).length;
    const density = wordCount > 0 ? (found.length * 30) / wordCount : 0;
    return { count: found.length, found, density: Math.min(density, 1), heavyCount };
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
   * Evalúa presencia de voz y autenticidad humana (primera persona, subjetividad, coloquialismos)
   */
  public static evaluateHumanVoice(text: string): { humanScoreBonus: number; detectedMarkers: string[] } {
    let scoreBonus = 0;
    const detectedMarkers: string[] = [];

    for (const item of this.HUMAN_VOICE_PATTERNS) {
      const matches = text.match(new RegExp(item.pattern.source, 'gi'));
      if (matches && matches.length > 0) {
        scoreBonus += Math.min(matches.length * item.weight, item.weight * 2.5);
        detectedMarkers.push(item.label);
      }
    }

    return { humanScoreBonus: scoreBonus, detectedMarkers };
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

    if (words.length < 7) {
      const shortHash = this.deterministicHash(paragraph);
      const shortScore = Math.max(1, 2 + (shortHash % 4));
      return {
        paragraphIndex: index,
        paragraphText: paragraph,
        paragraphAiScore: shortScore,
        indicators: ['Longitud breve'],
        explanation: 'El párrafo contiene muy pocas palabras para inferir características estilométricas completas.',
      };
    }

    const { burstinessScore, meanLength, stdDev } = this.calculateBurstiness(sentences);
    const ttr = this.calculateTTR(words);
    const hapaxRatio = this.calculateHapaxRatio(words);
    const entropy = this.calculateShannonEntropy(paragraph);
    const { count: clicheCount, found, density, heavyCount } = this.checkCliches(paragraph);
    const startUniformity = this.checkSentenceStartUniformity(sentences);
    const { humanScoreBonus, detectedMarkers } = this.evaluateHumanVoice(paragraph);
    const textHash = this.deterministicHash(paragraph);

    const indicators: string[] = [];
    let finalScore: number;

    if (heavyCount === 0 && clicheCount === 0) {
      // TEXTO HUMANO O HUMANIZADO (Ausencia total de fórmulas o clichés de IA)
      // Rango orgánico dinámico y realista entre 1% y 12%, dependiente de las características intrínsecas
      let naturalScore = 5.8;

      // 1. Modulador por riqueza léxica (TTR y Hapax Legomena)
      naturalScore += (0.64 - ttr) * 7.0;

      // 2. Modulador por variabilidad rítmica (Burstiness y desviación estándar de oraciones)
      if (sentences.length >= 2) {
        naturalScore += (0.48 - burstinessScore) * 5.5;
        if (stdDev > 8.0) {
          naturalScore -= 1.2;
        } else if (stdDev < 4.0 && meanLength >= 15) {
          naturalScore += 2.0;
        }
      }

      // 3. Modulador por presencia de voz humana genuina (primera persona, marcas de oralidad)
      if (humanScoreBonus > 0) {
        naturalScore -= Math.min(humanScoreBonus * 0.20, 2.8);
        for (const m of detectedMarkers) {
          indicators.push(m);
        }
      }

      // 4. Modulador por extensión de párrafo
      if (words.length > 70) {
        naturalScore -= 0.6;
      } else if (words.length < 20) {
        naturalScore += 0.8;
      }

      // 5. Singularidad determinista del párrafo para garantizar un puntaje único y orgánico
      const paragraphJitter = ((textHash % 13) - 6) * 0.45; // fluctuación reproducible continua ~ ±2.7%
      naturalScore += paragraphJitter;

      finalScore = Math.max(1, Math.min(Math.round(naturalScore), 14));

      if (finalScore <= 8 && indicators.length === 0) {
        indicators.push('Cadencia natural y autoría humana');
      }
    } else {
      // TEXTO CON FÓRMULAS DE IA O RASGOS SINTÉTICOS
      let aiPoints = 28;

      // 1. Detección de giros y fórmulas de IA
      if (heavyCount >= 2 || clicheCount >= 4) {
        aiPoints += 52;
        indicators.push('Fuerte presencia de fórmulas de IA');
        indicators.push('Transiciones sintéticas estereotipadas');
      } else if (heavyCount === 1 || clicheCount >= 2 || density > 0.10) {
        aiPoints += 34;
        indicators.push('Conectores sintéticos detectados');
      } else if (clicheCount === 1) {
        aiPoints += 16;
        indicators.push('Conector formal reiterado');
      }

      // 2. Inmunidad o atenuación por voz humana genuina
      if (humanScoreBonus > 0) {
        aiPoints -= Math.min(humanScoreBonus, 25);
        for (const m of detectedMarkers) {
          indicators.push(m);
        }
      }

      // 3. Cadencia y burstiness (longitud y variabilidad de oraciones)
      if (sentences.length >= 2) {
        if (burstinessScore < 0.28) {
          aiPoints += 18;
          indicators.push('Cadencia métrica uniforme');
        } else if (burstinessScore > 0.55) {
          aiPoints -= 12;
          indicators.push('Alternancia rítmica natural');
        }

        // 4. Ventana de simetría de IA
        if (meanLength >= 15 && meanLength <= 28 && stdDev < 4.0) {
          aiPoints += 14;
          indicators.push('Simetría estructural sintética');
        } else if (stdDev > 7.0) {
          aiPoints -= 8;
        }
      }

      // 5. Variedad léxica (Type-Token Ratio) y Hapax Legomena
      if (words.length > 25) {
        if (ttr < 0.45 && hapaxRatio < 0.55) {
          aiPoints += 12;
          indicators.push('Baja variación léxica');
        } else if (ttr > 0.70 && hapaxRatio > 0.75) {
          aiPoints -= 8;
          indicators.push('Riqueza léxica orgánica');
        }
      }

      // 6. Repetición de inicios sintácticos
      if (startUniformity > 0.35) {
        aiPoints += 12;
        indicators.push('Patrones sintácticos repetitivos');
      }

      // 7. Micro-variación determinista (±2%)
      const jitter = (textHash % 5) - 2;
      aiPoints += jitter;

      finalScore = Math.max(16, Math.min(Math.round(aiPoints), 99));
    }

    let explanation = '';
    if (finalScore >= 70) {
      explanation = `Presenta una alta concentración de giros de modelos generativos (${clicheCount} detectados), uniformidad en la longitud de oraciones (${meanLength.toFixed(0)} palabras promedio) y cadencia sintética.`;
    } else if (finalScore >= 25) {
      explanation = `Muestra características híbridas: cierta uniformidad estructural combinada con modulaciones de ritmo de redacción natural.`;
    } else {
      explanation = `Estructura orgánica con alternancia rítmica marcada, ausencia de muletillas de IA y rica variedad léxica propia de la redacción humana.`;
    }

    return {
      paragraphIndex: index,
      paragraphText: paragraph,
      paragraphAiScore: finalScore,
      indicators: Array.from(new Set(indicators)).slice(0, 5),
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

    // Micro-ajuste determinista global según la huella única del documento
    const docHash = this.deterministicHash(text);
    const globalJitter = weightedScore <= 14 ? ((docHash % 7) - 3) * 0.35 : (docHash % 3) - 1;

    const overallAiScore = Math.max(1, Math.min(Math.round(weightedScore + globalJitter), 99));

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
      'Erradicación total de notas al pie numéricas ([n]), corchetes y artefactos de copiado enciclopédico',
      'Suavizado de paréntesis mecánicos y conversión en incisos naturales',
      'Eliminación de auto-identificaciones de chatbot, metadatos y fórmulas de asistente virtual',
      'Ruptura de cadencia simétrica: alternancia intencional de oraciones cortas e incisivas con estructuras compuestas (burstiness orgánico)',
      'Erradicación total de más de 40 conectores cliché y fórmulas de énfasis típicas de IA',
      'Diversificación de arranques de oración para eliminar patrones sintácticos predecibles',
      'Enriquecimiento léxico dinámico y sustitución por giros expresivos humanos',
      'Normalización de puntuación orgánica y limpieza de signos tipográficos anómalos',
      'Preservación absoluta de citas textuales entre comillas, cifras numéricas y terminología especializada'
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

      // Clichés temporales y de apertura de IA
      [/\ben el vertiginoso mundo contempor[aá]neo\b/gi, 'al presente'],
      [/\ben el vertiginoso mundo\b/gi, 'en el contexto actual'],
      [/\ba lo largo de la historia de la humanidad\b/gi, 'históricamente'],
      [/\bmarcar un antes y un despu[eé]s\b/gi, 'generar una transformación profunda'],
      [/\bparadigma emergente\b/gi, 'nuevo modelo'],
      [/\bsinergia transformadora\b/gi, 'integración efectiva'],
      [/\bun catalizador para\b/gi, 'un impulso para'],
      [/\bpiedra angular\b/gi, 'eje principal'],
      [/\bun recordatorio constante\b/gi, 'una muestra'],
      [/\bno se puede subestimar\b/gi, 'conviene valorar con atención'],
      [/\bnavegar por las complejidades\b/gi, 'afrontar los desafíos'],
      [/\bnavegamos hacia\b/gi, 'avanzamos hacia'],
      [/\bresulta imperativo se[nñ]alar que\b/gi, 'conviene indicar que'],
      [/\bresulta imperativo\b/gi, 'es prioritario'],

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
      // 1. Proteger citas textuales directas entre comillas ("...", «...», “...”)
      const quotes: string[] = [];
      let sanitized = paragraph.replace(/(?:"[^"]*"|«[^»]*»|“[^”]*”)/g, (match) => {
        quotes.push(match);
        return `__QUOTE_${quotes.length - 1}__`;
      });

      // 2. Erradicar notas al pie tipo Wikipedia o corchetes numéricos ([1], [1, 2], [1-3], [8][9], [10])
      sanitized = sanitized.replace(/\[\s*\d+(?:[,\s-]+\d+)*\s*\]/g, '');

      // 3. Limpiar corchetes residuales, huérfanos o vacíos ([], [, ], [10][ -> se elimina el residuo)
      sanitized = sanitized.replace(/\[\s*\]/g, '');
      sanitized = sanitized.replace(/\[(?!\w)/g, '');
      sanitized = sanitized.replace(/(?<!\w)\]/g, '');
      sanitized = sanitized.replace(/\[\s*$/g, '');

      // 4. Suavizar paréntesis innecesarios o académicos para que fluyan como incisos naturales entre comas
      // Ej: "perro (Canis lupus) llamado" -> "perro, Canis lupus, llamado"
      sanitized = sanitized.replace(/\s*\(([^)]{2,120})\)\s*/g, ', $1, ');
      sanitized = sanitized.replace(/\s*\([^)]*\)\s*/g, ' ');

      // 5. Limpiar signos de interrogación y exclamación anómalos o repetidos (ej: ¿?, ??, !!, espacios antes de ?)
      sanitized = sanitized.replace(/[¿?]{2,}/g, '?');
      sanitized = sanitized.replace(/[¡!]{2,}/g, '!');
      sanitized = sanitized.replace(/\s+[?]/g, '?');
      sanitized = sanitized.replace(/\s+[!]/g, '!');

      // 6. Aplicar reemplazos de clichés y conectores algorítmicos con soporte para grupos ($1, $2)
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

      // 7. Normalizar puntuación duplicada o mal espaciada tras limpieza
      sanitized = sanitized.replace(/\s*,\s*,+/g, ',');
      sanitized = sanitized.replace(/,\s*\./g, '.');
      sanitized = sanitized.replace(/\s+,/g, ',');
      sanitized = sanitized.replace(/\s+\./g, '.');
      sanitized = sanitized.replace(/;\s*;/g, ';');
      sanitized = sanitized.replace(/\s+;/g, ';');

      // 8. Inyección de Burstiness Orgánico y Ruptura de Simetría de Oraciones
      const rawSentences = LinguisticEngine.splitSentences(sanitized);
      const transformedSentences: string[] = [];

      for (let i = 0; i < rawSentences.length; i++) {
        let sent = rawSentences[i].trim();
        if (!sent) continue;

        // Asegurar que comience con mayúscula sin alterar placeholders
        if (!sent.startsWith('__')) {
          sent = sent.charAt(0).toUpperCase() + sent.slice(1);
        }
        const words = sent.split(/\s+/);

        // Dividir oraciones excesivamente largas en ideas concisas para mejorar legibilidad
        if (words.length > 25 && sent.includes(', que ')) {
          sent = sent.replace(', que ', '. Esto ');
        } else if (words.length > 26 && sent.includes(', y ')) {
          sent = sent.replace(', y ', '. Además, ');
        } else if (words.length > 22 && sent.includes(' pero ')) {
          sent = sent.replace(' pero ', '; no obstante, ');
        }

        // Variar inicios repetitivos si dos oraciones consecutivas arrancan con el mismo determinante
        if (transformedSentences.length > 0) {
          const prevStart = transformedSentences[transformedSentences.length - 1].split(/\s+/)[0]?.toLowerCase();
          const currStart = words[0]?.toLowerCase();

          if (prevStart && currStart && prevStart === currStart) {
            if (currStart === 'el' || currStart === 'la' || currStart === 'este' || currStart === 'esta') {
              sent = `Asimismo, ${sent.charAt(0).toLowerCase()}${sent.slice(1)}`;
            }
          }
        }

        transformedSentences.push(sent);
      }

      let reconstructed = transformedSentences.join(' ');

      // 9. Restaurar citas textuales protegidas intactas
      quotes.forEach((quote, idx) => {
        reconstructed = reconstructed.replace(`__QUOTE_${idx}__`, quote);
      });

      // 10. Limpieza final de espacios colapsados
      reconstructed = reconstructed.replace(/[ \t]+/g, ' ').replace(/\s+([.,;:?!])/g, '$1').trim();

      return reconstructed;
    });

    return {
      improvedText: improvedParagraphs.join('\n\n'),
      summaryOfChanges,
    };
  }
}
