/**
 * Google Gemini client wrapper (server-only).
 *
 * Centralises all Generative-AI calls. The API key is read from the server
 * environment and never shipped to the browser. Every call is wrapped so a
 * missing key, exhausted quota, network error or model timeout resolves to
 * `null`, letting the caller fall back to the deterministic engine — the app is
 * always usable.
 *
 * This module is excluded from unit-test coverage because it is a thin network
 * boundary; its behaviour is exercised through the route tests with the client
 * mocked.
 */

import 'server-only';
import { GoogleGenAI } from '@google/genai';

/**
 * Models tried in order, best quality first.
 *
 * A chain rather than a single model, for two reasons. The free tier counts its
 * quota *per project per model* — 20 requests a day each, as the 429 itself
 * reports — so a second model is not merely a backup, it is a second allowance.
 * And an exhausted model fails in milliseconds, which makes falling through the
 * chain nearly free.
 *
 * Only models with real free-tier availability are listed: the 2.0 family and
 * 2.5-pro report a limit of 0/day and would waste a link.
 */
const DEFAULT_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite',
  'gemini-flash-lite-latest',
] as const;

/** Resolved chain. `GEMINI_MODELS` (comma-separated) overrides the default. */
const MODELS: readonly string[] = (
  process.env.GEMINI_MODELS ??
  process.env.GEMINI_MODEL ??
  DEFAULT_MODELS.join(',')
)
  .split(',')
  .map((model) => model.trim())
  .filter((model) => model.length > 0);

/**
 * Budget for the whole chain.
 *
 * A serverless host kills the function long before a fan gives up — Netlify's
 * default is 10s — so every attempt together must finish inside that, or the
 * route returns a 502 instead of a graceful fallback.
 */
const TOTAL_BUDGET_MS = 9_000;

/** Cap on a single attempt, so one slow model cannot eat the whole budget. */
const PER_ATTEMPT_MS = 4_000;

/** Never start an attempt that cannot plausibly finish. */
const MIN_ATTEMPT_MS = 800;

/** Whether a Gemini API key is configured in the environment. */
export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/**
 * Generate text from a system instruction and user prompt, trying each model in
 * the chain until one answers.
 *
 * @returns the model's text, or `null` when every model fails (missing key,
 *   quota, timeout, network or safety block) so callers degrade gracefully.
 */
export async function generateText(
  systemInstruction: string,
  prompt: string
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const client = new GoogleGenAI({ apiKey });
  const deadline = Date.now() + TOTAL_BUDGET_MS;

  for (const model of MODELS) {
    const remaining = deadline - Date.now();
    if (remaining < MIN_ATTEMPT_MS) break;

    const text = await attempt(client, model, systemInstruction, prompt, {
      timeoutMs: Math.min(PER_ATTEMPT_MS, remaining),
    });
    if (text !== null) return text;
  }

  return null;
}

/** One model attempt. Never throws — a failure just means "try the next one". */
async function attempt(
  client: GoogleGenAI,
  model: string,
  systemInstruction: string,
  prompt: string,
  { timeoutMs }: { timeoutMs: number }
): Promise<string | null> {
  try {
    const response = await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        // Thinking off, deliberately. These calls only rephrase facts the
        // engine has already resolved, so reasoning buys nothing — yet it cost
        // 8-18s on 2.5-flash against a 9s budget. Capping output is not the fix
        // either: thinking tokens are billed against maxOutputTokens, so a cap
        // truncates the *answer* while the reasoning runs on. Off, the same
        // call returns in about two seconds.
        thinkingConfig: { thinkingBudget: 0 },
        abortSignal: AbortSignal.timeout(timeoutMs),
      },
    });

    const text = (response.text ?? '').trim();
    return text.length > 0 ? text : null;
  } catch (error) {
    console.error(`[gemini] ${model} failed, falling through:`, error);
    return null;
  }
}
