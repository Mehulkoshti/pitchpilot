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
    ? await generateText(
        systemInstruction(language),
        buildPrompt(message, liveReadings, grounded.text)
      )
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
    `Write your reply entirely in the language identified by the BCP-47 code "${language}".`,
    'Never mention, echo or prefix that code — reply with the answer text only.',
    'Answer only from the STADIUM FACTS and RESOLVED ANSWER provided.',
    'RESOLVED ANSWER comes from the stadium routing engine and is authoritative: keep its',
    'gates, distances, routes and times exactly as given, and never contradict it or claim',
    'not to know something it already answers. Your job is to phrase it naturally.',
    'Never invent gates, facilities or times.',
    'Keep replies under 60 words and prioritise the fan getting where they need to go.',
  ].join(' ');
}

/**
 * Compose the user prompt from the grounding facts and the engine's own answer.
 *
 * The deterministic engine has already resolved the question against the live
 * graph, so handing the model that answer — not just raw venue facts — keeps the
 * AI a *language* layer over correct maths. Without it the model has no route or
 * seat data to work from and will answer less accurately than the fallback it is
 * replacing.
 */
function buildPrompt(
  message: string,
  readings: Parameters<typeof buildGroundingContext>[0],
  resolvedAnswer: string
): string {
  return [
    `STADIUM FACTS: ${buildGroundingContext(readings)}`,
    `RESOLVED ANSWER: ${resolvedAnswer}`,
    `FAN QUESTION: ${message}`,
  ].join('\n\n');
}

/** Parse a request body as JSON, returning `null` on malformed input. */
async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
