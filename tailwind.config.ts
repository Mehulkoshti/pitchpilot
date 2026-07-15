import type { Config } from 'tailwindcss';

/**
 * PitchPilot design tokens.
 * The palette is inspired by a stadium at night: deep pitch green, floodlight
 * amber, and high-contrast neutrals chosen to pass WCAG AA against both surfaces.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pitch: {
          50: '#effcf3',
          100: '#d6f5e0',
          500: '#0f9d58',
          600: '#0b7d46',
          700: '#0a6238',
          900: '#05301c',
        },
        flood: {
          400: '#ffcb47',
          500: '#f5a623',
        },
        ink: {
          700: '#26313d',
          800: '#1a222b',
          900: '#0f1419',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
