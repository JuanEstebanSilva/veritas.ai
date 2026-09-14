export interface ScoreMood {
  aiEmoji: '🤖' | '😐' | '😊';
  humanEmoji: '🤖' | '😐' | '😊';
  status: string;
  shortStatus: string;
  description: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  badgeClass: string;
  barGradient: string;
}

/**
 * Devuelve el estado de ánimo (emoji y estilos) según el porcentaje de IA:
 * - >= 70%: 🤖 Robot (Alta probabilidad de IA)
 * - 40% - 69%: 😐 Cara seria / neutra (Patrones mixtos o sospechosos)
 * - < 40%: 😊 Cara feliz (Alta autenticidad humana / texto orgánico)
 */
export const getScoreMood = (aiScore: number): ScoreMood => {
  const rounded = Math.round(Number(aiScore) || 0);

  if (rounded >= 70) {
    return {
      aiEmoji: '🤖',
      humanEmoji: '🤖',
      status: 'Alta probabilidad de contenido generado por IA',
      shortStatus: 'Alta Probabilidad IA',
      description: 'Detección predominante de regularidad sintáctica y patrones algorítmicos',
      bgClass: 'bg-rose-50 dark:bg-rose-950/40',
      borderClass: 'border-rose-200 dark:border-rose-900',
      textClass: 'text-rose-600 dark:text-rose-400',
      badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      barGradient: 'bg-gradient-to-r from-rose-500 to-red-600',
    };
  }

  if (rounded >= 40) {
    return {
      aiEmoji: '😐',
      humanEmoji: '😐',
      status: 'Patrones mixtos (posible asistencia o edición con IA)',
      shortStatus: 'Patrones Mixtos',
      description: 'Combinación de rasgos orgánicos y uniformidad estilométrica',
      bgClass: 'bg-amber-50 dark:bg-amber-950/40',
      borderClass: 'border-amber-200 dark:border-amber-900',
      textClass: 'text-amber-600 dark:text-amber-400',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      barGradient: 'bg-gradient-to-r from-amber-500 to-orange-500',
    };
  }

  return {
    aiEmoji: '😊',
    humanEmoji: '😊',
    status: 'Probabilidad predominantemente humana / orgánica',
    shortStatus: 'Alta Autenticidad',
    description: 'Cadencia natural, perplejidad variada y autoría humana',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderClass: 'border-emerald-200 dark:border-emerald-900',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    barGradient: 'bg-gradient-to-r from-emerald-500 to-teal-500',
  };
};

/**
 * Devuelve el estado de ánimo según el índice humano (100 - aiScore)
 */
export const getHumanMood = (humanScore: number): ScoreMood => {
  const roundedHuman = Math.round(Number(humanScore) || 0);
  const aiScore = 100 - roundedHuman;
  return getScoreMood(aiScore);
};
