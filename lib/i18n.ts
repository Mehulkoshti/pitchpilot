/**
 * Multilingual support for the concierge.
 *
 * The FIFA World Cup 2026 draws a global crowd, so the concierge replies in the
 * fan's language. Localisation of the replies themselves is handled by the model
 * (see `app/api/concierge/route.ts`); this module owns only the list of
 * languages surfaced in the UI switcher.
 */

/** A language the concierge can understand and reply in. */
export interface Language {
  readonly code: string;
  /** Endonym — the language's name in that language. */
  readonly label: string;
}

/** Languages offered in the UI language switcher. */
export const LANGUAGES: readonly Language[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिन्दी' },
];
