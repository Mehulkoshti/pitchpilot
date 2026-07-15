import { describe, expect, it } from 'vitest';
import { LANGUAGES, isSupportedLanguage, t } from '@/lib/i18n';

describe('i18n', () => {
  it('exposes at least six languages', () => {
    expect(LANGUAGES.length).toBeGreaterThanOrEqual(6);
  });

  it('recognises supported language codes', () => {
    expect(isSupportedLanguage('es')).toBe(true);
    expect(isSupportedLanguage('zz')).toBe(false);
  });

  it('returns a localised string when available', () => {
    expect(t('es', 'accessibleRoute')).toBe('Ruta sin escalones');
  });

  it('falls back to English for an untranslated language', () => {
    expect(t('ar', 'accessibleRoute')).toBe(t('en', 'accessibleRoute'));
  });

  it('falls back to the key itself for an unknown key/language', () => {
    // @ts-expect-error — exercising the runtime fallback path
    expect(t('zz', 'missingKey')).toBe('missingKey');
  });
});
