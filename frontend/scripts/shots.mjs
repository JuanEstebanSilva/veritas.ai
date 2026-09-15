/**
 * Capturas de todas las rutas a 1440 y 390 px con Chromium (Playwright).
 * Requiere Vite en :5173 y el API simulado en :5000.
 *   node scripts/shots.mjs [dir-salida]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const out = process.argv[2] || 'shots';
mkdirSync(out, { recursive: true });
const base = 'http://localhost:5173';
const routes = [
  ['landing', '/', false], ['login', '/login', false], ['register', '/register', false],
  ['dashboard', '/dashboard', true], ['analyzer', '/analyzer', true], ['analyzer-result', '/analyzer?id=a2', true],
  ['history', '/history', true], ['admin', '/admin', 'admin'],
];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
for (const [w, h, tag] of [[1440, 900, 'desktop'], [390, 844, 'mobile']]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
  for (const [name, path, auth] of routes) {
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    if (auth) {
      await page.goto(base + '/login', { waitUntil: 'networkidle' });
      await page.evaluate(() => localStorage.setItem('veritas_token', 'mock-token'));
      // El mock elige el usuario por el último login; para admin, hacemos login con su correo
      await page.evaluate(async (isAdmin) => { await fetch('http://localhost:5000/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: isAdmin ? 'admin@veritas.ai' : 'usuario@veritas.ai', password: 'x' }) }); }, auth === 'admin');
    }
    await page.goto(base + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `${out}/${name}-${tag}.png`, fullPage: true });
    if (name === 'landing' && tag === 'desktop') {
      // Estados del escáner al hacer scroll
      for (const [pct, label] of [[0.18, 'scan-1'], [0.27, 'scan-2'], [0.36, 'scan-3'], [0.62, 'readings'], [0.78, 'before-after']]) {
        await page.evaluate((f) => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f), pct);
        await page.waitForTimeout(900);
        await page.screenshot({ path: `${out}/landing-${label}.png` });
      }
    }
    console.log(`${name.padEnd(16)} ${tag.padEnd(8)} ${errors.length ? 'ERRORES: ' + errors.join(' | ').slice(0, 300) : 'ok'}`);
    await page.close();
  }
  await ctx.close();
}
await browser.close();
