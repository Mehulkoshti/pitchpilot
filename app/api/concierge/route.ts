/**
 * `POST /api/concierge` — the multilingual AI fan concierge.
 *
 * Validates input, rate-limits by client, grounds the model on real stadium
 * data, and always returns a useful answer: if the AI is unavailable it falls
 * back to the deterministic {@link answerQuery} engine.
 */

import { NextResponse } from 'next/server';
import { answerQuery, buildGroundingContext } from '@/lib/concierge';
import { generateText, isAiConfigured } from '@/lib/gemini';
import { aiRateLimiter, clientKey } from '@/lib/ratelimit';
import { conciergeRequestSchema } from '@/lib/schema';
import { DEFAULT_GATE_READINGS } from '@/lib/stadium-data';

/** Ensure this route runs on the Node.js runtime (uses `server-only` client). */
export const runtime = 'nodejs';

/** Response payload for the concierge endpoint. */
interface ConciergeResponse {
  answer: string;
  intent: string;
  /** Whether the answer came from the AI model or the deterministic fallback. */
  source: 'ai' | 'fallback';
  language: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  const limit = aiRateLimiter.check(clientKey(request.headers), Date.now());
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  const parsed = conciergeRequestSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { message, language, fromNodeId, accessibleOnly, readings } = parsed.data;
  // Ground on the client's telemetry when provided, else a representative snapshot.
  const liveReadings = readings.length > 0 ? readings : DEFAULT_GATE_READINGS;
  const grounded = answerQuery(message, {
    readings: liveReadings,
    fromNodeId,
    accessibleOnly,
  });

  const aiText = isAiConfigured()
    ? await generateText(systemInstruction(language), buildPrompt(message, liveReadings))
    : null;

  const payload: ConciergeResponse = {
    answer: aiText ?? grounded.text,
    intent: grounded.intent,
    source: aiText ? 'ai' : 'fallback',
    language,
  };
  return NextResponse.json(payload);
}

/** System instruction constraining the model to grounded, localised replies. */
function systemInstruction(language: string): string {
  return [
    'You are PitchPilot, a concise, friendly stadium concierge for the FIFA World Cup 2026.',
    `Reply in the language with code "${language}".`,
    'Answer only from the STADIUM FACTS provided. Never invent gates, facilities or times.',
    'Keep replies under 60 words and prioritise the fan getting where they need to go.',
  ].join(' ');
}

/** Compose the user prompt with grounding facts prepended. */
function buildPrompt(message: string, readings: Parameters<typeof buildGroundingContext>[0]): string {
  return `STADIUM FACTS: ${buildGroundingContext(readings)}\n\nFAN QUESTION: ${message}`;
}

/** Parse a request body as JSON, returning `null` on malformed input. */
async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
