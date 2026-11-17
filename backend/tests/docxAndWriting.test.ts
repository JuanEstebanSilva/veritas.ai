import { AIService } from '../src/services/AIService';
import { DocxService } from '../src/services/DocxService';
import { LinguisticEngine } from '../src/utils/linguisticEngine';

describe('4. Módulo de Mejora de Redacción, Humanizador y Procesamiento DOCX', () => {
  it('debe humanizar el texto sustituyendo clichés y preservando citas entre comillas', async () => {
    const rawText =
      'En conclusión, es crucial destacar que la tecnología "Machine Learning 2026" desempeña un papel fundamental. ' +
      'Asimismo, en primer lugar, es de suma importancia evaluar los datos.';

    const result = await AIService.improveWriting(rawText);

    expect(result.improvedText).toBeDefined();
    expect(result.improvedText).toContain('"Machine Learning 2026"'); // Cita entre comillas intacta
    expect(result.summaryOfChanges).toBeInstanceOf(Array);
    expect(result.summaryOfChanges.length).toBeGreaterThan(0);

    // No debe contener clichés pesados iniciales
    expect(result.improvedText).not.toContain('En conclusión, es crucial destacar que');
  });

  it('debe reducir el puntaje de IA al humanizar un texto con patrones robóticos', async () => {
    const roboticText =
      'En el vertiginoso mundo contemporáneo, es crucial destacar que la inteligencia artificial desempeña un papel fundamental. ' +
      'Resulta imperativo señalar que estas tecnologías ofrecen un amplio abanico de posibilidades. ' +
      'En conclusión, no cabe duda de que navegamos hacia una nueva era.';

    const originalAiReport = LinguisticEngine.analyzeFullText(roboticText);
    const { improvedText } = await AIService.improveWriting(roboticText);
    const improvedAiReport = LinguisticEngine.analyzeFullText(improvedText);

    expect(originalAiReport.overallAiScore).toBeGreaterThanOrEqual(60);
    // La versión humanizada debe reducir sustancialmente los indicadores mecánicos
    expect(improvedAiReport.overallAiScore).toBeLessThan(originalAiReport.overallAiScore);
  });

  it('debe generar y compilar un archivo DOCX descargable', async () => {
    const improvedText =
      'Este es un documento generado para pruebas de validación tipográfica.\n\n' +
      'El análisis determinó una clara optimización en el ritmo y fluidez del contenido.';

    const buffer = await DocxService.generateImprovedDocx({
      title: 'Prueba de Exportación DOCX',
      improvedText,
      originalAiScore: 75,
      improvedAiScore: 20,
      similarityScore: 10,
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000); // Archivo DOCX zip estructurado

    // Probar extracción con mammoth
    const extracted = await DocxService.extractTextFromBuffer(buffer);
    expect(extracted.text).toContain('Prueba de Exportación DOCX');
    expect(extracted.text).toContain('optimización en el ritmo y fluidez');
  });

  it('debe humanizar textos complejos con notas al pie en corchetes y abreviaturas sin truncamiento', async () => {
    const complexText =
      'El perro (Canis familiaris o Canis lupus familiaris, dependiendo de si se lo considera una especie o una subespecie del lobo),[1][2][3] llamado perro doméstico o can,[4] y en algunos lugares coloquialmente llamado chucho,[5] tuso,[6] choco,[7] entre otros; es un mamífero carnívoro de la familia de los cánidos, que constituye una especie del género Canis.[8][9] En el 2013, la población mundial estimada de perros estaba entre setecientos millones y novecientos ochenta y siete millones.[10][';

    const originalWordCount = complexText.split(/\s+/).filter(Boolean).length;
    const result = await AIService.improveWriting(complexText);

    expect(result.improvedText).toBeDefined();
    const improvedWordCount = result.improvedText.split(/\s+/).filter(Boolean).length;

    // El humanizador no debe truncar ni descartar el contenido
    expect(improvedWordCount).toBeGreaterThanOrEqual(65);
    expect(result.improvedText).toContain('Canis');
    expect(result.improvedText).toContain('mamífero carnívoro');

    // Debe erradicar notas al pie en corchetes y paréntesis robóticos
    expect(result.improvedText).not.toContain('[1]');
    expect(result.improvedText).not.toContain('[8][9]');
    expect(result.improvedText).not.toContain('[10]');
    expect(result.improvedText).not.toContain('[10][');
    expect(result.improvedText).not.toContain('(');
    expect(result.improvedText).not.toContain(')');

    // Comprobar que la segunda llamada es servida desde caché SHA-256 de forma inmediata
    const cachedResult = await AIService.improveWriting(complexText);
    expect(cachedResult.improvedText).toBe(result.improvedText);
  });
});
