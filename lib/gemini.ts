/**
 * Server-only Google Gemini wrapper. The API key never reaches the browser, and
 * any failure resolves to `null` so callers fall back to the deterministic
 * engine.
 */

import 'server-only';
import { GoogleGenAI } from '@google/genai';

/**
 * Models tried in order, best quality first. Free-tier quota is counted per
 * project per model, so a second model is also a second daily allowance; an
 * exhausted model fails in milliseconds, making fall-through cheap.
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

/** Budget for the whole chain, kept under a serverless function's ~10s limit. */
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
        // Off: these calls only rephrase already-resolved facts, and thinking
        // pushed 2.5-flash to 8-18s (its tokens also count against any output cap).
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
