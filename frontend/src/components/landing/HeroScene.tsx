import React, { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../../motion';
import { onThemeChange } from '../../motion/canvas';
import { ReadingField } from './ReadingField';
import { RotatingWord } from './RotatingWord';
import type { HeroChapter, HeroSceneApi } from './heroScene3d';

/* ────────────────────────────────────────────────────────────────
   Héroe 3D: el documento se arma, se escanea, se convierte en ciudad
   de párrafos y termina en el sello. Avanza solo mientras está en
   pantalla; los capítulos también se eligen a mano (y entonces se
   respeta la elección unos segundos).

   three.js se carga después de pintar la página. Sin WebGL, o si la
   carga falla, se queda el campo de lectura en Canvas 2D de siempre.
   ──────────────────────────────────────────────────────────────── */
const CHAPTERS: { key: HeroChapter; label: string }[] = [
  { key: 'documento', label: 'Documento' },
  { key: 'escaneo', label: 'Escaneo' },
  { key: 'ciudad', label: 'Ciudad' },
  { key: 'sello', label: 'Sello' },
];
const STEP = 3800;
const HOLD = 9000;
const WORDS = ['párrafo', 'oración', 'cita', 'fuente', 'voz'];

const hasWebGL = () => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
};

export const HeroScene: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const apiRef = useRef<HeroSceneApi | null>(null);
  const [mode, setMode] = useState<'loading' | 'webgl' | 'fallback'>(() => (typeof window !== 'undefined' && hasWebGL() ? 'loading' : 'fallback'));
  const [chapter, setChapter] = useState(0);
  const holdUntil = useRef(0);
  const reduced = prefersReducedMotion();

  // Carga diferida de la escena
  useEffect(() => {
    if (mode === 'fallback') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let api: HeroSceneApi | null = null, cancelled = false;
    import('./heroScene3d')
      .then(({ createHeroScene }) => {
        if (cancelled) return;
        api = createHeroScene(canvas, { reduced, onReady: () => setMode('webgl') });
        apiRef.current = api;
        api.goto(reduced ? 'escaneo' : 'documento', true);
        if (reduced) setChapter(1);
      })
      .catch(() => { if (!cancelled) setMode('fallback'); });
    const offTheme = onThemeChange(() => apiRef.current?.retheme());
    return () => { cancelled = true; offTheme(); api?.dispose(); apiRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode === 'fallback']);

  // Avance automático: solo con la escena visible y sin elección manual reciente
  useEffect(() => {
    if (mode !== 'webgl' || reduced) return;
    const el = canvasRef.current;
    let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.2 });
    if (el) io.observe(el);
    const t = window.setInterval(() => {
      if (!visible || document.hidden || Date.now() < holdUntil.current) return;
      setChapter((k) => (k + 1) % CHAPTERS.length);
    }, STEP);
    return () => { window.clearInterval(t); io.disconnect(); };
  }, [mode, reduced]);

  // Cada cambio de capítulo mueve la escena y reinicia la barra de progreso
  const firstRun = useRef(true);
  useEffect(() => {
    if (mode !== 'webgl') return;
    if (firstRun.current) { firstRun.current = false; } else { apiRef.current?.goto(CHAPTERS[chapter].key); }
    const bar = barRef.current;
    if (!bar || reduced) return;
    bar.style.transition = 'none';
    bar.style.transform = 'scaleX(0)';
    void bar.offsetWidth;
    bar.style.transition = `transform ${Date.now() < holdUntil.current ? HOLD : STEP}ms linear`;
    bar.style.transform = 'scaleX(1)';
  }, [chapter, mode, reduced]);

  const pick = (i: number) => {
    holdUntil.current = Date.now() + HOLD;
    setChapter(i);
    if (i === chapter) apiRef.current?.goto(CHAPTERS[i].key);
  };

  if (mode === 'fallback') {
    return (
      <div className={`relative flex flex-col gap-5 ${className}`}>
        <div className="relative flex-1 min-h-0"><ReadingField className="w-full h-full block" /></div>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col gap-5 ${className}`}>
      <div className="relative flex-1 min-h-0" style={{ touchAction: 'pan-y' }}>
        <canvas
          ref={canvasRef}
          className={`w-full h-full block transition-opacity duration-900 ease-out ${mode === 'webgl' ? 'opacity-100' : 'opacity-0'}`}
          role="img"
          aria-label="Escena 3D: 192 bloques forman un documento, lo escanean, lo convierten en una ciudad de párrafos y terminan en el sello de Plagelio"
        />
      </div>
      <div className="relative z-[2] flex flex-col gap-3.5 px-1">
        <p className="text-d-5 font-light leading-none">
          Lee cada <RotatingWord words={WORDS} className="serif text-azure" />
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2" role="group" aria-label="Capítulos de la escena">
          {CHAPTERS.map((c, i) => (
            <button key={c.key} type="button" onClick={() => pick(i)} aria-pressed={i === chapter}
              className={`num text-[12px] tracking-[0.04em] transition-colors duration-240 ${i === chapter ? 'text-hi' : 'text-low hover:text-mid'}`}>
              0{i + 1} <span className="font-sans font-semibold">{c.label}</span>
            </button>
          ))}
        </div>
        <span className="block h-px w-full max-w-[360px] bg-hair overflow-hidden" aria-hidden="true">
          <span ref={barRef} className="block h-full w-full bg-azure origin-left" style={{ transform: reduced ? 'scaleX(1)' : 'scaleX(0)' }} />
        </span>
      </div>
    </div>
  );
};
