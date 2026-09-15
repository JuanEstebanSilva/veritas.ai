/** @type {import('tailwindcss').Config} */
const t = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Superficies (de más profunda a más elevada)
        ground: t('ground'),
        base: t('base'),
        surface: t('surface'),
        'surface-2': t('surface-2'),
        line: t('line'),
        // Texto
        hi: t('hi'),
        mid: t('mid'),
        low: t('low'),
        // Acentos de marca (misma luminosidad y croma, distinto tono)
        azure: t('azure'),
        gold: t('gold'),
        // Veredicto
        human: t('human'),
        mixed: t('mixed'),
        ai: t('ai'),
        // Compatibilidad con el color primario previo
        primary: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa',
          500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a', 950: '#172554',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', '"Times New Roman"', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        // Escala de display fluida
        'd-1': ['clamp(44px, 8vw, 104px)', { lineHeight: '0.93', letterSpacing: '-0.045em' }],
        'd-2': ['clamp(38px, 6.6vw, 76px)', { lineHeight: '1', letterSpacing: '-0.045em' }],
        'd-3': ['clamp(34px, 5.4vw, 62px)', { lineHeight: '1.02', letterSpacing: '-0.04em' }],
        'd-4': ['clamp(28px, 4vw, 44px)', { lineHeight: '1.06', letterSpacing: '-0.035em' }],
        'd-5': ['clamp(24px, 3vw, 32px)', { lineHeight: '1.12', letterSpacing: '-0.03em' }],
      },
      letterSpacing: { eyebrow: '0.2em' },
      transitionTimingFunction: { out: 'cubic-bezier(0.16, 1, 0.3, 1)' },
      transitionDuration: { 450: '450ms', 600: '600ms', 900: '900ms' },
      boxShadow: {
        azure: '0 18px 50px -18px rgb(var(--azure) / 0.7)',
        'azure-lg': '0 26px 62px -18px rgb(var(--azure) / 0.9)',
        panel: '0 60px 140px -50px rgb(0 0 0 / 0.95)',
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(26px)', filter: 'blur(10px)' },
          to: { opacity: '1', transform: 'none', filter: 'blur(0)' },
        },
        breathe: { '0%,100%': { opacity: '.5' }, '50%': { opacity: '.9' } },
        beam: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '12%': { opacity: '1' },
          '88%': { opacity: '1' },
          '100%': { transform: 'translateY(620%)', opacity: '0' },
        },
        'page-in': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        rise: 'rise 1.1s cubic-bezier(0.16, 1, 0.3, 1) backwards',
        breathe: 'breathe 7s ease-in-out infinite',
        beam: 'beam 7s cubic-bezier(0.16, 1, 0.3, 1) 1s infinite',
        'page-in': 'page-in .7s cubic-bezier(0.16, 1, 0.3, 1) backwards',
      },
    },
  },
  plugins: [],
};
