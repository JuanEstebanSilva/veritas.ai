/**
 * API simulado para la prueba visual del frontend. Sirve las rutas que las
 * páginas consultan con datos de muestra. No sustituye al backend real.
 *   node scripts/mock-api.mjs   →  http://localhost:5000/api
 */
import http from 'node:http';

const admin = { id: 'u-admin', name: 'Administradora', last_name: 'Sistema', email: 'admin@plagelio.com', role: 'ADMIN', is_active: true, is_premium: true, premium_since: '2026-01-10T10:00:00Z', daily_analysis_count: 0, total_analyses: 9, available_today: 'Ilimitados', created_at: '2025-11-02T09:00:00Z' };
const demo = { id: 'u-demo', name: 'Carlos', last_name: 'Mendoza', email: 'usuario@plagelio.com', role: 'USER', is_active: true, is_premium: false, premium_since: null, daily_analysis_count: 2, total_analyses: 6, available_today: 3, created_at: '2026-03-14T09:00:00Z' };
let current = demo;

const history = [
  { id: 'a1', title_or_filename: 'Ensayo_Metodologia_Investigacion_2026.docx', type: 'DOCX', ai_score: 12, similarity_score: 11, improved_ai_score: null, improved_similarity_score: null, created_at: '2026-09-14T15:20:00Z' },
  { id: 'a2', title_or_filename: 'Marco teórico — capítulo 2', type: 'TEXT', ai_score: 87, similarity_score: 24, improved_ai_score: 9, improved_similarity_score: 12, created_at: '2026-09-12T11:05:00Z' },
  { id: 'a3', title_or_filename: 'Resumen ejecutivo del proyecto', type: 'TEXT', ai_score: 46, similarity_score: 8, improved_ai_score: null, improved_similarity_score: null, created_at: '2026-09-09T18:40:00Z' },
  { id: 'a4', title_or_filename: 'Tesis_borrador_v3.docx', type: 'DOCX', ai_score: 31, similarity_score: 19, improved_ai_score: 7, improved_similarity_score: 15, created_at: '2026-09-02T08:12:00Z' },
  { id: 'a5', title_or_filename: 'Reseña bibliográfica', type: 'TEXT', ai_score: 9, similarity_score: 5, improved_ai_score: null, improved_similarity_score: null, created_at: '2026-08-28T13:00:00Z' },
  { id: 'a6', title_or_filename: 'Artículo para revista indexada', type: 'TEXT', ai_score: 72, similarity_score: 33, improved_ai_score: 11, improved_similarity_score: 21, created_at: '2026-08-20T10:30:00Z' },
];

// Informe de muestra: nueve párrafos y cinco fuentes. Los fragmentos
// detectados (userSnippet) están tomados del propio texto.
const PARAS = [
  [87, 'En conclusión, es crucial destacar que la inteligencia artificial desempeña un papel fundamental en la transformación del sector educativo contemporáneo. Asimismo, cabe señalar que su implementación requiere un enfoque integral.', ['Fuerte presencia de fórmulas de IA', 'Cadencia uniforme', 'Simetría estructural sintética'], 'Alta concentración de giros de IA (4 detectados) y simetría cadencial típica de modelos generativos.'],
  [46, 'Los datos recogidos durante el trabajo de campo (Mendoza, 2024) sugieren una correlación que el marco teórico previo no había anticipado. La muestra, sin embargo, es pequeña.', ['Conector formal reiterado'], 'Rasgos híbridos: cierta uniformidad estructural combinada con modulaciones de ritmo propias de la redacción humana.'],
  [9, 'Llegué a esta pregunta por accidente. Revisaba actas de 1987 buscando otra cosa y el nombre apareció tres veces en una misma página. No podía ser casualidad.', ['Variación estilística natural'], 'Estructura orgánica con alternancia rítmica marcada y sin muletillas de IA.'],
  [74, 'Es importante mencionar que los sistemas de tutoría inteligente ofrecen una experiencia de aprendizaje personalizada y adaptativa. De igual manera, estos sistemas permiten optimizar los procesos de evaluación y retroalimentación. Por consiguiente, su adopción representa una oportunidad significativa para las instituciones.', ['Conectores predecibles', 'Cadencia uniforme'], 'Tres oraciones de longitud casi idéntica encadenadas con conectores de manual.'],
  [22, 'Tres docentes rechazaron participar. Uno de ellos lo dijo sin rodeos: «no quiero que una máquina corrija lo que yo tardé veinte años en aprender a leer». Lo anoté tal cual, porque resume una resistencia que las encuestas no recogen.', ['Variación estilística natural', 'Cita textual'], 'Alternancia entre frases muy cortas y largas; la cita se conserva sin alterar.'],
  [63, 'La metodología de la investigación comprende el conjunto de procedimientos racionales utilizados para alcanzar los objetivos que rigen una investigación científica. En este estudio se adoptó un enfoque mixto, con entrevistas semiestructuradas y un cuestionario cerrado.', ['Definición de manual', 'Registro impersonal'], 'Definición genérica seguida de una descripción concreta del diseño; mezcla de patrones.'],
  [12, 'El aula no cambió de golpe. Cambió el tiempo que los estudiantes dedicaban a releer sus propios borradores, y eso sí lo medimos: pasó de once minutos de media a casi veinte.', ['Variación estilística natural'], 'Ritmo irregular y dato propio; sin fórmulas de IA.'],
  [81, 'En el contexto actual, resulta fundamental comprender que la integración de herramientas digitales constituye un factor determinante para la mejora de la calidad educativa. En este sentido, es necesario promover estrategias que garanticen un uso ético y responsable.', ['Fuerte presencia de fórmulas de IA', 'Cadencia uniforme'], 'Apertura y cierre de manual («en el contexto actual», «en este sentido») con vocabulario abstracto.'],
  [35, 'Queda pendiente una pregunta incómoda. Si la herramienta mejora los textos pero no a quienes los escriben, ¿qué estamos evaluando exactamente? La UNESCO plantea algo parecido en su guía de 2023, aunque con más cautela.', ['Pregunta retórica'], 'Mayormente humano; la referencia institucional final es convencional.'],
];
const originalText = PARAS.map((p) => p[1]).join('\n\n');

const analysis = {
  id: 'a2', title: 'Marco teórico — capítulo 2', type: 'TEXT',
  originalText,
  improvedText: null, aiScore: 61, similarityScore: 24, improvedAiScore: null, improvedSimilarityScore: null,
  overallIndicators: ['Fuerte presencia de fórmulas de IA', 'Cadencia uniforme', 'Variación estilística natural'],
  summaryExplanation: 'Se identificaron secciones equilibradas con alternancia entre estructuras convencionales y variaciones expresivas naturales.',
  legalDisclaimer: 'Aviso: estimación probabilística.', similarityDisclaimer: 'Una coincidencia no implica plagio.',
  paragraphs: PARAS.map(([aiScore, text, indicators, explanation], index) => ({ index, text, aiScore, indicators, explanation })),
  sources: [
    { id: 's1', url: 'https://es.wikipedia.org/wiki/Inteligencia_artificial', title: 'Wikipedia: Inteligencia Artificial y Aprendizaje Automático', matchedText: 'La inteligencia artificial es un campo de la informática que enfatiza la creación de máquinas inteligentes…', userSnippet: 'la inteligencia artificial desempeña un papel fundamental en la transformación…', similarityPercentage: 16 },
    { id: 's2', url: 'https://dialnet.unirioja.es/', title: 'Dialnet: Metodología de la Investigación Científica', matchedText: 'La metodología de la investigación comprende el conjunto de procedimientos racionales utilizados para alcanzar los objetivos…', userSnippet: 'La metodología de la investigación comprende el conjunto de procedimientos racionales…', similarityPercentage: 31 },
    { id: 's3', url: 'https://www.redalyc.org/', title: 'Redalyc: Sistemas de tutoría inteligente en educación superior', matchedText: 'Los sistemas de tutoría inteligente ofrecen una experiencia de aprendizaje personalizada y adaptativa al ritmo de cada estudiante…', userSnippet: 'los sistemas de tutoría inteligente ofrecen una experiencia de aprendizaje personalizada y adaptativa…', similarityPercentage: 38 },
    { id: 's4', url: 'https://scielo.org/', title: 'SciELO: Tecnologías digitales y calidad educativa', matchedText: 'La integración de herramientas digitales constituye un factor determinante para la calidad de la educación…', userSnippet: 'la integración de herramientas digitales constituye un factor determinante para la mejora…', similarityPercentage: 12 },
    { id: 's5', url: 'https://www.unesco.org/', title: 'UNESCO: Guía para la IA generativa en la educación', matchedText: 'La guía de 2023 plantea un enfoque centrado en las personas para el uso de la IA generativa…', userSnippet: 'La UNESCO plantea algo parecido en su guía de 2023…', similarityPercentage: 5 },
  ],
  createdAt: '2026-09-12T11:05:00Z',
};

// Versión humanizada de muestra: reescribe las oraciones con fórmulas de IA
const REWRITES = [
  ['En conclusión, es crucial destacar que la inteligencia artificial desempeña un papel fundamental en la transformación del sector educativo contemporáneo.', 'La inteligencia artificial ya está cambiando la educación, y no siempre por donde se esperaba.'],
  ['Asimismo, cabe señalar que su implementación requiere un enfoque integral.', 'Implantarla bien exige mirar el conjunto.'],
  ['Es importante mencionar que los sistemas de tutoría inteligente ofrecen una experiencia de aprendizaje personalizada y adaptativa.', 'Los tutores inteligentes adaptan el ritmo a cada estudiante.'],
  ['De igual manera, estos sistemas permiten optimizar los procesos de evaluación y retroalimentación.', 'También devuelven correcciones en minutos, cuando antes tardaban semanas.'],
  ['Por consiguiente, su adopción representa una oportunidad significativa para las instituciones.', 'Para una universidad con grupos de sesenta alumnos, eso no es poca cosa.'],
  ['En el contexto actual, resulta fundamental comprender que la integración de herramientas digitales constituye un factor determinante para la mejora de la calidad educativa.', 'Integrar herramientas digitales influye en la calidad educativa, pero no por sí solo.'],
  ['En este sentido, es necesario promover estrategias que garanticen un uso ético y responsable.', 'Hace falta acordar antes para qué se usan y para qué no.'],
];
const improvedText = REWRITES.reduce((t, [a, b]) => t.replace(a, b), originalText);

const users = [
  { id: 'u-admin', name: 'Administradora', last_name: 'Sistema', fullName: 'Administradora Sistema', email: 'admin@plagelio.com', role: 'ADMIN', is_active: true, is_premium: true, premium_since: '2026-01-10', totalAnalyses: 9, dailyAnalysisCount: 0, lastAccess: '2026-09-15', createdAt: '2025-11-02' },
  { id: 'u-demo', name: 'Carlos', last_name: 'Mendoza', fullName: 'Carlos Mendoza', email: 'usuario@plagelio.com', role: 'USER', is_active: true, is_premium: false, premium_since: null, totalAnalyses: 6, dailyAnalysisCount: 2, lastAccess: '2026-09-14', createdAt: '2026-03-14' },
  { id: 'u-3', name: 'Lucía', last_name: 'Ferrer', fullName: 'Lucía Ferrer', email: 'lucia@universidad.edu', role: 'USER', is_active: true, is_premium: true, premium_since: '2026-06-01', totalAnalyses: 31, dailyAnalysisCount: 4, lastAccess: '2026-09-15', createdAt: '2026-04-22' },
  { id: 'u-4', name: 'Tomás', last_name: 'Ibáñez', fullName: 'Tomás Ibáñez', email: 'tomas@correo.com', role: 'USER', is_active: false, is_premium: false, premium_since: null, totalAnalyses: 2, dailyAnalysisCount: 0, lastAccess: '2026-07-01', createdAt: '2026-06-30' },
];

const json = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS' }); res.end(JSON.stringify(body)); };

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x'); const p = url.pathname;
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (p === '/api/auth/login') { let b = ''; req.on('data', (c) => (b += c)); return req.on('end', () => { const { email } = JSON.parse(b || '{}'); current = email?.includes('admin') ? admin : demo; json(res, 200, { success: true, token: 'mock-token', user: current }); }); }
  if (p === '/api/auth/me') return json(res, 200, { success: true, user: current });
  if (p === '/api/analyses/history') return json(res, 200, { success: true, analyses: history });
  if (p.startsWith('/api/analyses/')) return json(res, 200, { success: true, analysis });
  if (p === '/api/users/stats') return json(res, 200, { success: true, stats: { totalUsers: 4, premiumUsers: 2, freeUsers: 2, totalAnalyses: 48, analysesToday: 7, recentUsers: [] } });
  if (p === '/api/users') return json(res, 200, { success: true, users });
  if (p === '/api/payments/sandbox-init') return json(res, 200, { success: true, transaction: { transactionId: 'sbx_mock', amount: 2 }, testInstructions: {} });
  if (p === '/api/payments/sandbox-confirm') return json(res, 200, { success: true, message: 'ok', isPremium: true });
  if (p === '/api/writing/improve') return json(res, 200, { success: true, originalText, improvedText, summaryOfChanges: ['Eliminación de fórmulas de IA', 'Ruptura de cadencia simétrica', 'Preservación de citas'], originalAiScore: 61, improvedAiScore: 9, aiReduction: 52, notice: '' });
  json(res, 404, { success: false, message: 'mock: ruta no simulada ' + p });
}).listen(5000, () => console.log('mock api en http://localhost:5000/api'));
