/**
 * `POST /api/briefing` — the operations decision-support briefing.
 *
 * Turns live gate telemetry into a prioritised, natural-language briefing for
 * venue staff. The deterministic engine computes the recommendations; the AI
 * layer phrases them as a crisp shift briefing. Falls back to a structured text
 * briefing when the AI is unavailable, so operators are never left without one.
 */

import { NextResponse } from 'next/server';
import { evacuationLoad, gateStatus, recommendLaneChanges } from '@/lib/crowd';
import type { LaneRecommendation } from '@/lib/crowd';
import { generateText, isAiConfigured } from '@/lib/gemini';
import { aiRateLimiter, clientKey } from '@/lib/ratelimit';
import { briefingRequestSchema } from '@/lib/schema';
import { GATES, findGate } from '@/lib/stadium-data';

export const runtime = 'nodejs';

/** Evacuation model constants for the flagship venue. */
const EXIT_COUNT = 8;
const EXIT_THROUGHPUT_PER_MIN = 90;

/** Response payload for the briefing endpoint. */
interface BriefingResponse {
  briefing: string;
  recommendations: LaneRecommendation[];
  clearanceMinutes: number;
  source: 'ai' | 'fallback';
}

export async function POST(request: Request): Promise<NextResponse> {
  const limit = aiRateLimiter.check(clientKey(request.headers), Date.now());
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  const parsed = briefingRequestSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { readings, occupancy } = parsed.data;
  const recommendations = recommendLaneChanges(readings, GATES);
  const { clearanceMinutes } = evacuationLoad(
    occupancy,
    EXIT_COUNT,
    EXIT_THROUGHPUT_PER_MIN
  );
  const facts = summariseReadings(readings);

  const aiText = isAiConfigured()
    ? await generateText(
        BRIEFING_SYSTEM,
        buildPrompt(facts, recommendations, clearanceMinutes)
      )
    : null;

  const payload: BriefingResponse = {
    briefing: aiText ?? deterministicBriefing(recommendations, clearanceMinutes),
    recommendations,
    clearanceMinutes,
    source: aiText ? 'ai' : 'fallback',
  };
  return NextResponse.json(payload);
}

/** System instruction for a professional, action-first ops briefing. */
const BRIEFING_SYSTEM = [
  'You are the operations control assistant for a FIFA World Cup 2026 stadium.',
  'Write a briefing for venue staff: 3-4 short bullet points, action-first, no fluff.',
  'Use only the FACTS provided. Prioritise the most congested gate and evacuation readiness.',
].join(' ');

/** Compose the ops prompt from computed facts. */
function buildPrompt(
  facts: string,
  recommendations: readonly LaneRecommendation[],
  clearanceMinutes: number
): string {
  const recs = recommendations.map((rec) => `- ${rec.label}: ${rec.reason}`).join('\n');
  return [
    `FACTS:\n${facts}`,
    `LANE RECOMMENDATIONS:\n${recs || '- none'}`,
    `EVACUATION CLEARANCE: ~${clearanceMinutes} min`,
  ].join('\n\n');
}

/** One line per gate summarising its live status for the prompt/fallback. */
function summariseReadings(readings: Parameters<typeof recommendLaneChanges>[0]): string {
  return readings
    .map((reading) => {
      const gate = findGate(reading.gateId);
      if (!gate) return `${reading.gateId}: unknown gate`;
      const status = gateStatus(reading, gate);
      return `${status.label}: ${status.queue} queued, ~${status.waitMinutes} min (${status.level})`;
    })
    .join('\n');
}

/** Structured fallback briefing when the AI layer is unavailable. */
function deterministicBriefing(
  recommendations: readonly LaneRecommendation[],
  clearanceMinutes: number
): string {
  const lines = recommendations.map((rec) => `• ${rec.label}: ${rec.reason}`);
  if (lines.length === 0) lines.push('• All gates flowing within target wait times.');
  lines.push(
    `• Evacuation clearance estimate: ~${clearanceMinutes} min across ${EXIT_COUNT} exits.`
  );
  return lines.join('\n');
}

/** Parse a request body as JSON, returning `null` on malformed input. */
async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
