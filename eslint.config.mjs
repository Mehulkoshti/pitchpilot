import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/**
 * ESLint flat config.
 *
 * Next 16 removed `next lint`, so ESLint is invoked directly and the file
 * scope has to be stated here rather than inferred from Next's default
 * directories.
 */
const config = [
  {
    ignores: [
      '.next/**',
      'coverage/**',
      'node_modules/**',
      'next-env.d.ts',
      'tsconfig.tsbuildinfo',
    ],
  },

  ...nextCoreWebVitals,
  prettier,

  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
    },
  },

  {
    // The service worker runs in its own global scope — `self`, `caches` and
    // `clients` are undefined anywhere else, so it needs its own environment.
    files: ['public/sw.js'],
    languageOptions: {
      globals: { ...globals.serviceworker },
    },
  },
];

export default config;
