/**
 * Google Gemini client wrapper (server-only).
 *
 * Centralises all Generative-AI calls. The API key is read from the server
 * environment and never shipped to the browser. Every call is wrapped so a
 * missing key, network error or model timeout resolves to `null`, letting the
 * caller fall back to the deterministic engine — the app is always usable.
 *
 * This module is excluded from unit-test coverage because it is a thin network
 * boundary; its behaviour is exercised through the route tests with the client
 * mocked.
 */

import 'server-only';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Model used for both concierge replies and ops briefings. Overridable via the
 * `GEMINI_MODEL` environment variable so the deployment can track the latest
 * available Flash model without a code change.
 */
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
/** Hard cap on generation latency before we fall back (ms). */
const TIMEOUT_MS = 8_000;

/** Whether a Gemini API key is configured in the environment. */
export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/**
 * Generate text from a system instruction and user prompt.
 *
 * @returns the model's text, or `null` on any failure (missing key, timeout,
 *   network or safety block) so callers can degrade gracefully.
 */
export async function generateText(
  systemInstruction: string,
  prompt: string
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: MODEL, systemInstruction });
    const result = await withTimeout(model.generateContent(prompt), TIMEOUT_MS);
    const text = result.response.text().trim();
    return text.length > 0 ? text : null;
  } catch (error) {
    console.error('[gemini] generation failed, using fallback:', error);
    return null;
  }
}

/** Reject a promise if it does not settle within `ms` milliseconds. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('gemini timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}
