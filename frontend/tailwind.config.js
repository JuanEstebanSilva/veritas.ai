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
        // Papel: la hoja del documento es papel en los dos temas
        paper: t('paper'),
        ink: t('ink'),
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
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', '"Times New Roman"', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        // Escala de display fluida. El tracking cambia de signo con el tamaño:
        // muy negativo en display, casi neutro en titulares medianos.
        'd-1': ['clamp(46px, 7.4vw, 100px)', { lineHeight: '0.95', letterSpacing: '-0.042em' }],
        'd-hero': ['clamp(42px, 4.5vw, 66px)', { lineHeight: '0.98', letterSpacing: '-0.04em' }],
        'd-2': ['clamp(38px, 5.8vw, 74px)', { lineHeight: '0.98', letterSpacing: '-0.038em' }],
        'd-3': ['clamp(32px, 4.6vw, 58px)', { lineHeight: '1.02', letterSpacing: '-0.032em' }],
        'd-4': ['clamp(28px, 3.6vw, 44px)', { lineHeight: '1.06', letterSpacing: '-0.026em' }],
        'd-5': ['clamp(22px, 2.6vw, 30px)', { lineHeight: '1.14', letterSpacing: '-0.016em' }],
        lede: ['clamp(17px, 1.4vw, 20px)', { lineHeight: '1.6', letterSpacing: '-0.008em' }],
      },
      letterSpacing: { eyebrow: '0.18em' },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out': 'cubic-bezier(0.66, 0, 0.1, 1)',
        drawer: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      transitionDuration: { 160: '160ms', 240: '240ms', 320: '320ms', 450: '450ms', 600: '600ms', 900: '900ms' },
      boxShadow: {
        azure: '0 18px 50px -18px rgb(var(--azure) / 0.6)',
        'azure-lg': '0 26px 62px -18px rgb(var(--azure) / 0.85)',
        panel: '0 40px 100px -40px rgb(0 0 0 / 0.75), 0 2px 6px -2px rgb(0 0 0 / 0.35)',
        sheet: '0 60px 120px -40px rgb(0 0 0 / 0.65), 0 18px 40px -22px rgb(0 0 0 / 0.5), 0 0 0 1px rgb(0 0 0 / 0.06)',
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(22px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'page-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'none' },
        },
        breathe: { '0%,100%': { opacity: '.55' }, '50%': { opacity: '1' } },
        beam: {
          '0%': { transform: 'translateY(-120%)', opacity: '0' },
          '8%': { opacity: '1' },
          '92%': { opacity: '1' },
          '100%': { transform: 'translateY(560%)', opacity: '0' },
        },
        shimmer: { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(100%)' } },
        sweep: { to: { '--sweep': '360deg' } },
      },
      animation: {
        rise: 'rise .9s cubic-bezier(0.16, 1, 0.3, 1) backwards',
        'page-in': 'page-in .42s cubic-bezier(0.16, 1, 0.3, 1) backwards',
        breathe: 'breathe 6s ease-in-out infinite',
        beam: 'beam 7s cubic-bezier(0.66, 0, 0.1, 1) 1s infinite',
        shimmer: 'shimmer 1.6s cubic-bezier(0.66, 0, 0.1, 1) infinite',
      },
    },
  },
  plugins: [],
};
