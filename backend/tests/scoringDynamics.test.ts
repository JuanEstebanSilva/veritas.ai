import { LinguisticEngine } from '../src/utils/linguisticEngine';
import { SimilarityEngine } from '../src/utils/similarityCorpus';

describe('Verificación de Dinamismo en LinguisticEngine y SimilarityEngine', () => {
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

    // Nunca deben ser iguales a 14%
    expect(aiReport.overallAiScore).not.toBe(14);
    expect(humanReport.overallAiScore).not.toBe(14);
  });

  it('debe generar porcentajes de similitud variados según contenido, tema y longitud', () => {
    const techText =
      'Las arquitecturas de redes neuronales profundas y mecanismos de atención han transformado radicalmente el procesamiento del lenguaje natural y la visión computacional.';

    const casualText =
      'Mañana vamos al cine a ver la película nueva que acaban de estrenar y luego cenamos con los primos.';

    const legalText =
      'Es lícita la inclusión en una obra propia de fragmentos de otras ajenas siempre que se trate de obras ya divulgadas a título de cita bibliográfica según la Ley de Propiedad Intelectual.';

    const techSim = SimilarityEngine.analyzeSimilarity(techText);
    const casualSim = SimilarityEngine.analyzeSimilarity(casualText);
    const legalSim = SimilarityEngine.analyzeSimilarity(legalText);

    // Ninguno debe estar atascado en 7% o 14%
    expect(casualSim.overallSimilarityScore).not.toBe(7);
    expect(legalSim.overallSimilarityScore).not.toBe(7);

    // Fuentes encontradas deben ser contextualmente relevantes
    expect(techSim.sources.length).toBeGreaterThan(0);
    expect(legalSim.sources.length).toBeGreaterThan(0);

    // Deben variar entre sí
    expect(casualSim.overallSimilarityScore).not.toBe(legalSim.overallSimilarityScore);
  });
});
