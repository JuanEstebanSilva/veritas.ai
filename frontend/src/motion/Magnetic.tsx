import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { hasFinePointer } from './gsap';

/* ────────────────────────────────────────────────────────────────
   Botón magnético (Motion). Envuelve un botón: cuando el puntero se
   acerca, el envoltorio lo sigue con un resorte y vuelve al centro al
   salir. La física vive en el envoltorio, así el botón conserva sus
   propias transiciones de hover y :active.
   Sólo con puntero fino y sin movimiento reducido.
   ──────────────────────────────────────────────────────────────── */
const SPRING = { stiffness: 220, damping: 14, mass: 0.6 };

interface MagneticProps {
  children: React.ReactNode;
  /** Fracción de la distancia al puntero que recorre el botón. */
  strength?: number;
  /** Alcance en píxeles alrededor del botón. */
  radius?: number;
  className?: string;
}

export const Magnetic: React.FC<MagneticProps> = ({ children, strength = 0.3, radius = 90, className = '' }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const tx = useMotionValue(0), ty = useMotionValue(0);
  const x = useSpring(tx, SPRING), y = useSpring(ty, SPRING);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || !hasFinePointer()) return;
    const zone = el.parentElement || el;
    const rest = () => { tx.set(0); ty.set(0); };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      // Centro en reposo: se descuenta el desplazamiento actual
      const dx = e.clientX - (r.left + r.width / 2 - x.get());
      const dy = e.clientY - (r.top + r.height / 2 - y.get());
      if (Math.hypot(dx, dy) > radius + Math.max(r.width, r.height) / 2) { rest(); return; }
      tx.set(dx * strength); ty.set(dy * strength);
    };
    zone.addEventListener('pointermove', onMove, { passive: true });
    zone.addEventListener('pointerleave', rest);
    return () => { zone.removeEventListener('pointermove', onMove); zone.removeEventListener('pointerleave', rest); rest(); };
  }, [reduced, strength, radius, tx, ty, x, y]);

  return <motion.span ref={ref} className={`inline-flex ${className}`} style={{ x, y }}>{children}</motion.span>;
};
