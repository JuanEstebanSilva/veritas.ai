import React, { useLayoutEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sound } from '../utils/soundEffects';
import { gsap, ScrollTrigger, EASE, prefersReducedMotion, isNarrow, useReveal } from '../motion';
import { ArrowRight, Check, Info, BarChart3, Search, PenLine } from 'lucide-react';

/* ────────────────────────────────────────────────────────────────
   Datos de muestra del escáner. Nueve párrafos con su veredicto:
   la narrativa pasa por humano → mixto → IA → humano para enseñar
   los tres estados en un mismo documento.
   ──────────────────────────────────────────────────────────────── */
type Tone = 'human' | 'mixed' | 'ai';
const PARAS: { tone: Tone; score: number; lines: number[] }[] = [
  { tone: 'human', score: 8,  lines: [100, 94, 97, 62] },
  { tone: 'human', score: 12, lines: [98, 100, 71] },
  { tone: 'mixed', score: 46, lines: [100, 96, 99, 100, 58] },
  { tone: 'ai',    score: 87, lines: [100, 100, 100, 100, 84] },
  { tone: 'ai',    score: 91, lines: [100, 99, 100, 76] },
  { tone: 'mixed', score: 52, lines: [97, 100, 66] },
  { tone: 'human', score: 9,  lines: [100, 89, 100, 95, 41] },
  { tone: 'human', score: 6,  lines: [96, 100, 73] },
  { tone: 'human', score: 11, lines: [100, 98, 100, 54] },
];

const METRICS = [
  { key: 'perplejidad', label: 'Perplejidad léxica', value: 82.4, decimals: 1, unit: ' / 100', width: 82.4, tone: 'human' as Tone, note: 'Vocabulario variado y poco predecible' },
  { key: 'burstiness',  label: 'Burstiness · cadencia', value: 0.78, decimals: 2, unit: ' σ 7.9', width: 78, tone: 'human' as Tone, note: 'Longitud de oración orgánica, no uniforme' },
  { key: 'similitud',   label: 'Similitud cotejada', value: 11, decimals: 0, unit: '% · 14 citas', width: 11, tone: 'azure' as 'azure', note: 'Todas atribuidas en formato APA 7' },
];

const BEFORE = '«En conclusión, es crucial destacar que la inteligencia artificial desempeña un papel fundamental en la transformación del sector educativo contemporáneo. Asimismo, cabe señalar que su implementación requiere un enfoque integral.»';
const AFTER  = '«En definitiva, conviene reparar en que la inteligencia artificial resulta determinante en la transformación del sector educativo contemporáneo. A su vez, importa advertir que su implementación requiere un enfoque integral.»';

const readVar = (root: HTMLElement, name: string) =>
  getComputedStyle(root).getPropertyValue(name).trim().replace(/\s+/g, ',');
const rgba = (triplet: string, a: number) => `rgba(${triplet},${a})`;

export const LandingPage: React.FC = () => {
  const { isAuthenticated, openPremiumModal } = useAuth();
  const navigate = useNavigate();
  const root = useRef<HTMLDivElement>(null);
  const revealRef = useReveal<HTMLDivElement>();
  const revealRef2 = useReveal<HTMLDivElement>();

  const handleStart = () => { sound.playClick(); navigate(isAuthenticated ? '/analyzer' : '/register'); };
  const handlePremium = () => { sound.playClick(); if (isAuthenticated) openPremiumModal(); else navigate('/register'); };

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = gsap.utils.selector(el);
    const staticMode = prefersReducedMotion() || isNarrow();
    const colors: Record<string, string> = {
      human: readVar(el, '--human'), mixed: readVar(el, '--mixed'), ai: readVar(el, '--ai'),
      azure: readVar(el, '--azure'), hair: readVar(el, '--hair'),
      ground: readVar(el, '--ground'), base: readVar(el, '--base'),
    };

    const ctx = gsap.context(() => {
      /* ── barra de progreso ─────────────────────────────────── */
      gsap.to(q('[data-progress]'), { scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: 0.3 } });

      if (staticMode) {
        // Estado final en todas las piezas coreografiadas; nada depende del scroll.
        gsap.set(q('[data-line]'), { backgroundColor: (i, t) => rgba(colors[(t as HTMLElement).dataset.tone || 'human'], 0.55) });
        gsap.set(q('[data-para-score]'), { opacity: 1 });
        gsap.set(q('[data-metric]'), { opacity: 1, y: 0 });
        gsap.set(q('[data-bar]'), { scaleX: (i, t) => Number((t as HTMLElement).dataset.w) / 100 });
        q('[data-count]').forEach((n) => { const h = n as HTMLElement; h.textContent = Number(h.dataset.count).toFixed(Number(h.dataset.decimals || 0)); });
        gsap.set(q('[data-grade],[data-status],[data-beam]'), { opacity: 1 });
        const hc = q('[data-human-count]')[0] as HTMLElement | undefined;
        if (hc) hc.textContent = '96.4';
        gsap.set(q('[data-beam]'), { top: '104%', opacity: 0 });
        gsap.set(q('[data-chapter]'), { opacity: 1, y: 0, position: 'relative' });
        gsap.set(q('[data-after]'), { opacity: 1 });
        gsap.set(q('[data-before]'), { opacity: 1 });
        const ba = q('[data-ba-score]')[0] as HTMLElement | undefined;
        if (ba) { ba.textContent = '9'; ba.style.color = `rgb(${colors.human})`; }
        return;
      }

      /* ── parallax de atmósfera ─────────────────────────────── */
      [['[data-glow="1"]', 0.16], ['[data-glow="2"]', -0.09], ['[data-glow="3"]', 0.05]].forEach(([sel, f]) => {
        gsap.to(q(sel as string), { y: () => window.innerHeight * 2 * (f as number), ease: 'none',
          scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: true } });
      });

      /* ── el héroe se aleja ─────────────────────────────────── */
      gsap.to(q('[data-hero-inner]'), { opacity: 0, scale: 0.93, y: -30, filter: 'blur(7px)', ease: 'none',
        scrollTrigger: { trigger: q('[data-hero]')[0], start: 'top top', end: 'bottom 30%', scrub: true } });

      /* ── fondo por capítulos ───────────────────────────────── */
      const tint = (sel: string, color: string) => ScrollTrigger.create({
        trigger: q(sel)[0], start: 'top 55%', end: 'bottom 45%',
        onToggle: (self) => { if (self.isActive) gsap.to(el, { backgroundColor: `rgb(${color})`, duration: 0.9, ease: EASE }); },
      });
      tint('[data-hero]', colors.ground);
      tint('[data-scanner]', colors.base);
      tint('[data-honesty]', colors.ground);
      tint('[data-readings]', colors.base);
      tint('[data-ba]', colors.ground);

      /* ── EL ESCÁNER: capítulo fijado ───────────────────────── */
      {
        const section = q('[data-scanner]')[0] as HTMLElement;
        const pin = q('[data-scanner-pin]')[0] as HTMLElement;
        const doc = q('[data-doc]')[0] as HTMLElement;
        const beam = q('[data-beam]')[0] as HTMLElement;
        const paras = q('[data-para]') as HTMLElement[];
        const metrics = q('[data-metric]') as HTMLElement[];
        const tl = gsap.timeline({ defaults: { ease: 'none' } });

        tl.fromTo(doc, { y: 46, opacity: 0.35 }, { y: 0, opacity: 1, duration: 1 }, 0);
        tl.fromTo(q('[data-panel]'), { y: 30, opacity: 0.5 }, { y: 0, opacity: 1, duration: 1 }, 0);
        tl.fromTo(beam, { top: '-6%', opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.8);
        tl.to(beam, { top: '104%', duration: 7 }, 1);

        const docH = doc.offsetHeight || 1;
        paras.forEach((p) => {
          const tone = p.dataset.tone || 'human';
          const at = 1 + 7 * ((p.offsetTop + p.offsetHeight / 2) / docH);
          tl.to(p.querySelectorAll('[data-line]'), { backgroundColor: rgba(colors[tone], 0.55), duration: 0.35, stagger: 0.04 }, at);
          tl.fromTo(p.querySelector('[data-para-score]'), { opacity: 0, x: 8 }, { opacity: 1, x: 0, duration: 0.3 }, at + 0.05);
        });

        metrics.forEach((m, i) => {
          const at = [2.6, 5.0, 7.4][i];
          const bar = m.querySelector('[data-bar]') as HTMLElement;
          const counter = m.querySelector('[data-count]') as HTMLElement;
          const target = Number(counter.dataset.count); const dec = Number(counter.dataset.decimals || 0);
          const obj = { n: 0 };
          tl.fromTo(m, { opacity: 0.3, y: 10 }, { opacity: 1, y: 0, duration: 0.5 }, at);
          tl.to(bar, { scaleX: Number(bar.dataset.w) / 100, duration: 0.8 }, at + 0.1);
          tl.to(obj, { n: target, duration: 0.9, onUpdate: () => { counter.textContent = obj.n.toFixed(dec); } }, at + 0.1);
        });

        const human = q('[data-human-count]')[0] as HTMLElement;
        const hObj = { n: 0 };
        tl.to(hObj, { n: 96.4, duration: 1, onUpdate: () => { human.textContent = hObj.n.toFixed(1); } }, 8.2);
        tl.fromTo(q('[data-grade]'), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5 }, 8.6);
        tl.fromTo(q('[data-status]'), { opacity: 0 }, { opacity: 1, duration: 0.3 }, 8.8);
        tl.to({}, { duration: 0.6 });

        ScrollTrigger.create({ trigger: section, pin, start: 'top top', end: 'bottom bottom', scrub: 0.6, animation: tl, anticipatePin: 1 });
      }

      /* ── TRES LECTURAS: titular fijado, capítulos que pasan ── */
      {
        const section = q('[data-readings]')[0] as HTMLElement;
        const pin = q('[data-readings-pin]')[0] as HTMLElement;
        const chapters = q('[data-chapter]') as HTMLElement[];
        const glow = q('[data-readings-glow]')[0] as HTMLElement;
        const tl = gsap.timeline({ defaults: { ease: 'none' } });
        gsap.set(chapters, { position: 'absolute', inset: 0 });
        chapters.forEach((c, i) => {
          const tone = c.dataset.tone || 'azure';
          if (i === 0) { gsap.set(c, { opacity: 1, y: 0 }); tl.to(glow, { backgroundColor: rgba(colors[tone], 0.14), duration: 0.5 }, 0); return; }
          const at = i * 1.4;
          tl.to(chapters[i - 1], { opacity: 0, y: -28, duration: 0.5 }, at);
          tl.fromTo(c, { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 0.6 }, at + 0.15);
          tl.to(glow, { backgroundColor: rgba(colors[tone], 0.14), duration: 0.6 }, at);
        });
        tl.to({}, { duration: 0.8 });
        ScrollTrigger.create({ trigger: section, pin, start: 'top top', end: 'bottom bottom', scrub: 0.5, animation: tl, anticipatePin: 1 });
      }

      /* ── ANTES Y DESPUÉS: el momento de la reescritura ─────── */
      {
        const section = q('[data-ba]')[0] as HTMLElement;
        const pin = q('[data-ba-pin]')[0] as HTMLElement;
        const before = q('[data-before]')[0] as HTMLElement;
        const after = q('[data-after]')[0] as HTMLElement;
        const score = q('[data-ba-score]')[0] as HTMLElement;
        const changes = q('[data-change]') as HTMLElement[];
        const obj = { n: 87 };
        const tl = gsap.timeline({ defaults: { ease: 'none' } });
        gsap.set(after, { position: 'absolute', inset: 0, opacity: 0 });
        tl.to({}, { duration: 0.8 });
        tl.to(before, { opacity: 0, y: -14, filter: 'blur(6px)', duration: 0.8 }, 0.8);
        tl.to(after, { opacity: 1, duration: 0.8 }, 1.1);
        tl.to(obj, { n: 9, duration: 1.4, onUpdate: () => { score.textContent = Math.round(obj.n).toString(); } }, 0.9);
        tl.to(score, { color: `rgb(${colors.human})`, duration: 1.2 }, 1.0);
        tl.fromTo(changes, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.25 }, 1.6);
        tl.to({}, { duration: 0.6 });
        ScrollTrigger.create({ trigger: section, pin, start: 'top top', end: 'bottom bottom', scrub: 0.6, animation: tl, anticipatePin: 1 });
      }

      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    }, el);

    return () => ctx.revert();
  }, []);

  const staticLayout = prefersReducedMotion() || isNarrow();
  const pinH = staticLayout ? '' : 'h-screen';
  const tall = (vh: number): React.CSSProperties => (staticLayout ? {} : { height: `${vh}vh` });

  return (
    <div ref={root} className="relative overflow-hidden bg-ground transition-colors">
      {/* barra de progreso de lectura */}
      <div data-progress className="fixed top-0 left-0 right-0 h-[2px] z-50 origin-left scale-x-0 bg-gradient-to-r from-azure to-[#8ad6ff]" aria-hidden="true" />

      {/* atmósfera */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div data-glow="1" className="glow" style={{ width: 1100, height: 900, top: -420, left: -240, background: 'rgb(var(--azure) / .16)' }} />
        <div data-glow="2" className="glow" style={{ width: 820, height: 720, top: '120vh', right: -320, background: 'rgb(var(--gold) / .09)' }} />
        <div data-glow="3" className="glow" style={{ width: 960, height: 800, top: '260vh', left: -280, background: 'rgb(var(--human) / .07)' }} />
      </div>

      {/* ═══════════ HÉROE ═══════════ */}
      <section data-hero className="relative z-[2] pt-28 pb-20 sm:pt-36 sm:pb-28 text-center">
        <div data-hero-inner className="wrap flex flex-col items-center will-change-transform">
          <div className="flex items-center gap-4 sm:gap-5 animate-rise" style={{ animationDelay: '.05s' }}>
            <span className="h-px w-8 sm:w-14 bg-gradient-to-r from-transparent to-[rgb(var(--hair)/var(--hair-a2))]" />
            <span className="eyebrow text-mid">Protocolo de integridad académica</span>
            <span className="h-px w-8 sm:w-14 bg-gradient-to-l from-transparent to-[rgb(var(--hair)/var(--hair-a2))]" />
          </div>

          <h1 className="text-d-1 font-light mt-9 animate-rise" style={{ animationDelay: '.16s' }}>
            Distingue lo escrito<br />
            <span className="serif text-azure tracking-[-0.02em]">de lo generado.</span>
          </h1>

          <p className="mt-9 max-w-[640px] text-[17px] sm:text-[19px] leading-[1.65] text-mid animate-rise" style={{ animationDelay: '.3s' }}>
            Veritas mide la perplejidad y el <em className="not-italic text-hi">burstiness</em> de cada párrafo, coteja su
            similitud contra fuentes abiertas y reescribe el estilo sin tocar tus citas. Texto plano y documentos{' '}
            <strong className="font-semibold text-hi">.docx</strong>.
          </p>

          <div className="mt-11 flex flex-wrap items-center justify-center gap-3.5 animate-rise" style={{ animationDelay: '.42s' }}>
            <button type="button" onClick={handleStart} className="btn btn-primary">
              Iniciar verificación <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </button>
            <Link to="/login" onClick={() => sound.playClick()} className="btn btn-ghost">Acceder al sistema</Link>
          </div>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] font-medium text-low animate-rise" style={{ animationDelay: '.54s' }}>
            <span>5 análisis diarios sin costo</span>
            <span className="hidden sm:block h-[3px] w-[3px] rounded-full bg-low" />
            <span>Licencia vitalicia por $2</span>
            <span className="hidden sm:block h-[3px] w-[3px] rounded-full bg-low" />
            <span>Sin almacenamiento de propiedad intelectual</span>
          </div>
        </div>
      </section>

      {/* ═══════════ EL ESCÁNER ═══════════ */}
      <section data-scanner className="relative z-[2]" style={tall(320)}>
        <div data-scanner-pin className={`${pinH} flex items-center py-16 md:py-0`}>
          <div className="wrap w-full">
            <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-12 items-center [&>*]:min-w-0">
              {/* documento */}
              <div data-doc className="relative rounded-[6px] bg-surface border hair-2 shadow-panel overflow-hidden px-8 sm:px-12 py-10 sm:py-12" style={{ aspectRatio: '1 / 1.18' }}>
                <div data-beam className="absolute left-0 right-0 h-[18%] pointer-events-none z-[2] opacity-0"
                  style={{ top: '-6%', background: 'linear-gradient(180deg, rgb(var(--azure) / 0) 0%, rgb(var(--azure) / .12) 55%, rgb(var(--azure) / .55) 100%)' }} />
                <div className="flex items-center justify-between mb-8">
                  <div className="h-[9px] w-[46%] rounded-sm bg-hair-2" />
                  <span className="font-mono text-[10px] text-low">.docx</span>
                </div>
                <div className="flex flex-col gap-5">
                  {PARAS.map((p, i) => (
                    <div key={i} data-para data-tone={p.tone} className="relative flex flex-col gap-[7px] pr-14">
                      {p.lines.map((w, j) => (
                        <div key={j} data-line data-tone={p.tone} className="h-[6px] rounded-sm bg-hair" style={{ width: `${w}%` }} />
                      ))}
                      <span data-para-score className={`absolute right-0 top-0 num text-[11px] font-medium opacity-0 ${p.tone === 'human' ? 'text-human' : p.tone === 'mixed' ? 'text-mixed' : 'text-ai'}`}>
                        {p.score}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* panel de métricas */}
              <div data-panel className="flex flex-col gap-7">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="eyebrow text-azure">Informe de originalidad</span>
                    <span className="h-[11px] w-px bg-hair-2" />
                    <span data-status className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-human opacity-0">
                      <span className="status-dot" style={{ color: 'rgb(var(--human) / .18)', background: 'rgb(var(--human))' }} />
                      Autenticidad verificada
                    </span>
                  </div>
                  <h2 className="text-d-5 font-semibold break-words">{'Ensayo_Metodologia_Investigacion_2026.docx'.split('_').map((part, i, arr) => (<React.Fragment key={i}>{part}{i < arr.length - 1 && <>_<wbr /></>}</React.Fragment>))}</h2>
                  <span className="font-mono text-xs text-low">4 812 palabras · 26 párrafos · analizado en 1.4 s</span>
                </div>

                <div className="flex items-end gap-6 py-6 border-y hair">
                  <div className="flex flex-col gap-1">
                    <span className="num text-[52px] leading-none text-human"><span data-human-count>0.0</span>%</span>
                    <span className="eyebrow">Índice humano</span>
                  </div>
                  <div className="h-14 w-px bg-hair" />
                  <div data-grade className="flex flex-col gap-1 opacity-0">
                    <span className="serif text-[48px] leading-[.86] text-human">A+</span>
                    <span className="eyebrow">Calificación</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {METRICS.map((m) => (
                    <div key={m.key} data-metric className="card px-5 py-4 flex flex-col gap-2.5">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="eyebrow">{m.label}</span>
                        <span className="num text-[22px] text-hi">
                          <span data-count={m.value} data-decimals={m.decimals}>{(0).toFixed(m.decimals)}</span>
                          <span className="text-[13px] text-low">{m.unit}</span>
                        </span>
                      </div>
                      <div className="h-[3px] rounded-full bg-hair overflow-hidden">
                        <div data-bar data-w={m.width} className={`h-full origin-left scale-x-0 rounded-full ${m.tone === 'azure' ? 'bg-azure' : 'bg-human'}`} />
                      </div>
                      <span className="text-[12.5px] text-low">{m.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div ref={revealRef} className="relative z-[2]">
        {/* ═══════════ HONESTIDAD ═══════════ */}
        <section data-honesty className="wrap py-24 sm:py-32">
          <div data-reveal className="flex items-start gap-5 sm:gap-7 py-9 border-y border-gold/30">
            <Info className="w-6 h-6 text-gold shrink-0 mt-0.5" strokeWidth={1.6} />
            <div className="flex flex-col gap-2.5">
              <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-gold">Una estimación probabilística, no un veredicto.</h3>
              <p className="text-[14.5px] leading-[1.7] text-mid max-w-[900px]">
                El resultado se calcula con patrones estilométricos y sintácticos. No constituye una certeza determinista y
                puede contener falsos positivos o falsos negativos. Una coincidencia textual tampoco implica plagio: puede ser
                una cita legítima, una referencia bibliográfica o terminología técnica de uso corriente.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* ═══════════ TRES LECTURAS ═══════════ */}
      <section data-readings className="relative z-[2]" style={tall(300)}>
        <div data-readings-pin className={`${pinH} relative flex items-center py-16 md:py-0 overflow-hidden`}>
          <div data-readings-glow className="glow" style={{ width: 760, height: 760, right: -260, top: '10%', background: 'rgb(var(--azure) / .14)' }} aria-hidden="true" />
          <div className="wrap w-full grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-16 items-center">
            <div className="flex flex-col gap-6">
              <span className="eyebrow">El método</span>
              <h2 className="text-d-3 font-light">Tres lecturas<br /><span className="serif">de un mismo texto.</span></h2>
              <p className="text-[15px] leading-[1.7] text-mid max-w-[420px]">
                Cada una mide algo distinto y ninguna emite un veredicto binario sobre el documento entero.
              </p>
            </div>

            <div className={`relative ${staticLayout ? 'flex flex-col gap-5' : 'min-h-[360px]'}`}>
              {[
                { tone: 'azure', Icon: BarChart3, title: 'Análisis estilométrico', body: 'Perplejidad, burstiness, riqueza léxica y uniformidad sintáctica, medidos párrafo a párrafo. Cada sección recibe su propia puntuación y los indicadores que la justifican.' },
                { tone: 'gold', Icon: Search, title: 'Cotejo de similitud', body: 'Compara el documento contra repositorios de acceso abierto y muestra los fragmentos coincidentes en paralelo. Separa la cita legítima y la terminología estándar del plagio sin atribución.' },
                { tone: 'human', Icon: PenLine, title: 'Reescritura editorial', body: 'Optimiza la cadencia y el léxico sin distorsionar citas ni alterar el rigor de las fuentes. Las comillas y las referencias quedan intactas. Descarga directa en .docx.' },
              ].map((c, i) => (
                <div key={c.title} data-chapter data-tone={c.tone} className="card px-8 py-9 sm:px-10 sm:py-11 flex flex-col gap-6" style={{ opacity: staticLayout || i === 0 ? 1 : 0 }}>
                  <c.Icon className={`w-8 h-8 ${c.tone === 'azure' ? 'text-azure' : c.tone === 'gold' ? 'text-gold' : 'text-human'}`} strokeWidth={1.4} />
                  <div className="flex items-baseline gap-4">
                    <span className="num text-[13px] text-low">0{i + 1}</span>
                    <h3 className="text-d-5 font-semibold">{c.title}</h3>
                  </div>
                  <p className="text-[15px] leading-[1.72] text-mid">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ ANTES Y DESPUÉS ═══════════ */}
      <section data-ba className="relative z-[2]" style={tall(220)}>
        <div data-ba-pin className={`${pinH} flex items-center py-16 md:py-0`}>
          <div className="wrap w-full flex flex-col gap-10">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="flex flex-col gap-5 max-w-[620px]">
                <span className="eyebrow">Reescritura</span>
                <h2 className="text-d-3 font-light">Misma idea.<br /><span className="serif">Otra voz.</span></h2>
              </div>
              <div className="flex items-baseline gap-3">
                <span data-ba-score className="num text-[72px] sm:text-[96px] leading-none text-ai">87</span>
                <span className="flex flex-col gap-1">
                  <span className="num text-[22px] text-low">%</span>
                  <span className="eyebrow">probabilidad IA</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-8 items-start">
              <div className={`relative ${staticLayout ? 'flex flex-col gap-4' : 'min-h-[220px]'}`}>
                <div data-before className="card px-7 py-7 sm:px-9 sm:py-8 border-l-2 border-l-ai">
                  <span className="eyebrow text-ai block mb-4">Texto original</span>
                  <p className="serif text-[19px] sm:text-[23px] leading-[1.45] text-hi">{BEFORE}</p>
                </div>
                <div data-after className="card px-7 py-7 sm:px-9 sm:py-8 border-l-2 border-l-human" style={{ opacity: staticLayout ? 1 : 0 }}>
                  <span className="eyebrow text-human block mb-4">Reescritura editorial</span>
                  <p className="serif text-[19px] sm:text-[23px] leading-[1.45] text-hi">{AFTER}</p>
                </div>
              </div>

              <ul className="flex flex-col gap-4 lg:pt-2">
                {[
                  'Fórmulas de IA sustituidas por giros propios: «en conclusión» → «en definitiva»',
                  'Conectores sintéticos rotos: «asimismo», «cabe señalar»',
                  'Citas, cifras y terminología especializada intactas',
                ].map((t) => (
                  <li key={t} data-change className="flex items-start gap-3 text-[14.5px] leading-[1.6] text-mid" style={{ opacity: staticLayout ? 1 : 0 }}>
                    <Check className="w-4 h-4 text-human shrink-0 mt-1" strokeWidth={2.2} />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div ref={revealRef2} className="relative z-[2]">
        {/* ═══════════ PRECIOS ═══════════ */}
        <section className="wrap py-24 sm:py-32 flex flex-col gap-14">
          <div data-reveal className="flex flex-col items-center text-center gap-5">
            <span className="eyebrow">Precios</span>
            <h2 className="text-d-3 font-light">Se paga una vez.<br /><span className="serif">Y ya.</span></h2>
            <p className="text-[16px] leading-[1.65] text-mid max-w-[480px]">Sin suscripciones, sin cobros recurrentes, sin plan empresarial oculto.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[920px] w-full mx-auto">
            <div data-reveal className="card card-hover p-9 flex flex-col gap-8">
              <div className="flex flex-col gap-3">
                <span className="eyebrow">Uso estándar</span>
                <div className="flex items-baseline gap-2"><span className="num text-[56px] leading-none">$0</span><span className="text-sm text-low">permanente</span></div>
                <p className="text-[13.5px] text-low">Para consultas puntuales y textos académicos cortos.</p>
              </div>
              <ul className="flex flex-col gap-3 text-[14px] text-mid">
                {['5 análisis diarios, con reinicio automático', 'Texto plano y archivos .docx hasta 10 MB', 'Informe completo de perplejidad y similitud', 'Desglose y reescritura párrafo por párrafo'].map((t) => (
                  <li key={t} className="flex items-start gap-3"><Check className="w-4 h-4 text-human shrink-0 mt-0.5" strokeWidth={2.2} /><span>{t}</span></li>
                ))}
              </ul>
              <Link to="/register" onClick={() => sound.playClick()} className="btn btn-ghost w-full">Comenzar sin costo</Link>
            </div>

            <div data-reveal className="relative overflow-hidden p-9 rounded-[18px] border border-azure/30 flex flex-col gap-8"
              style={{ background: 'linear-gradient(165deg, rgb(var(--azure) / .09), rgb(var(--azure) / .015) 55%)', boxShadow: '0 40px 110px -50px rgb(var(--azure) / .5)' }}>
              <div className="absolute -top-36 -right-36 w-80 h-80 rounded-full animate-breathe" style={{ background: 'rgb(var(--azure) / .14)', filter: 'blur(80px)' }} aria-hidden="true" />
              <div className="relative flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="eyebrow text-azure">Licencia vitalicia</span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-azure">Pago único</span>
                </div>
                <div className="flex items-baseline gap-2"><span className="num text-[56px] leading-none">$2</span><span className="text-sm text-mid">USD, de por vida</span></div>
                <p className="text-[13.5px] text-mid">Desbloqueo permanente. Sin renovaciones.</p>
              </div>
              <ul className="relative flex flex-col gap-3 text-[14px] text-mid">
                {['Análisis ilimitados, sin cuota diaria', 'Prioridad en tesis y documentos extensos', 'Descargas ilimitadas del documento mejorado', 'Historial permanente de verificaciones'].map((t) => (
                  <li key={t} className="flex items-start gap-3"><Check className="w-4 h-4 text-azure shrink-0 mt-0.5" strokeWidth={2.2} /><span>{t}</span></li>
                ))}
              </ul>
              <button type="button" onClick={handlePremium} className="btn btn-primary w-full relative">Adquirir licencia vitalicia</button>
            </div>
          </div>
        </section>

        {/* ═══════════ CIERRE ═══════════ */}
        <section className="wrap pb-28 sm:pb-36 flex flex-col items-center text-center gap-9">
          <h2 data-reveal className="text-d-2 font-light max-w-[860px]">Pon a prueba<br /><span className="serif text-azure">tu propio texto.</span></h2>
          <p data-reveal className="text-[17px] leading-[1.65] text-mid max-w-[480px]">Cinco análisis al día, sin tarjeta y sin período de prueba que caduque.</p>
          <button data-reveal type="button" onClick={handleStart} className="btn btn-primary">
            Crear cuenta gratis <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </button>
        </section>

        {/* ═══════════ PIE ═══════════ */}
        <footer className="border-t hair bg-ground/70">
          <div className="wrap py-12 flex flex-wrap justify-between gap-10">
            <div className="flex flex-col gap-4 max-w-[340px]">
              <span className="text-[13px] font-extrabold tracking-[0.16em] text-mid">VERITAS <span className="serif text-[16px] text-low">AI</span></span>
              <p className="text-[12.5px] leading-[1.65] text-low">Análisis estilométrico, cotejo de similitud y reescritura editorial para trabajo académico.</p>
              <span className="text-xs text-low">© {new Date().getFullYear()} Veritas AI</span>
            </div>
            <div className="flex gap-12 sm:gap-20">
              <div className="flex flex-col gap-3 text-[13px] text-mid">
                <span className="eyebrow">Producto</span>
                <Link to="/analyzer" className="hover:text-hi transition-colors">Analizador</Link>
                <Link to="/history" className="hover:text-hi transition-colors">Historial</Link>
                <Link to="/register" className="hover:text-hi transition-colors">Crear cuenta</Link>
              </div>
              <div className="flex flex-col gap-3 text-[13px] text-mid">
                <span className="eyebrow">Acceso</span>
                <Link to="/login" className="hover:text-hi transition-colors">Iniciar sesión</Link>
                <button type="button" onClick={handlePremium} className="text-left hover:text-hi transition-colors">Licencia vitalicia</button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
