import { describe, expect, it } from 'vitest';
import { LANGUAGES } from '@/lib/i18n';

describe('i18n', () => {
  it('exposes at least six languages', () => {
    expect(LANGUAGES.length).toBeGreaterThanOrEqual(6);
  });

  it('gives every language a code and an endonym label', () => {
    for (const language of LANGUAGES) {
      expect(language.code).toMatch(/^[a-z]{2}$/);
      expect(language.label.length).toBeGreaterThan(0);
    }
  });

  it('has no duplicate language codes', () => {
    const codes = LANGUAGES.map((language) => language.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
