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
        // Transform-only, deliberately. Animating opacity from 0 leaves text
        // below its contrast ratio for the length of the animation, which an
        // accessibility audit sampling mid-flight reports as a real violation.
        // The motion reads the same and the text is legible from frame one.
        rise: {
          '0%': { transform: 'translateY(10px)' },
          '100%': { transform: 'translateY(0)' },
        },
        // Purely decorative floodlight breathing, applied only to aria-hidden
        // glows — never to anything carrying text.
        floodlight: {
          '0%, 100%': { opacity: '0.45', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.06)' },
        },
      },
      animation: {
        rise: 'rise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        floodlight: 'floodlight 9s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
