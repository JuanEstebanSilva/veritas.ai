import { LinguisticEngine } from '../src/utils/linguisticEngine';
import { SimilarityEngine } from '../src/utils/similarityCorpus';
import { TextSimilarity } from '../src/utils/TextSimilarity';

describe('Verificación de Dinamismo en LinguisticEngine y TextSimilarity', () => {
  it('debe diferenciar claramente texto de IA frente a texto humano', () => {
    const aiText =
      'En el vertiginoso mundo contemporáneo, es crucial destacar que la inteligencia artificial desempeña un papel fundamental en la transformación de la sociedad. Asimismo, resulta imperativo señalar que estas tecnologías ofrecen un amplio abanico de posibilidades que transforman el paradigma educativo y científico. En conclusión, no cabe duda de que navegamos hacia una nueva era.';

    const humanText =
      'Ayer me senté a escribir sobre mi experiencia en el taller de literatura. La verdad es que al principio me sentí un poco perdido, pero luego empecé a recordar las historias que me contaba mi abuelo en el campo. Creo que ese fue el momento exacto en que todo empezó a tener sentido para mí.';

    const aiReport = LinguisticEngine.analyzeFullText(aiText);
    const humanReport = LinguisticEngine.analyzeFullText(humanText);

    // El texto de IA debe tener un puntaje alto de IA
    expect(aiReport.overallAiScore).toBeGreaterThanOrEqual(70);

    // El texto humano debe tener un puntaje bajo de IA (Índice humano alto)
    expect(humanReport.overallAiScore).toBeLessThanOrEqual(20);

    // Nunca deben ser iguales a valores arbitrarios fijos
    expect(aiReport.overallAiScore).not.toBe(14);
    expect(humanReport.overallAiScore).not.toBe(14);
  });

  it('debe calcular porcentajes de similitud coherentes y dinámicos según el vocabulario y n-gramas', () => {
    const originalArticle =
      'Las redes neuronales profundas utilizan mecanismos de retropropagación para ajustar los pesos y reducir el error en tareas complejas de visión artificial.';

    const copiedSnippet =
      'Las redes neuronales profundas utilizan mecanismos de retropropagación para ajustar pesos en visión artificial.';

    const unrelatedSnippet =
      'Los arrecifes de coral en el océano Pacífico enfrentan graves amenazas por el aumento de la temperatura del agua.';

    const highMatch = TextSimilarity.scoreMatch(originalArticle, copiedSnippet, 'Fuente IA');
    const lowMatch = TextSimilarity.scoreMatch(originalArticle, unrelatedSnippet, 'Fuente Biología');

    // El fragmento con copia de n-gramas debe tener similitud sustancial
    expect(highMatch.similarityPercentage).toBeGreaterThan(45);

    // El fragmento no relacionado debe tener similitud 0 o insignificante
    expect(lowMatch.similarityPercentage).toBeLessThan(10);

    // No deben ser iguales
    expect(highMatch.similarityPercentage).not.toBe(lowMatch.similarityPercentage);
  });

  it('debe manejar textos breves o consultas sin inventar fuentes ficticias', async () => {
    const veryShortText = 'Hola mundo';
    const report = await SimilarityEngine.analyzeSimilarity(veryShortText);

    expect(report.overallSimilarityScore).toBe(0);
    expect(report.sources).toEqual([]);
    expect(report.disclaimer).toContain('demasiado breve');
  });
});
