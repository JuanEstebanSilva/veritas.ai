import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sound } from '../utils/soundEffects';
import { gsap, ScrollTrigger, prefersReducedMotion, useReveal, useScrollGroup, usePointerParallax, useMagnetic, CountUp, Odometer, span, easeOut, refreshScroll } from '../motion';
import { ReadingField, Sheet, CadenceInstrument, SimilarityInstrument, RewriteInstrument, WordDiff } from '../components/landing';
import { ArrowRight, ArrowDown, Check, BarChart3, Search, PenLine } from 'lucide-react';
import './landing.css';

/* ────────────────────────────────────────────────────────────────
   Datos de muestra del informe y de la reescritura.
   ──────────────────────────────────────────────────────────────── */
const METRICS = [
  { key: 'perplejidad', label: 'Perplejidad léxica', value: 82.4, decimals: 1, unit: ' / 100', width: 0.824, tone: 'human', at: 0.3, note: 'Vocabulario variado y poco predecible' },
  { key: 'burstiness',  label: 'Burstiness · cadencia', value: 0.78, decimals: 2, unit: ' σ 7.9', width: 0.78, tone: 'human', at: 0.52, note: 'Longitud de oración orgánica, no uniforme' },
  { key: 'similitud',   label: 'Similitud cotejada', value: 11, decimals: 0, unit: '% · 14 citas', width: 0.11, tone: 'azure', at: 0.72, note: 'Todas atribuidas en formato APA 7' },
] as const;

const BEFORE = 'En conclusión, es crucial destacar que la inteligencia artificial desempeña un papel fundamental en la transformación del sector educativo contemporáneo. Asimismo, cabe señalar que su implementación requiere un enfoque integral.';
const AFTER  = 'En definitiva, conviene reparar en que la inteligencia artificial resulta determinante en la transformación del sector educativo contemporáneo. A su vez, importa advertir que su implementación requiere un enfoque integral.';

const READINGS = [
  { tone: 'azure', Icon: BarChart3, title: 'Análisis estilométrico', lead: 'Mide cómo está escrito.', body: 'Perplejidad, burstiness, riqueza léxica y uniformidad sintáctica, párrafo a párrafo. Cada sección recibe su puntuación y los indicadores que la justifican.', Instrument: CadenceInstrument },
  { tone: 'gold', Icon: Search, title: 'Cotejo de similitud', lead: 'Busca de dónde viene.', body: 'Compara el documento con repositorios de acceso abierto y muestra los fragmentos coincidentes en paralelo. Separa la cita legítima y la terminología estándar del plagio sin atribución.', Instrument: SimilarityInstrument },
  { tone: 'human', Icon: PenLine, title: 'Reescritura editorial', lead: 'Cambia la voz, no la idea.', body: 'Rompe la cadencia uniforme y sustituye las fórmulas de IA sin tocar citas, cifras ni referencias. Descarga directa en .docx.', Instrument: RewriteInstrument },
] as const;

const useWide = () => {
  const [wide, setWide] = useState(() => typeof window === 'undefined' || window.innerWidth >= 760);
  useEffect(() => {
    let t = 0;
    const onResize = () => { window.clearTimeout(t); t = window.setTimeout(() => setWide(window.innerWidth >= 760), 160); };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); window.clearTimeout(t); };
  }, []);
  return wide;
};

export const LandingPage: React.FC = () => {
  const wide = useWide();
  const staticLayout = prefersReducedMotion() || !wide;
  // Al cruzar el umbral de anchura se vuelve a montar la coreografía completa.
  return <Landing key={staticLayout ? 'static' : 'motion'} staticLayout={staticLayout} />;
};

const Landing: React.FC<{ staticLayout: boolean }> = ({ staticLayout }) => {
  const { isAuthenticated, openPremiumModal } = useAuth();
  const navigate = useNavigate();

  const root = useScrollGroup<HTMLDivElement>({ scrub: 0.3, staticValue: 0 });
  const reveal = useReveal<HTMLDivElement>();
  const hero = useScrollGroup<HTMLElement>({ scrub: 0.4, start: 'top top', end: 'bottom top', staticValue: 0 });
  const heroParallax = usePointerParallax<HTMLDivElement>();
  const ctaMagnet = useMagnetic<HTMLButtonElement>();
  const closeMagnet = useMagnetic<HTMLButtonElement>();

  // Cifras del informe: el único texto que escribe el JS mientras se hace scroll.
  const counters = useRef<{ el: HTMLElement; target: number; dec: number; at: number }[]>([]);
  const humanCount = useRef<HTMLSpanElement>(null);
  const onScannerProgress = useCallback((p: number) => {
    for (const c of counters.current) c.el.textContent = (c.target * easeOut(span(p, c.at + 0.02, c.at + 0.22))).toFixed(c.dec);
    if (humanCount.current) humanCount.current.textContent = (96.4 * easeOut(span(p, 0.8, 0.96))).toFixed(1);
  }, []);
  const scanner = useScrollGroup<HTMLElement>({ pin: true, scrub: 0.7, onProgress: onScannerProgress });
  const readings = useScrollGroup<HTMLElement>({ pin: true, scrub: 0.6 });

  const [score, setScore] = useState(87);
  const onBaProgress = useCallback((p: number) => {
    const v = Math.round(87 - 78 * easeOut(span(p, 0.18, 0.74)));
    setScore((prev) => (prev === v ? prev : v));
  }, []);
  const ba = useScrollGroup<HTMLElement>({ pin: true, scrub: 0.6, onProgress: onBaProgress });

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    counters.current = Array.from(el.querySelectorAll<HTMLElement>('[data-count]')).map((c) => ({ el: c, target: Number(c.dataset.count), dec: Number(c.dataset.decimals || 0), at: Number(c.dataset.at || 0) }));
    if (staticLayout) {
      counters.current.forEach((c) => { c.el.textContent = c.target.toFixed(c.dec); });
      if (humanCount.current) humanCount.current.textContent = '96.4';
      return;
    }
    // Fondo por capítulo: cada sección declara el suyo; la raíz lo hereda como variable.
    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>('[data-chapter-name]').forEach((sec) => {
        ScrollTrigger.create({
          trigger: sec, start: 'top 58%', end: 'bottom 42%',
          onToggle: (self) => { if (self.isActive) el.dataset.chapter = sec.dataset.chapterName; },
        });
      });
    }, el);
    const refresh = () => refreshScroll();
    document.fonts?.ready.then(refresh);
    window.addEventListener('load', refresh);
    const t = window.setTimeout(refresh, 400);
    return () => { ctx.revert(); window.removeEventListener('load', refresh); window.clearTimeout(t); delete el.dataset.chapter; };
  }, [staticLayout]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = () => { sound.playClick(); navigate(isAuthenticated ? '/analyzer' : '/register'); };
  const handlePremium = () => { sound.playClick(); if (isAuthenticated) openPremiumModal(); else navigate('/register'); };
  const scrollToScanner = () => {
    sound.playClick();
    scanner.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  };

  const tall = (vh: number): React.CSSProperties => (staticLayout ? {} : { height: `${vh}vh` });
  const pin = staticLayout ? 'py-20' : 'pin-screen';

  return (
    <div ref={root} data-scroll-group className="landing relative overflow-x-clip" style={{ ['--p' as string]: 0 }}>
      {/* barra de progreso de lectura */}
      {!staticLayout && <div className="landing-progress fixed top-0 left-0 right-0 h-[2px] z-50 origin-left bg-azure" aria-hidden="true" />}

      <div ref={reveal}>
        {/* ═══════════ HÉROE: el campo de lectura ═══════════ */}
        <section ref={hero} data-scroll-group data-chapter-name="ground" className="relative min-h-[calc(100svh-var(--nav-h))] flex items-center overflow-hidden" style={{ ['--p' as string]: 0 }}>
          <div className="grain" aria-hidden="true" />
          <div ref={heroParallax} className="hero-inner wrap !max-w-[1320px] w-full py-14 sm:py-16 grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-12 lg:gap-6 items-center">
            <div className="hero-copy relative z-[2] flex flex-col items-start gap-8 max-w-[720px]">
              <h1 className="text-d-hero font-light animate-rise" style={{ animationDelay: '.05s', textWrap: 'initial' }}>
                Distingue lo escrito<br />
                <span className="serif text-azure">de lo generado.</span>
              </h1>
              <p className="text-lede text-mid max-w-[520px] animate-rise" style={{ animationDelay: '.18s' }}>
                <span className="lead-in">Un documento, tres lecturas.</span> Plagelio mide la perplejidad y el burstiness de cada párrafo, coteja su similitud contra fuentes abiertas y reescribe el estilo sin tocar tus citas.
              </p>
              <div className="flex flex-wrap items-center gap-3 animate-rise" style={{ animationDelay: '.3s' }}>
                <button ref={ctaMagnet} type="button" onClick={handleStart} className="btn btn-primary">
                  Iniciar verificación <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </button>
                <button type="button" onClick={scrollToScanner} className="btn btn-ghost">
                  Ver cómo lee <ArrowDown className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
            </div>

            <div className="relative h-[52vw] max-h-[420px] min-h-[280px] lg:h-[min(72vh,640px)] lg:max-h-none">
              <div className="hero-field-glow glow" style={{ width: '120%', height: '120%', top: '-10%', left: '-10%', ['--glow-color' as string]: 'rgb(var(--azure) / .18)' }} aria-hidden="true" />
              <div className="hero-field absolute inset-0">
                <ReadingField className="w-full h-full block" />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ CIFRAS ═══════════ */}
        <section className="relative z-[2] wrap py-10 sm:py-14">
          <dl className="grid grid-cols-2 lg:grid-cols-4 border-y hair">
            {[
              { n: 5, label: 'análisis diarios sin costo' },
              { n: 2, prefix: '$', label: 'licencia vitalicia, un solo pago' },
              { n: 0, label: 'documentos usados para entrenar modelos' },
              { n: 3, label: 'lecturas de cada documento' },
            ].map((s, i) => (
              <div key={s.label} data-reveal data-reveal-group="stats" className={`flex flex-col gap-2 py-7 pr-6 ${i % 2 === 1 ? 'pl-6 lg:pl-8' : ''} ${i < 2 ? 'border-b lg:border-b-0' : ''} ${i !== 3 ? 'lg:border-r' : ''} ${i === 0 ? 'border-r' : ''} ${i === 2 ? 'border-r' : ''} hair`}>
                <dd className="num text-[40px] sm:text-[48px] leading-none text-hi"><CountUp value={s.n} prefix={s.prefix} inView /></dd>
                <dt className="text-[13px] leading-[1.45] text-low max-w-[200px]">{s.label}</dt>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {/* ═══════════ EL ESCÁNER: capítulo fijado ═══════════ */}
      <section ref={scanner} data-scroll-group data-chapter-name="base" className="scanner relative z-[2]" style={tall(340)}>
        <div data-pin className={`${pin} relative flex items-center overflow-hidden`}>
          <div className="scanner-glow-ai glow" style={{ width: 900, height: 900, top: '-30%', left: '-20%', ['--glow-color' as string]: 'rgb(var(--ai) / .14)' }} aria-hidden="true" />
          <div className="scanner-glow-human glow" style={{ width: 900, height: 900, top: '-30%', left: '-20%', ['--glow-color' as string]: 'rgb(var(--human) / .14)' }} aria-hidden="true" />
          <div className="wrap w-full">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10 lg:gap-14 items-center [&>*]:min-w-0">
              <div className="relative">
                {!staticLayout && (
                  <p className="scanner-hint absolute -top-10 left-0 text-[13px] text-low inline-flex items-center gap-2"><ArrowDown className="w-3.5 h-3.5" strokeWidth={2} /> Sigue bajando: el informe se escribe mientras lees.</p>
                )}
                <Sheet showBeam={!staticLayout} className="scanner-sheet w-full max-w-[520px] mx-auto lg:mx-0" />
              </div>

              <div className="scanner-panel flex flex-col gap-7">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="eyebrow text-azure">Informe de originalidad</span>
                    <span className="h-[11px] w-px bg-hair-2" />
                    <span className="scanner-status inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-human">
                      <span className="status-dot" style={{ color: 'rgb(var(--human) / .18)', background: 'rgb(var(--human))' }} />
                      Autenticidad verificada
                    </span>
                  </div>
                  <h2 className="text-d-5 font-semibold break-words">Ensayo_Metodologia_<wbr />Investigacion_2026.docx</h2>
                  <span className="font-mono text-xs text-low">4 812 palabras · 26 párrafos · analizado en 1.4 s</span>
                </div>

                <div className="flex items-end gap-6 py-6 border-y hair">
                  <div className="flex flex-col gap-1">
                    <span className="num text-[52px] leading-none text-human"><span ref={humanCount}>0.0</span>%</span>
                    <span className="eyebrow">Índice humano</span>
                  </div>
                  <div className="h-14 w-px bg-hair" />
                  <div className="scanner-grade flex flex-col gap-1">
                    <span className="serif text-[48px] leading-[.86] text-human">A+</span>
                    <span className="eyebrow">Calificación</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {METRICS.map((m) => (
                    <div key={m.key} className="metric card px-5 py-4 flex flex-col gap-2.5" style={{ ['--at' as string]: m.at }}>
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="eyebrow">{m.label}</span>
                        <span className="num text-[22px] text-hi">
                          <span data-count={m.value} data-decimals={m.decimals} data-at={m.at}>{(0).toFixed(m.decimals)}</span>
                          <span className="text-[13px] text-low">{m.unit}</span>
                        </span>
                      </div>
                      <div className="h-[3px] rounded-full bg-hair overflow-hidden">
                        <div className={`metric-bar h-full w-full rounded-full ${m.tone === 'azure' ? 'bg-azure' : 'bg-human'}`} style={{ ['--w' as string]: m.width }} />
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

      {/* ═══════════ LA FRASE ═══════════ */}
      <section data-chapter-name="ground" className="relative z-[2] wrap py-28 sm:py-40">
        <HonestyStatement />
      </section>

      {/* ═══════════ TRES LECTURAS: titular fijado, capítulos que pasan ═══════════ */}
      <section ref={readings} data-scroll-group data-chapter-name="base" className="readings relative z-[2]" style={tall(300)}>
        <div data-pin className={`${pin} relative flex items-center overflow-hidden`}>
          {READINGS.map((r, i) => (
            <div key={r.tone} className="readings-glow glow" data-first={i === 0 ? '' : undefined} data-last={i === READINGS.length - 1 ? '' : undefined}
              style={{ ['--i' as string]: i, width: 900, height: 900, right: '-25%', top: '-20%', ['--glow-color' as string]: `rgb(var(--${r.tone}) / .16)` }} aria-hidden="true" />
          ))}
          <div className="wrap w-full grid grid-cols-1 lg:grid-cols-[.9fr_1.1fr] gap-10 lg:gap-16 items-center">
            <div className="flex flex-col gap-7">
              <h2 className="text-d-3 font-light">Tres lecturas<br /><span className="serif">de un mismo texto.</span></h2>
              <p className="text-[15.5px] leading-[1.7] text-mid max-w-[420px]">
                <span className="lead-in">Cada una mide algo distinto.</span> Ninguna emite un veredicto binario sobre el documento entero.
              </p>
              {!staticLayout && (
                <ol className="relative flex flex-col gap-3 pl-5 mt-2" aria-hidden="true">
                  <span className="absolute left-0 top-0 bottom-0 w-px bg-hair-2" />
                  <span className="rail-mark absolute left-0 top-0 h-1/3 w-px bg-azure" />
                  {READINGS.map((r, i) => (
                    <li key={r.tone} className="rail-label num text-[12px] text-hi" data-first={i === 0 ? '' : undefined} data-last={i === READINGS.length - 1 ? '' : undefined} style={{ ['--i' as string]: i }}>0{i + 1} · {r.title}</li>
                  ))}
                </ol>
              )}
            </div>

            <div className={`relative ${staticLayout ? 'flex flex-col gap-5' : 'min-h-[440px]'}`}>
              {READINGS.map((r, i) => (
                <div key={r.title} className="chapter card px-7 py-7 sm:px-9 sm:py-9 flex flex-col gap-6"
                  data-first={i === 0 ? '' : undefined} data-last={i === READINGS.length - 1 ? '' : undefined} style={{ ['--i' as string]: i }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-baseline gap-4">
                      <span className="num text-[13px] text-low">0{i + 1}</span>
                      <h3 className="text-d-5 font-semibold">{r.title}</h3>
                    </div>
                    <r.Icon className={`w-7 h-7 shrink-0 ${r.tone === 'azure' ? 'text-azure' : r.tone === 'gold' ? 'text-gold' : 'text-human'}`} strokeWidth={1.4} />
                  </div>
                  <div className="rounded-xl border hair bg-ground/40 px-4 py-3"><r.Instrument /></div>
                  <p className="text-[15px] leading-[1.7] text-mid"><span className="lead-in">{r.lead}</span> {r.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ MISMA IDEA, OTRA VOZ ═══════════ */}
      <section ref={ba} data-scroll-group data-chapter-name="ground" className="ba relative z-[2]" style={tall(260)}>
        <div data-pin className={`${pin} flex items-center`}>
          <div className="wrap w-full flex flex-col gap-10">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="flex flex-col gap-5 max-w-[620px]">
                <h2 className="text-d-3 font-light">Misma idea.<br /><span className="serif">Otra voz.</span></h2>
                <p className="text-[15.5px] leading-[1.7] text-mid max-w-[460px]"><span className="lead-in">La reescritura no inventa.</span> Sustituye las fórmulas de IA por giros propios y rompe la cadencia simétrica, con las citas y las cifras intactas.</p>
              </div>
              <div className="flex items-end gap-4">
                <span className="relative num text-[72px] sm:text-[96px] leading-none">
                  <span className="ba-score-ai absolute inset-0 text-ai" aria-hidden="true"><Odometer value={score} digits={2} /></span>
                  <span className="ba-score-human text-human"><Odometer value={score} digits={2} /></span>
                </span>
                <span className="flex flex-col gap-2 pb-2 min-w-[120px]">
                  <span className="num text-[22px] text-low leading-none">%</span>
                  <span className="eyebrow">probabilidad IA</span>
                  <span className="h-[3px] w-full rounded-full bg-hair overflow-hidden"><span className="ba-bar block h-full w-full bg-azure rounded-full" /></span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-8 items-start">
              <div className="sheet px-7 py-7 sm:px-10 sm:py-9">
                <div className="relative h-5 mb-5">
                  <span className="ba-caption-old absolute left-0 top-0 eyebrow text-ai">Texto original · 87 % IA</span>
                  <span className="ba-caption-new absolute left-0 top-0 eyebrow text-human">Reescritura editorial · 9 % IA</span>
                </div>
                <WordDiff before={BEFORE} after={AFTER} className="serif text-[20px] sm:text-[25px] leading-[1.42]" />
              </div>

              <ul className="flex flex-col gap-4 lg:pt-2">
                {[
                  'Fórmulas de IA sustituidas por giros propios: «en conclusión» → «en definitiva»',
                  'Conectores sintéticos rotos: «asimismo», «cabe señalar»',
                  'Citas, cifras y terminología especializada intactas',
                ].map((t, i) => (
                  <li key={t} className="ba-change flex items-start gap-3 text-[14.5px] leading-[1.6] text-mid" style={{ ['--at' as string]: 0.35 + i * 0.22 }}>
                    <Check className="w-4 h-4 text-human shrink-0 mt-1" strokeWidth={2.2} />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <PricingAndClose onStart={handleStart} onPremium={handlePremium} closeMagnet={closeMagnet} />
    </div>
  );
};

/** La frase más importante de la página: se revela palabra a palabra. */
const HonestyStatement: React.FC = () => {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className="flex flex-col gap-8 py-12 sm:py-16 border-y border-gold/30">
      <p data-reveal="words" className="serif text-d-2 leading-[1.02] text-hi max-w-[1000px]">Una estimación probabilística, no un veredicto.</p>
      <p data-reveal className="text-[15.5px] leading-[1.7] text-mid max-w-[720px]">
        <span className="lead-in">El resultado se calcula con patrones estilométricos y sintácticos.</span> No constituye una certeza determinista y puede contener falsos positivos o falsos negativos. Una coincidencia textual tampoco implica plagio: puede ser una cita legítima, una referencia bibliográfica o terminología técnica de uso corriente.
      </p>
    </div>
  );
};

const PricingAndClose: React.FC<{ onStart: () => void; onPremium: () => void; closeMagnet: React.RefObject<HTMLButtonElement> }> = ({ onStart, onPremium, closeMagnet }) => {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className="relative z-[2]">
      {/* ═══════════ PRECIOS ═══════════ */}
      <section data-chapter-name="base" className="wrap py-24 sm:py-32 flex flex-col gap-14">
        <div data-reveal className="flex flex-col items-center text-center gap-5">
          <h2 className="text-d-3 font-light">Se paga una vez.<br /><span className="serif">Y ya.</span></h2>
          <p className="text-[16px] leading-[1.65] text-mid max-w-[480px]">Sin suscripciones, sin cobros recurrentes, sin plan empresarial oculto.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[920px] w-full mx-auto">
          <div data-reveal data-reveal-group="plans" className="card card-hover p-8 sm:p-9 flex flex-col gap-8">
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

          <div data-reveal data-reveal-group="plans" className="halo relative overflow-hidden p-8 sm:p-9 rounded-[20px] border border-azure/30 flex flex-col gap-8"
            style={{ background: 'linear-gradient(165deg, rgb(var(--azure) / .10), rgb(var(--azure) / .015) 55%)', boxShadow: '0 40px 110px -50px rgb(var(--azure) / .5)' }}>
            <div className="glow animate-breathe" style={{ width: 420, height: 420, top: -200, right: -180, ['--glow-color' as string]: 'rgb(var(--azure) / .22)' }} aria-hidden="true" />
            <div className="relative flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4">
                <span className="eyebrow text-azure">Licencia vitalicia</span>
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-azure">Pago único</span>
              </div>
              <div className="flex items-baseline gap-2"><span className="num text-[56px] leading-none">$2</span><span className="text-sm text-mid">USD, de por vida</span></div>
              <p className="text-[13.5px] text-mid">Desbloqueo permanente. Sin renovaciones.</p>
            </div>
            <ul className="relative flex flex-col gap-3 text-[14px] text-mid">
              {['Análisis ilimitados, sin cuota diaria', 'Prioridad en tesis y documentos extensos', 'Descargas ilimitadas del documento mejorado', 'Historial permanente de verificaciones'].map((t) => (
                <li key={t} className="flex items-start gap-3"><Check className="w-4 h-4 text-azure shrink-0 mt-0.5" strokeWidth={2.2} /><span>{t}</span></li>
              ))}
            </ul>
            <button type="button" onClick={onPremium} className="btn btn-primary w-full relative">Adquirir licencia vitalicia</button>
          </div>
        </div>
      </section>

      {/* ═══════════ CIERRE ═══════════ */}
      <section data-chapter-name="ground" className="wrap py-28 sm:py-40 flex flex-col items-center text-center gap-9">
        <h2 data-reveal className="text-d-1 font-light max-w-[900px]">Pon a prueba<br /><span className="serif text-azure">tu propio texto.</span></h2>
        <p data-reveal className="text-[17px] leading-[1.65] text-mid max-w-[480px]">Cinco análisis al día, sin tarjeta y sin período de prueba que caduque.</p>
        <div data-reveal>
          <button ref={closeMagnet} type="button" onClick={onStart} className="btn btn-primary h-[58px] px-9 text-[16px]">
            Crear cuenta gratis <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </section>

      {/* ═══════════ PIE ═══════════ */}
      <footer className="border-t hair">
        <div className="wrap py-12 flex flex-wrap justify-between gap-10">
          <div className="flex flex-col gap-4 max-w-[340px]">
            <span className="text-[14px] font-extrabold tracking-[0.14em] text-mid">PLAGELIO</span>
            <p className="text-[12.5px] leading-[1.65] text-low">Análisis estilométrico, cotejo de similitud y reescritura editorial para trabajo académico.</p>
            <span className="text-xs text-low">© {new Date().getFullYear()} Plagelio</span>
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
              <button type="button" onClick={onPremium} className="text-left hover:text-hi transition-colors">Licencia vitalicia</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
