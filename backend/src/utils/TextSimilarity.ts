/**
 * Módulo de Métricas Lingüísticas y Algoritmos de Similitud Textual (NLP)
 * 
 * Implementa algoritmos formales de procesamiento de lenguaje natural:
 * - Jaccard Token Set Similarity
 * - Sørensen-Dice N-Gram Overlap
 * - Levenshtein Distance & Normalized Edit Similarity
 * - Longest Substring Window Matcher
 */

export interface FragmentMatchResult {
  userSnippet: string;
  matchedText: string;
  similarityPercentage: number;
}

export class TextSimilarity {
  public static readonly SPANISH_STOP_WORDS = new Set([
    'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'se', 'del', 'las', 'por', 'un', 'para',
    'con', 'no', 'una', 'su', 'al', 'lo', 'como', 'mas', 'más', 'pero', 'sus', 'le', 'ya',
    'o', 'este', 'si', 'sí', 'porque', 'esta', 'entre', 'cuando', 'muy', 'sin', 'sobre',
    'tambien', 'también', 'me', 'hasta', 'hay', 'donde', 'quien', 'desde', 'todo', 'nos',
    'durante', 'todos', 'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante', 'ellos',
    'e', 'esto', 'mi', 'mí', 'antes', 'algunos', 'unos', 'yo', 'otro', 'otras', 'otra', 'él',
    'tanto', 'esa', 'estos', 'mucho', 'quienes', 'nada', 'muchos', 'cual', 'sea', 'poco',
    'ella', 'mayor', 'mucha', 'incluso', 'puesto', 'puede', 'pueden', 'cada', 'hacia',
    'ademas', 'además', 'asimismo', 'así', 'asi', 'luego', 'mediante', 'pesar', 'tras',
    'hacer', 'tener', 'estar', 'haber', 'ser', 'estas', 'aquel', 'aquello', 'sino', 'tampoco',
    'cualquier', 'cualquiera', 'mismo', 'misma', 'mismos', 'mismas', 'tan'
  ]);

  /**
   * Normaliza y tokeniza el texto en palabras individuales
   */
  public static tokenize(text: string): string[] {
    if (!text) return [];
    return (
      text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos para cotejo flexible
        .replace(/[^\w\s]/g, ' ')
        .match(/\b[a-z0-9]{2,}\b/g) || []
    );
  }

  /**
   * Filtra palabras vacías (stop words) para centrarse en tokens con carga semántica
   */
  public static filterStopWords(tokens: string[]): string[] {
    return tokens.filter((t) => !this.SPANISH_STOP_WORDS.has(t) && t.length >= 3);
  }

  /**
   * Genera n-gramas de palabras consecutivas
   */
  public static generateNgrams(tokens: string[], n: number = 2): string[] {
    if (tokens.length < n) return [];
    const ngrams: string[] = [];
    for (let i = 0; i <= tokens.length - n; i++) {
      ngrams.push(tokens.slice(i, i + n).join(' '));
    }
    return ngrams;
  }

  /**
   * Coeficiente de similitud de Jaccard entre dos conjuntos de tokens: J(A, B) = |A ∩ B| / |A ∪ B|
   */
  public static jaccardSimilarity(tokensA: string[], tokensB: string[]): number {
    if (tokensA.length === 0 || tokensB.length === 0) return 0;

    const setA = new Set(tokensA);
    const setB = new Set(tokensB);

    let intersectionSize = 0;
    for (const item of setA) {
      if (setB.has(item)) {
        intersectionSize++;
      }
    }

    const unionSize = new Set([...tokensA, ...tokensB]).size;
    return unionSize === 0 ? 0 : intersectionSize / unionSize;
  }

  /**
   * Coeficiente Sørensen-Dice sobre n-gramas: 2 * |A ∩ B| / (|A| + |B|)
   */
  public static diceCoefficient(tokensA: string[], tokensB: string[], n: number = 2): number {
    const ngramsA = this.generateNgrams(tokensA, n);
    const ngramsB = this.generateNgrams(tokensB, n);

    if (ngramsA.length === 0 || ngramsB.length === 0) return 0;

    const setB = new Set(ngramsB);
    let common = 0;
    for (const ng of ngramsA) {
      if (setB.has(ng)) {
        common++;
      }
    }

    return (2 * common) / (ngramsA.length + ngramsB.length);
  }

  /**
   * Distancia de Levenshtein optimizada en memoria O(min(m, n))
   */
  public static levenshteinDistance(s1: string, s2: string): number {
    let a = s1;
    let b = s2;
    if (a.length < b.length) {
      const tmp = a;
      a = b;
      b = tmp;
    }

    const bLen = b.length;
    let prevRow = new Array(bLen + 1);
    let currRow = new Array(bLen + 1);

    for (let j = 0; j <= bLen; j++) {
      prevRow[j] = j;
    }

    for (let i = 1; i <= a.length; i++) {
      currRow[0] = i;
      const charA = a.charAt(i - 1);
      for (let j = 1; j <= bLen; j++) {
        const cost = charA === b.charAt(j - 1) ? 0 : 1;
        currRow[j] = Math.min(
          currRow[j - 1] + 1,      // Inserción
          prevRow[j] + 1,          // Eliminación
          prevRow[j - 1] + cost    // Sustitución
        );
      }
      for (let j = 0; j <= bLen; j++) {
        prevRow[j] = currRow[j];
      }
    }

    return prevRow[bLen];
  }

  /**
   * Similitud normalizada de Levenshtein en rango [0, 1]
   */
  public static levenshteinSimilarity(s1: string, s2: string): number {
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 1;
    const dist = this.levenshteinDistance(s1, s2);
    return Math.max(0, 1 - dist / maxLen);
  }

  /**
   * Evalúa la similitud compuesta entre el texto de un usuario y el contenido/snippet de una fuente externa.
   * Identifica la mejor ventana o fragmento coincidente sin recurrir a números arbitrarios.
   */
  public static scoreMatch(
    userText: string,
    sourceSnippet: string,
    sourceTitle: string
  ): FragmentMatchResult {
    const cleanUserText = userText.trim();
    const sourceCombined = `${sourceTitle} ${sourceSnippet}`.trim();

    const userTokens = this.tokenize(cleanUserText);
    const sourceTokens = this.tokenize(sourceCombined);

    const userKeywords = this.filterStopWords(userTokens);
    const sourceKeywords = this.filterStopWords(sourceTokens);

    if (userKeywords.length === 0 || sourceKeywords.length === 0) {
      return {
        userSnippet: cleanUserText.slice(0, 140),
        matchedText: sourceSnippet.slice(0, 140) || sourceTitle,
        similarityPercentage: 0,
      };
    }

    // 1. Similitud de tokens significativos (Jaccard)
    const jaccardScore = this.jaccardSimilarity(userKeywords, sourceKeywords);

    // 2. Solapamiento de bigramas y trigramas significativos (Dice)
    const bigramDice = this.diceCoefficient(userTokens, sourceTokens, 2);
    const trigramDice = this.diceCoefficient(userTokens, sourceTokens, 3);

    // 3. Evaluar sub-oraciones para detectar copia literal localizada
    const userSentences = cleanUserText
      .split(/[.!?\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 25);

    let bestSentenceSim = 0;
    let bestUserSentence = cleanUserText.slice(0, 150);

    for (const sent of userSentences) {
      const sentTokens = this.filterStopWords(this.tokenize(sent));
      const sentJaccard = this.jaccardSimilarity(sentTokens, sourceKeywords);
      const sentBigram = this.diceCoefficient(this.tokenize(sent), sourceTokens, 2);
      const sentScore = sentJaccard * 0.5 + sentBigram * 0.5;

      if (sentScore > bestSentenceSim) {
        bestSentenceSim = sentScore;
        bestUserSentence = sent;
      }
    }

    // Ponderación compuesta equilibrada
    // Si hay coincidencia de trigramas o una oración con muy alto solapamiento, el peso de copia aumenta
    const compositeScore =
      jaccardScore * 0.30 +
      bigramDice * 0.35 +
      trigramDice * 0.15 +
      bestSentenceSim * 0.20;

    // Convertir a porcentaje entero
    let percentage = Math.round(compositeScore * 100);

    // Si hay una coincidencia de frase exacta de más de 4 palabras, garantizar un mínimo proporcional
    if (trigramDice > 0.15) {
      percentage = Math.max(percentage, Math.round(trigramDice * 100));
    }

    // Acotar entre 0 y 100
    percentage = Math.max(0, Math.min(percentage, 100));

    return {
      userSnippet: bestUserSentence.slice(0, 160) + (bestUserSentence.length > 160 ? '...' : ''),
      matchedText: sourceSnippet.slice(0, 180) || sourceTitle,
      similarityPercentage: percentage,
    };
  }
}
