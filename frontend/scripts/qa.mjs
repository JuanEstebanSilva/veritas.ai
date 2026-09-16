/**
 * Prueba visual y funcional del frontend con Chromium (Playwright).
 *
 * Captura todas las rutas a 1440 y 390 px en tema oscuro y claro, registra
 * errores y avisos de consola, mide el desbordamiento horizontal y recorre
 * los flujos críticos: inicio de sesión por formulario, cambio de tema,
 * cierre de sesión (estabilidad de la página), apertura y cierre del modal
 * de licencia con Escape y el modo de movimiento reducido en la landing.
 *
 * Requiere Vite en :5173 y el backend en :5000 (real, con la semilla, o el
 * simulado: `node scripts/mock-api.mjs`), y `npm i -D playwright`.
 *
 *   node scripts/qa.mjs [dir-salida]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const out = process.argv[2] || 'qa-shots';
mkdirSync(out, { recursive: true });
const base = process.env.QA_BASE || 'http://localhost:5173';
const api = process.env.QA_API || 'http://localhost:5000/api';
const creds = {
  user: ['usuario@plagelio.com', 'User123!Secure*'],
  admin: ['admin@plagelio.com', 'Admin123!Secure*'],
};
const routes = [
  ['landing', '/', null], ['login', '/login', null], ['register', '/register', null],
  ['dashboard', '/dashboard', 'user'], ['analyzer', '/analyzer', 'user'], ['history', '/history', 'user'], ['admin', '/admin', 'admin'],
];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
const report = [];
let failures = 0;

async function loginByApi(page, who) {
  const [email, password] = creds[who];
  const r = await page.request.post(`${api}/auth/login`, { data: { email, password } });
  const j = await r.json();
  await page.goto(base + '/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate((t) => localStorage.setItem('plagelio_token', t), j.token);
}
const collect = (page, logs) => {
  page.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message));
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.type().toUpperCase() + ' ' + m.text().slice(0, 200)); });
};

for (const theme of ['dark', 'light']) {
  for (const [w, h, tag] of [[1440, 900, 'desktop'], [390, 844, 'mobile']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await ctx.addInitScript((t) => { try { localStorage.setItem('plagelio_theme', t); } catch { /* sin almacenamiento */ } }, theme);
    for (const [name, path, auth] of routes) {
      const page = await ctx.newPage();
      const logs = [];
      collect(page, logs);
      if (auth) await loginByApi(page, auth);
      await page.goto(base + path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(900);
      await page.evaluate(async () => { const H = document.documentElement.scrollHeight; for (let y = 0; y < H; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); } window.scrollTo(0, 0); });
      await page.waitForTimeout(600);
      const m = await page.evaluate(() => ({
        overflowX: document.documentElement.scrollWidth - window.innerWidth,
        bodyBg: getComputedStyle(document.body).backgroundColor,
      }));
      await page.screenshot({ path: `${out}/${name}-${theme}-${tag}.png`, fullPage: true });
      const bad = logs.filter((l) => !l.includes('ERR_CERT_AUTHORITY_INVALID'));
      const ok = m.overflowX === 0 && bad.length === 0;
      if (!ok) failures++;
      report.push({ route: name, theme, tag, ...m, logs: [...new Set(bad)] });
      console.log(`${name.padEnd(10)} ${theme.padEnd(5)} ${tag.padEnd(7)} ${ok ? 'ok' : 'REVISAR'} ${m.overflowX ? 'overflowX=' + m.overflowX : ''} ${bad.join(' | ').slice(0, 200)}`);
      await page.close();
    }
    await ctx.close();
  }
}

// Flujos
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const logs = [];
  collect(page, logs);
  await page.goto(base + '/login', { waitUntil: 'networkidle' });
  await page.fill('#login-email', creds.user[0]); await page.fill('#login-password', creds.user[1]);
  await page.click('button[type=submit]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(800);
  await page.click('button[aria-label^="Cambiar a tema"]'); await page.waitForTimeout(700);
  const themeOk = await page.evaluate(() => document.documentElement.getAttribute('data-theme') === 'light' && document.querySelector('meta[name=theme-color]').content === '#f7f7f9');
  await page.click('button[aria-label^="Cambiar a tema"]'); await page.waitForTimeout(700);
  const hasPremium = await page.locator('text=Activar por $2').count();
  let modalOk = true;
  if (hasPremium) {
    await page.click('text=Activar por $2'); await page.waitForTimeout(600);
    const open = await page.locator('[role=dialog]').count();
    await page.keyboard.press('Escape'); await page.waitForTimeout(500);
    modalOk = open === 1 && (await page.locator('[role=dialog]').count()) === 0;
  }
  await page.click('button[aria-label="Cerrar sesión"]'); await page.waitForTimeout(1200);
  // Estabilidad de layout tras el cierre: ni el scroll, ni la altura del documento, ni la cabecera deben oscilar.
  const samples = [];
  for (let i = 0; i < 6; i++) { samples.push(await page.evaluate(() => [window.scrollY, document.documentElement.scrollHeight, document.querySelector('header')?.offsetHeight].join('/'))); await page.waitForTimeout(200); }
  const stable = samples.every((s) => s === samples[0]);
  const url = await page.evaluate(() => location.pathname);
  const bad = logs.filter((l) => !l.includes('ERR_CERT_AUTHORITY_INVALID'));
  const ok = themeOk && modalOk && stable && url === '/login' && bad.length === 0;
  if (!ok) failures++;
  console.log(`flujos     ${ok ? 'ok' : 'REVISAR'} tema=${themeOk} modal=${modalOk} estableTrasLogout=${stable} url=${url} ${bad.join(' | ').slice(0, 200)}`);
  await ctx.close();
}

// Movimiento reducido
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const logs = [];
  collect(page, logs);
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const r = await page.evaluate(() => ({
    pins: document.querySelectorAll('.pin-spacer').length,
    hidden: [...document.querySelectorAll('[data-reveal], .chapter, .sheet-score')].filter((e) => getComputedStyle(e).opacity !== '1').length,
  }));
  const ok = r.pins === 0 && r.hidden === 0 && logs.length === 0;
  if (!ok) failures++;
  console.log(`reducido   ${ok ? 'ok' : 'REVISAR'} pins=${r.pins} ocultos=${r.hidden}`);
  await ctx.close();
}

await browser.close();
console.log(failures ? `\n${failures} comprobaciones a revisar.` : '\nTodo en orden.');
process.exit(failures ? 1 : 0);
