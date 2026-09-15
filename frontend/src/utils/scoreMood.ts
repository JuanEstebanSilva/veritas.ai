/**
 * Descriptor de estado según el porcentaje de IA. Tres tonos, sin emojis:
 *   >= 70  →  ai     (alta probabilidad de IA)
 *   40–69  →  mixed  (patrones mixtos)
 *   <  40  →  human  (autenticidad predominantemente humana)
 *
 * Las clases apuntan a los tokens de veredicto del sistema, que comparten
 * luminosidad y croma entre sí, por lo que conviven en cualquier tabla.
 */
export type Tone = 'ai' | 'mixed' | 'human';

export interface ScoreMood {
  tone: Tone;
  status: string;
  shortStatus: string;
  description: string;
  /** Color de texto y de punto indicador */
  textClass: string;
  /** Filete lateral / borde de énfasis */
  borderClass: string;
  /** Fondo tenue para superficies que lo necesiten */
  bgClass: string;
  /** Barra de progreso */
  barClass: string;
  /** Variable CSS del color, para estilos en línea */
  cssVar: string;
}

const MOODS: Record<Tone, Omit<ScoreMood, 'tone'>> = {
  ai: {
    status: 'Alta probabilidad de contenido generado por IA',
    shortStatus: 'Alta probabilidad IA',
    description: 'Regularidad sintáctica y patrones algorítmicos predominantes',
    textClass: 'text-ai',
    borderClass: 'border-ai',
    bgClass: 'bg-ai/10',
    barClass: 'bg-ai',
    cssVar: 'var(--ai)',
  },
  mixed: {
    status: 'Patrones mixtos: posible asistencia o edición con IA',
    shortStatus: 'Patrones mixtos',
    description: 'Rasgos orgánicos combinados con uniformidad estilométrica',
    textClass: 'text-mixed',
    borderClass: 'border-mixed',
    bgClass: 'bg-mixed/10',
    barClass: 'bg-mixed',
    cssVar: 'var(--mixed)',
  },
  human: {
    status: 'Probabilidad predominantemente humana',
    shortStatus: 'Alta autenticidad',
    description: 'Cadencia natural, perplejidad variada y autoría humana',
    textClass: 'text-human',
    borderClass: 'border-human',
    bgClass: 'bg-human/10',
    barClass: 'bg-human',
    cssVar: 'var(--human)',
  },
};

export const getScoreMood = (aiScore: number): ScoreMood => {
  const rounded = Math.round(Number(aiScore) || 0);
  const tone: Tone = rounded >= 70 ? 'ai' : rounded >= 40 ? 'mixed' : 'human';
  return { tone, ...MOODS[tone] };
};

/** Estado según el índice humano (100 − IA). */
export const getHumanMood = (humanScore: number): ScoreMood =>
  getScoreMood(100 - Math.round(Number(humanScore) || 0));
