import React, { useLayoutEffect, useMemo, useRef } from 'react';

/* ────────────────────────────────────────────────────────────────
   Diferencia palabra a palabra entre dos textos (LCS). Cada cambio se
   pinta como un par antiguo/nuevo apilado en la misma celda, así el
   intercambio no mueve el párrafo. El momento de cada cambio es --at;
   el CSS (landing.css) hace el cruce a partir de --p. La anchura de la
   celda se interpola entre las dos palabras (medidas en píxeles) para
   que no queden huecos cuando la nueva es más corta.
   ──────────────────────────────────────────────────────────────── */
export type DiffOp = { kind: 'same'; text: string } | { kind: 'change'; from: string; to: string };

export const diffWords = (a: string, b: string): DiffOp[] => {
  const A = a.split(/\s+/).filter(Boolean), B = b.split(/\s+/).filter(Boolean);
  const n = A.length, m = B.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ops: DiffOp[] = [];
  let i = 0, j = 0, del: string[] = [], ins: string[] = [];
  const flush = () => {
    if (del.length || ins.length) ops.push({ kind: 'change', from: del.join(' '), to: ins.join(' ') });
    del = []; ins = [];
  };
  while (i < n && j < m) {
    if (A[i] === B[j]) { flush(); ops.push({ kind: 'same', text: A[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { del.push(A[i++]); }
    else { ins.push(B[j++]); }
  }
  while (i < n) del.push(A[i++]);
  while (j < m) ins.push(B[j++]);
  flush();
  return ops;
};

interface WordDiffProps { before: string; after: string; className?: string; }

export const WordDiff: React.FC<WordDiffProps> = ({ before, after, className = '' }) => {
  const ops = useMemo(() => diffWords(before, after), [before, after]);
  const ref = useRef<HTMLParagraphElement>(null);
  const changes = ops.filter((o) => o.kind === 'change').length;

  // Mide las dos palabras de cada celda y deja la anchura en --w0/--w1 (px).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      el.querySelectorAll<HTMLElement>('.diff-cell').forEach((cell) => {
        cell.style.removeProperty('--w0'); cell.style.removeProperty('--w1');
        const a = cell.querySelector<HTMLElement>('.diff-old'), b = cell.querySelector<HTMLElement>('.diff-new');
        if (!a || !b) return;
        const w0 = a.getBoundingClientRect().width, w1 = b.getBoundingClientRect().width;
        if (w0 > 0 && w1 > 0) { cell.style.setProperty('--w0', w0.toFixed(1)); cell.style.setProperty('--w1', w1.toFixed(1)); }
      });
    };
    measure();
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ops]);

  let k = 0;
  return (
    <p ref={ref} className={className}>
      {ops.map((op, idx) => {
        if (op.kind === 'same') return <React.Fragment key={idx}>{op.text}{' '}</React.Fragment>;
        const at = changes > 1 ? k / (changes - 1) : 0; k++;
        return (
          <React.Fragment key={idx}>
            <span className="diff-cell" style={{ ['--at' as string]: at.toFixed(3) }}>
              <span className="diff-old" aria-hidden="true">{op.from}</span>
              <span className="diff-new">{op.to}</span>
            </span>{' '}
          </React.Fragment>
        );
      })}
    </p>
  );
};
