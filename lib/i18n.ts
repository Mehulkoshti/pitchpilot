/**
 * Lightweight multilingual support.
 *
 * The FIFA World Cup 2026 draws a global crowd, so the concierge must respond
 * in the fan's language. This module lists supported languages and provides a
 * small, dependency-free UI string table. AI responses are localised by the
 * model; these strings cover the deterministic fallback and static chrome.
 */

/** A language the concierge can understand and reply in. */
export interface Language {
  readonly code: string;
  /** Endonym — the language's name in that language. */
  readonly label: string;
}

/** Languages officially surfaced in the UI language switcher. */
export const LANGUAGES: readonly Language[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिन्दी' },
];

/** Keys for translatable static UI strings. */
type StringKey = 'askPlaceholder' | 'fallbackNotice' | 'accessibleRoute';

/** Minimal translation table for the deterministic fallback path. */
const STRINGS: Record<string, Partial<Record<StringKey, string>>> = {
  en: {
    askPlaceholder: 'Ask about gates, food, transport, accessibility…',
    fallbackNotice: 'Answering from stadium data (AI assistant offline).',
    accessibleRoute: 'Step-free route',
  },
  es: {
    askPlaceholder: 'Pregunta sobre puertas, comida, transporte, accesibilidad…',
    fallbackNotice: 'Respondiendo con datos del estadio (asistente IA sin conexión).',
    accessibleRoute: 'Ruta sin escalones',
  },
  fr: {
    askPlaceholder: 'Renseignez-vous sur les portes, la nourriture, les transports…',
    fallbackNotice: 'Réponse à partir des données du stade (assistant IA hors ligne).',
    accessibleRoute: 'Itinéraire sans marches',
  },
};

/** Whether a language code is one PitchPilot supports. */
export function isSupportedLanguage(code: string): boolean {
  return LANGUAGES.some((language) => language.code === code);
}

/**
 * Resolve a UI string for a language, falling back to English then to the key
 * itself, so the UI never renders an empty label.
 */
export function t(code: string, key: StringKey): string {
  return STRINGS[code]?.[key] ?? STRINGS.en?.[key] ?? key;
}
