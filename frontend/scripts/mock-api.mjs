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

const analysis = {
  id: 'a2', title: 'Marco teórico — capítulo 2', type: 'TEXT',
  originalText: 'En conclusión, es crucial destacar que la inteligencia artificial desempeña un papel fundamental en la transformación del sector educativo contemporáneo. Asimismo, cabe señalar que su implementación requiere un enfoque integral.\n\nLos datos recogidos durante el trabajo de campo (Mendoza, 2024) sugieren una correlación que el marco teórico previo no había anticipado.\n\nLlegué a esta pregunta por accidente. Revisaba actas de 1987 buscando otra cosa y el nombre apareció tres veces en una misma página. No podía ser casualidad.',
  improvedText: null, aiScore: 61, similarityScore: 24, improvedAiScore: null, improvedSimilarityScore: null,
  overallIndicators: ['Fuerte presencia de fórmulas de IA', 'Cadencia uniforme', 'Variación estilística natural'],
  summaryExplanation: 'Se identificaron secciones equilibradas con alternancia entre estructuras convencionales y variaciones expresivas naturales.',
  legalDisclaimer: 'Aviso: estimación probabilística.', similarityDisclaimer: 'Una coincidencia no implica plagio.',
  paragraphs: [
    { index: 0, text: 'En conclusión, es crucial destacar que la inteligencia artificial desempeña un papel fundamental en la transformación del sector educativo contemporáneo. Asimismo, cabe señalar que su implementación requiere un enfoque integral.', aiScore: 87, indicators: ['Fuerte presencia de fórmulas de IA', 'Cadencia uniforme', 'Simetría estructural sintética'], explanation: 'Presenta una alta concentración de giros de IA (4 detectados) y simetría cadencial típica de modelos generativos.' },
    { index: 1, text: 'Los datos recogidos durante el trabajo de campo (Mendoza, 2024) sugieren una correlación que el marco teórico previo no había anticipado.', aiScore: 46, indicators: ['Conector formal reiterado'], explanation: 'Muestra características híbridas: cierta uniformidad estructural combinada con modulaciones de ritmo de redacción humana.' },
    { index: 2, text: 'Llegué a esta pregunta por accidente. Revisaba actas de 1987 buscando otra cosa y el nombre apareció tres veces en una misma página. No podía ser casualidad.', aiScore: 9, indicators: ['Variación estilística natural'], explanation: 'Estructura orgánica con alternancia rítmica marcada, ausencia de muletillas de IA y rica variedad léxica propia de la redacción humana.' },
  ],
  sources: [
    { id: 's1', url: 'https://es.wikipedia.org/wiki/Inteligencia_artificial', title: 'Wikipedia: Inteligencia Artificial y Aprendizaje Automático', matchedText: 'La inteligencia artificial es un campo de la informática que enfatiza la creación de máquinas inteligentes…', userSnippet: 'la inteligencia artificial desempeña un papel fundamental en la transformación…', similarityPercentage: 16 },
    { id: 's2', url: 'https://dialnet.unirioja.es/', title: 'Dialnet: Metodología de la Investigación Científica', matchedText: 'La metodología de la investigación comprende el conjunto de procedimientos racionales…', userSnippet: 'Los datos recogidos durante el trabajo de campo sugieren una correlación…', similarityPercentage: 8 },
  ],
  createdAt: '2026-09-12T11:05:00Z',
};

const users = [
  { id: 'u-admin', name: 'Administradora', last_name: 'Sistema', fullName: 'Administradora Sistema', email: 'admin@plagelio.com', role: 'ADMIN', is_active: true, is_premium: true, premium_since: '2026-01-10', totalAnalyses: 9, dailyAnalysisCount: 0, lastAccess: '2026-09-15', createdAt: '2025-11-02' },
  { id: 'u-demo', name: 'Carlos', last_name: 'Mendoza', fullName: 'Carlos Mendoza', email: 'usuario@plagelio.com', role: 'USER', is_active: true, is_premium: false, premium_since: null, totalAnalyses: 6, dailyAnalysisCount: 2, lastAccess: '2026-09-14', createdAt: '2026-03-14' },
  { id: 'u-3', name: 'Lucía', last_name: 'Ferrer', fullName: 'Lucía Ferrer', email: 'lucia@universidad.edu', role: 'USER', is_active: true, is_premium: true, premium_since: '2026-06-01', totalAnalyses: 31, dailyAnalysisCount: 4, lastAccess: '2026-09-15', createdAt: '2026-04-22' },
  { id: 'u-4', name: 'Tomás', last_name: 'Ibáñez', fullName: 'Tomás Ibáñez', email: 'tomas@correo.com', role: 'USER', is_active: false, is_premium: false, premium_since: null, totalAnalyses: 2, dailyAnalysisCount: 0, lastAccess: '2026-07-01', createdAt: '2026-06-30' },
];

const json = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS' }); res.end(JSON.stringify(body)); };

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
  if (p === '/api/writing/improve') return json(res, 200, { success: true, originalText: analysis.originalText, improvedText: analysis.originalText.replace('En conclusión, es crucial destacar que', 'En definitiva, conviene reparar en que').replace('Asimismo, cabe señalar que', 'A su vez, importa advertir que'), summaryOfChanges: ['Eliminación de fórmulas de IA', 'Ruptura de cadencia simétrica', 'Preservación de citas'], originalAiScore: 61, improvedAiScore: 9, aiReduction: 52, notice: '' });
  json(res, 404, { success: false, message: 'mock: ruta no simulada ' + p });
}).listen(5000, () => console.log('mock api en http://localhost:5000/api'));
