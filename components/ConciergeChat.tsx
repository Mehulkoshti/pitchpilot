'use client';

import { useId, useRef, useState } from 'react';
import { LANGUAGES } from '@/lib/i18n';

/** One turn in the concierge conversation. */
interface Message {
  readonly id: number;
  readonly role: 'user' | 'assistant';
  readonly text: string;
  readonly source?: 'ai' | 'fallback';
}

/** Shape of the `/api/concierge` success response. */
interface ConciergeApiResponse {
  answer: string;
  intent: string;
  source: 'ai' | 'fallback';
  language: string;
}

/** Suggested prompts to help fans discover what they can ask. */
const SUGGESTIONS: readonly string[] = [
  'Which gate has the shortest queue?',
  'Where is the nearest restroom?',
  'How do I get to the city centre?',
];

/**
 * The multilingual AI concierge chat widget. Posts to `/api/concierge`, shows
 * whether each answer came from the AI or the offline fallback, and remains
 * fully keyboard- and screen-reader-accessible.
 */
export function ConciergeChat(): React.JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('en');
  const [isLoading, setLoading] = useState(false);
  const nextId = useRef(0);
  const logId = useId();

  async function send(text: string): Promise<void> {
    const trimmed = text.trim();
    if (trimmed.length === 0 || isLoading) return;

    const userMessage: Message = { id: nextId.current++, role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, language }),
      });
      const data = (await response.json()) as ConciergeApiResponse;
      const answer = response.ok
        ? data.answer
        : 'Sorry, I could not answer just now. Please ask a nearby steward.';
      setMessages((prev) => [
        ...prev,
        { id: nextId.current++, role: 'assistant', text: answer, source: data.source },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId.current++,
          role: 'assistant',
          text: 'Network error — please try again.',
          source: 'fallback',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card flex flex-col" aria-labelledby="concierge-heading">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="concierge-heading" className="text-lg font-semibold text-ink-900">
          AI concierge
        </h2>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-ink-700">Language</span>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul
        id={logId}
        aria-live="polite"
        aria-label="Conversation"
        className="mb-3 flex min-h-[8rem] flex-col gap-2"
      >
        {messages.length === 0 && (
          <li className="text-sm text-slate-500">
            Ask me anything about the venue — I reply in your language.
          </li>
        )}
        {messages.map((message) => (
          <li
            key={message.id}
            className={
              message.role === 'user'
                ? 'self-end rounded-lg bg-pitch-700 px-3 py-2 text-sm text-white'
                : 'self-start rounded-lg bg-slate-100 px-3 py-2 text-sm text-ink-900'
            }
          >
            {message.text}
            {message.source === 'fallback' && message.role === 'assistant' && (
              <span className="mt-1 block text-xs text-slate-500">
                Answered from stadium data (offline).
              </span>
            )}
          </li>
        ))}
        {isLoading && (
          <li className="self-start text-sm text-slate-500" aria-hidden="true">
            Thinking…
          </li>
        )}
      </ul>

      <div className="mb-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => void send(suggestion)}
            disabled={isLoading}
            className="rounded-full border border-slate-300 px-3 py-1 text-xs text-ink-700 hover:bg-pitch-50 disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send(input);
        }}
        className="flex gap-2"
      >
        <label htmlFor="concierge-input" className="sr-only">
          Your question
        </label>
        <input
          id="concierge-input"
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about gates, food, transport…"
          autoComplete="off"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isLoading || input.trim().length === 0}
          className="rounded-lg bg-pitch-700 px-4 py-2 text-sm font-semibold text-white hover:bg-pitch-600 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </section>
  );
}
