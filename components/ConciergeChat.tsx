'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { answerQuery } from '@/lib/concierge';
import { LANGUAGES } from '@/lib/i18n';
import { DEFAULT_GATE_READINGS } from '@/lib/stadium-data';

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

/** The fan's routing context, shared with the wayfinding panel on the page. */
export interface ConciergeChatProps {
  /** Where the fan currently is, so routed answers start from the right place. */
  readonly fromNodeId?: string;
  /** Whether answers must stick to step-free routes. */
  readonly accessibleOnly?: boolean;
}

/** Fallback origin when the chat is used outside the fan page. */
const DEFAULT_ORIGIN = 'gate-a';

/**
 * The multilingual AI concierge chat widget. Posts to `/api/concierge`, shows
 * whether each answer came from the AI or the offline fallback, and remains
 * fully keyboard- and screen-reader-accessible.
 *
 * The fan's location and step-free preference are passed in and forwarded to
 * the API, so "nearest restroom?" is answered from where the fan actually is —
 * and, for a wheelchair user, without stairs.
 */
export function ConciergeChat({
  fromNodeId = DEFAULT_ORIGIN,
  accessibleOnly = false,
}: ConciergeChatProps = {}): React.JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('en');
  const [isLoading, setLoading] = useState(false);
  const nextId = useRef(0);
  const logId = useId();
  const logRef = useRef<HTMLUListElement>(null);

  // Keep the newest turn in view: pin the log to the bottom whenever a message
  // is added or the "Thinking…" indicator appears, so the conversation doesn't
  // scroll off the bottom of the fixed-height panel.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, isLoading]);

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
        body: JSON.stringify({ message: trimmed, language, fromNodeId, accessibleOnly }),
      });
      if (!response.ok) throw new Error(`concierge responded ${response.status}`);
      const data = (await response.json()) as ConciergeApiResponse;
      setMessages((prev) => [
        ...prev,
        {
          id: nextId.current++,
          role: 'assistant',
          text: data.answer,
          source: data.source,
        },
      ]);
    } catch {
      // Any failure — network gone, rate-limited, a 500 — lands here. The
      // concierge engine is pure and already in the browser, so answer locally
      // rather than stranding the fan with an apology when a rate-limit blip
      // could still be answered from stadium data.
      const local = answerQuery(trimmed, {
        readings: DEFAULT_GATE_READINGS,
        fromNodeId,
        accessibleOnly,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: nextId.current++,
          role: 'assistant',
          text: local.text,
          source: 'fallback',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const hasMessages = messages.length > 0;

  return (
    // A fixed panel height rather than stretching to the column: matching the
    // taller right-hand column pushed the input below the fold and left a void
    // above it. 32rem keeps the whole conversation and the input on screen.
    <section className="card flex h-[32rem] flex-col" aria-labelledby="concierge-heading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-pitch-50 text-lg"
          >
            🌐
          </span>
          <div>
            <h2
              id="concierge-heading"
              className="font-semibold leading-tight text-ink-900"
            >
              AI concierge
            </h2>
            <p className="text-xs text-slate-600">Ask in any language</p>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <span className="sr-only sm:not-sr-only sm:text-ink-700">Language</span>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-medium text-ink-900"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* The conversation grows to fill the panel so the card never collapses
          into dead space before the first question is asked. */}
      <ul
        ref={logRef}
        id={logId}
        aria-live="polite"
        aria-label="Conversation"
        className="flex-1 space-y-3 overflow-y-auto"
      >
        {!hasMessages && (
          <li className="flex h-full flex-col items-center justify-center px-6 text-center">
            <span aria-hidden="true" className="text-3xl">
              ⚽
            </span>
            <p className="mt-3 font-medium text-ink-900">How can I help on matchday?</p>
            <p className="mt-1 max-w-xs text-sm text-slate-600">
              Gates and queues, restrooms, food, first aid, exits, transport or a
              step-free route — in your language.
            </p>
          </li>
        )}

        {messages.map((message) => (
          <li
            key={message.id}
            className={
              message.role === 'user' ? 'flex justify-end' : 'flex justify-start'
            }
          >
            <div
              className={
                message.role === 'user'
                  ? 'max-w-[85%] rounded-2xl rounded-br-md bg-pitch-700 px-3.5 py-2.5 text-sm text-white'
                  : 'max-w-[85%] rounded-2xl rounded-bl-md bg-slate-100 px-3.5 py-2.5 text-sm text-ink-900'
              }
            >
              {message.text}
              {message.source === 'fallback' && message.role === 'assistant' && (
                <span className="mt-1.5 flex items-center gap-1 text-xs text-slate-600">
                  <span aria-hidden="true">📶</span>
                  Answered from stadium data (offline).
                </span>
              )}
            </div>
          </li>
        ))}

        {isLoading && (
          <li className="flex justify-start" aria-hidden="true">
            <div className="rounded-2xl rounded-bl-md bg-slate-100 px-3.5 py-2.5 text-sm text-slate-600">
              Thinking…
            </div>
          </li>
        )}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => void send(suggestion)}
            disabled={isLoading}
            className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-ink-700 transition-colors hover:bg-pitch-50 disabled:opacity-50"
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
        className="mt-3 flex gap-2"
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
          className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={isLoading || input.trim().length === 0}
          className="rounded-xl bg-pitch-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pitch-600 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </section>
  );
}
