import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from './gsap';

/* ────────────────────────────────────────────────────────────────
   Utilidades para las piezas de Canvas 2D (y la escena 3D).

   Los colores vienen siempre de los tokens del tema (`--azure`,
   `--human`…, guardados como "r g b"), así que el cambio claro/oscuro
   llega también al canvas. Cada pieza dibuja a doble densidad como
   máximo y se detiene fuera de pantalla o con la pestaña oculta.
   ──────────────────────────────────────────────────────────────── */

export type Rgb = [number, number, number];

/** Lee un token "r g b" del tema actual. */
export const token = (name: string): Rgb => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
  const p = raw.split(/[\s,]+/).map(Number);
  return p.length >= 3 && p.every((n) => Number.isFinite(n)) ? [p[0], p[1], p[2]] : [128, 128, 128];
};

/** `rgb()`/`rgba()` de un token, para el contexto 2D. */
export const rgba = (c: Rgb, a = 1) => (a >= 1 ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${a})`);

/** Llama a `cb` cada vez que cambia el tema (clase `dark` en <html>). */
export const onThemeChange = (cb: () => void) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
  return () => mo.disconnect();
};

export interface CanvasStage {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  /** Ancho y alto en píxeles CSS. */
  w: number;
  h: number;
  dpr: number;
  reduced: boolean;
}

export interface CanvasScene {
  /** Se llama al montar, al cambiar de tamaño y al cambiar el tema. */
  layout?: (s: CanvasStage) => void;
  /** Un fotograma. Devuelve `false` para dormir el bucle hasta `wake()`. */
  frame: (s: CanvasStage, t: number, dt: number) => boolean | void;
  dispose?: () => void;
}

export interface CanvasControls {
  /** Reanuda el bucle si estaba dormido (tras una interacción o un dato nuevo). */
  wake: () => void;
  stage: () => CanvasStage | null;
}

/**
 * Monta una escena de canvas con bucle propio:
 *  - densidad de píxeles limitada (`maxDpr`), redimensionado con ResizeObserver;
 *  - se pausa fuera de pantalla (IntersectionObserver) y con la pestaña oculta;
 *  - con movimiento reducido dibuja solo cuando hace falta (la escena decide).
 * `setup` recibe los controles y devuelve la escena; se vuelve a crear si cambian `deps`.
 */
export function useCanvasScene(
  setup: (controls: CanvasControls) => CanvasScene,
  deps: ReadonlyArray<unknown> = [],
  maxDpr = 2,
) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const stage: CanvasStage = { canvas, ctx, w: 1, h: 1, dpr: 1, reduced: prefersReducedMotion() };
    let raf = 0, last = 0, awake = true, visible = true, alive = true;

    const loop = (t: number) => {
      raf = 0;
      if (!alive || !visible || document.hidden) return;
      const dt = last ? Math.min(64, t - last) : 16;
      last = t;
      const keep = scene.frame(stage, t, dt);
      if (keep === false) { awake = false; last = 0; return; }
      raf = requestAnimationFrame(loop);
    };
    const wake = () => { awake = true; if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop); };
    const controls: CanvasControls = { wake, stage: () => stage };
    const scene = setup(controls);

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      stage.dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      stage.w = Math.max(1, Math.round(r.width));
      stage.h = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(stage.w * stage.dpr);
      canvas.height = Math.round(stage.h * stage.dpr);
      ctx.setTransform(stage.dpr, 0, 0, stage.dpr, 0, 0);
      scene.layout?.(stage);
      wake();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const offTheme = onThemeChange(() => { scene.layout?.(stage); wake(); });
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && awake) wake();
    }, { threshold: 0.01 });
    io.observe(canvas);
    const onVis = () => { if (!document.hidden && awake) wake(); };
    document.addEventListener('visibilitychange', onVis);
    resize();

    return () => {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect(); offTheme();
      document.removeEventListener('visibilitychange', onVis);
      scene.dispose?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

/** Generador pseudoaleatorio determinista (la misma "página" en cada visita). */
export const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

/** Divide un texto en oraciones (respeta abreviaturas cortas y cifras decimales). */
export const splitSentences = (text: string): string[] =>
  text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?…])\s+(?=[«"“(¿¡A-ZÁÉÍÓÚÑ0-9])/)
    .map((s) => s.trim())
    .filter((s) => s.split(' ').length >= 2);

export const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;
