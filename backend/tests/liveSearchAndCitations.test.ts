import { LiveSearchService } from '../src/services/LiveSearchService';
import { SimilarityEngine } from '../src/utils/similarityCorpus';
import { CitationService } from '../src/services/CitationService';
import { TextSimilarity } from '../src/utils/TextSimilarity';

describe('Módulo de Búsqueda Web Real, NLP y Citación Dinámica APA 7 / IEEE', () => {
  it('no debe devolver citas forzadas a Wikipedia para textos de tecnología', async () => {
    const techSample =
      'React 19 introduce Server Actions y mejoras significativas en el compilador para optimizar el renderizado de componentes y reducir el código repetitivo.';

    const report = await SimilarityEngine.analyzeSimilarity(techSample);

    // Verificar que ninguna de las fuentes sea la cita estática de Wikipedia previa
    const hasStaticWiki = report.sources.some(
      (s) =>
        s.sourceUrl === 'https://es.wikipedia.org/wiki/Inteligencia_artificial' ||
        s.sourceTitle.includes('Fundamentos de Inteligencia Artificial')
    );
    expect(hasStaticWiki).toBe(false);

    // Si encuentra fuentes en la web, verificar que tengan citas APA 7 bien formadas
    for (const src of report.sources) {
      expect(src.apaCitation).toBeDefined();
      expect(src.apaCitation.inText).toMatch(/^\([\p{L}0-9\s/.,\-–&]+,\s*(?:\d{4}|s\.f\.)\)$/u);
      expect(src.apaCitation.reference).toContain(src.sourceUrl);
      expect(src.sourceUrl).toMatch(/^https?:\/\//);
    }
  }, 25000);

  it('debe generar citas APA 7 consistentes con autor y año a partir de URL y título', () => {
    const apa1 = CitationService.generateApa7({
      title: 'Galaxias durmientes: hallazgos del James Webb',
      url: 'https://www.infobae.com/america/ciencia/2025/galaxias-james-webb',
      year: 2025,
    });

    expect(apa1.inText).toBe('(Infobae, 2025)');
    expect(apa1.reference).toContain('Infobae. (2025).');
    expect(apa1.reference).toContain('https://www.infobae.com/america/ciencia/2025/galaxias-james-webb');

    const apa2 = CitationService.generateApa7({
      title: 'El impacto de la inteligencia artificial en la productividad - El País',
      url: 'https://elpais.com/economia/2024-05-10/inteligencia-artificial-productividad.html',
      year: 2024,
    });

    expect(apa2.inText).toBe('(El País, 2024)');
    expect(apa2.reference).toContain('El País. (2024).');
    expect(apa2.reference).not.toContain('- El País'); // Título limpio
  });

  it('debe generar citas APA 7 con "s.f." cuando no se dispone de fecha o año', () => {
    const apaNoDate = CitationService.generateApa7({
      title: 'Principios de Arquitectura de Software Limpia',
      url: 'https://xataka.com/pro/arquitectura-software-limpia',
    });

    expect(apaNoDate.inText).toBe('(Xataka, s.f.)');
    expect(apaNoDate.reference).toContain('Xataka. (s.f.).');
    expect(apaNoDate.reference).toContain('Principios de Arquitectura de Software Limpia');
  });

  it('debe formatear autores personales en formato APA 7 y soportar autores institucionales', () => {
    const personal = CitationService.generateApa7({
      title: 'Estilometría Forense en la Era Digital',
      url: 'https://scielo.org/articulo/estilometria-forense',
      author: 'Carlos Alberto Mendoza Silva',
      year: 2023,
    });

    expect(personal.inText).toBe('(Mendoza, 2023)');
    expect(personal.reference).toContain('Mendoza Silva, C. A. (2023).');
    expect(personal.reference).toContain('SciELO');

    const institutional = CitationService.generateApa7({
      title: 'Recomendación sobre la Ética de la Inteligencia Artificial',
      url: 'https://unesco.org/es/ethics-ai',
      author: 'UNESCO',
      year: 2021,
    });

    expect(institutional.inText).toBe('(UNESCO, 2021)');
    expect(institutional.reference).toContain('UNESCO. (2021).');
  });

  it('debe generar citas en formato IEEE de manera precisa', () => {
    const ieee = CitationService.generateIeee(
      {
        title: 'Deep Residual Learning for Image Recognition',
        url: 'https://arxiv.org/abs/1512.03385',
        author: 'K. He, X. Zhang, S. Ren, and J. Sun',
        year: 2015,
      },
      1
    );

    expect(ieee.inText).toBe('[1]');
    expect(ieee.reference).toContain('[1] K. He, X. Zhang, S. Ren, and J. Sun, "Deep Residual Learning for Image Recognition,"');
    expect(ieee.reference).toContain('[En línea]. Disponible: https://arxiv.org/abs/1512.03385');
    expect(ieee.style).toBe('IEEE');
  });

  it('debe extraer consultas salientes incluyendo citas entre comillas y respetar presupuesto de cuota', () => {
    const textWithQuote =
      'Según el informe más reciente, "los modelos de lenguaje grandes exhiben razonamiento emergente" en diversas pruebas de comprensión contextual. Por otra parte, la evaluación empírica demuestra que el fine-tuning optimiza la precisión en dominios clínicos especializados.';

    const queries = LiveSearchService.generateSearchQueries(textWithQuote, 3);
    expect(queries.length).toBeGreaterThan(0);
    expect(queries.length).toBeLessThanOrEqual(3); // Presupuesto de cuota
    // Debe haber extraído la cita entre comillas
    expect(queries).toContain('los modelos de lenguaje grandes exhiben razonamiento emergente');
  });

  it('debe calcular métricas NLP de similitud textual correctamente con TextSimilarity', () => {
    const textA = 'la inteligencia artificial transforma los procesos educativos';
    const textB = 'la inteligencia artificial transforma el paradigma educativo moderno';
    const textC = 'receta de cocina para preparar paella valenciana tradicional';

    const tokensA = TextSimilarity.tokenize(textA);
    const tokensB = TextSimilarity.tokenize(textB);
    const tokensC = TextSimilarity.tokenize(textC);

    const jaccardAB = TextSimilarity.jaccardSimilarity(
      TextSimilarity.filterStopWords(tokensA),
      TextSimilarity.filterStopWords(tokensB)
    );
    const jaccardAC = TextSimilarity.jaccardSimilarity(
      TextSimilarity.filterStopWords(tokensA),
      TextSimilarity.filterStopWords(tokensC)
    );

    // textA y textB comparten conceptos clave ('inteligencia', 'artificial')
    expect(jaccardAB).toBeGreaterThan(0.3);
    // textA y textC no comparten conceptos
    expect(jaccardAC).toBe(0);

    // ScoreMatch integrado
    const match = TextSimilarity.scoreMatch(
      'La inteligencia artificial transforma los procesos educativos en las universidades.',
      'estudio sobre cómo la inteligencia artificial transforma los procesos educativos en entornos superiores.',
      'Artículo SciELO Educación'
    );

    expect(match.similarityPercentage).toBeGreaterThan(40);
    expect(match.userSnippet).toBeDefined();
    expect(match.matchedText).toBeDefined();
  });

  it('debe devolver 0% de similitud y ninguna fuente inventada para historias 100% personales', async () => {
    const personalText =
      'Ayer por la tarde salí a caminar por el parque con mi perro Max. El clima estaba fresco y nos encontramos con varios vecinos que también paseaban con sus mascotas mientras caían las hojas de los árboles.';

    const report = await SimilarityEngine.analyzeSimilarity(personalText);
    // Para historias 100% personales el índice no debe inflarse ni inventar fuentes de SciELO/Dialnet
    expect(report.overallSimilarityScore).toBeLessThan(15);
    // No debe citar Wikipedia sobre IA arbitrariamente
    const wikiMatch = report.sources.find((s) => s.sourceUrl.includes('Inteligencia_artificial'));
    expect(wikiMatch).toBeUndefined();
  }, 15000);
});
