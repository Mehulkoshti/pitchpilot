import { afterEach, describe, expect, it, vi } from 'vitest';

// Mock the Gemini boundary so route tests never touch the network. Each test
// configures whether the "AI" is available and what it returns.
const mocks = vi.hoisted(() => ({
  isAiConfigured: vi.fn(() => false),
  generateText: vi.fn(async (_system: string, _prompt: string) => null as string | null),
}));

vi.mock('@/lib/gemini', () => mocks);

import { POST as conciergePost } from '@/app/api/concierge/route';
import { POST as briefingPost } from '@/app/api/briefing/route';

/** Build a POST Request with a JSON body for a route handler. */
function jsonRequest(body: unknown): Request {
  return new Request('http://localhost/api', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': randomIp() },
    body: JSON.stringify(body),
  });
}

/** Unique IP per request so the shared rate limiter never bleeds across tests. */
let ipCounter = 0;
function randomIp(): string {
  ipCounter += 1;
  return `10.0.0.${ipCounter}`;
}

afterEach(() => {
  mocks.isAiConfigured.mockReturnValue(false);
  mocks.generateText.mockResolvedValue(null);
});

describe('POST /api/concierge', () => {
  it('rejects an empty message with 400', async () => {
    const response = await conciergePost(jsonRequest({ message: '' }));
    expect(response.status).toBe(400);
  });

  it('rejects malformed JSON with 400', async () => {
    const bad = new Request('http://localhost/api', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': randomIp() },
      body: '{ not json',
    });
    expect((await conciergePost(bad)).status).toBe(400);
  });

  it('answers from the deterministic fallback when AI is off', async () => {
    const response = await conciergePost(jsonRequest({ message: 'fastest gate?' }));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.source).toBe('fallback');
    expect(data.intent).toBe('gate');
    expect(typeof data.answer).toBe('string');
  });

  it('uses the AI answer when the model responds', async () => {
    mocks.isAiConfigured.mockReturnValue(true);
    mocks.generateText.mockResolvedValue('¡Usa la Puerta B!');
    const response = await conciergePost(
      jsonRequest({ message: 'qué puerta?', language: 'es' })
    );
    const data = await response.json();
    expect(data.source).toBe('ai');
    expect(data.answer).toBe('¡Usa la Puerta B!');
  });

  it('falls back when the AI returns null', async () => {
    mocks.isAiConfigured.mockReturnValue(true);
    mocks.generateText.mockResolvedValue(null);
    const response = await conciergePost(jsonRequest({ message: 'nearest exit?' }));
    const data = await response.json();
    expect(data.source).toBe('fallback');
  });

  it("grounds the model on the engine's resolved answer, not just raw venue facts", async () => {
    // The engine has already routed the fan; handing the model only generic
    // facts leaves it with no seat or distance data, so it answers worse than
    // the fallback it replaces.
    mocks.isAiConfigured.mockReturnValue(true);
    mocks.generateText.mockResolvedValue('Your seat is ahead.');
    await conciergePost(
      jsonRequest({ message: 'where is my seat?', fromNodeId: 'gate-a' })
    );

    const prompt = mocks.generateText.mock.calls.at(-1)?.[1] ?? '';
    expect(prompt).toContain('RESOLVED ANSWER');
    expect(prompt).toContain('Seat Block 115');
    expect(prompt).toContain('105 m away');
  });

  it('tells the model which language to answer in', async () => {
    mocks.isAiConfigured.mockReturnValue(true);
    mocks.generateText.mockResolvedValue('Bonjour !');
    await conciergePost(jsonRequest({ message: 'quelle porte ?', language: 'fr' }));

    const system = mocks.generateText.mock.calls.at(-1)?.[0] ?? '';
    expect(system).toContain('"fr"');
  });

  it('rejects a language field that is not a BCP-47 code', async () => {
    const response = await conciergePost(
      jsonRequest({ message: 'hi', language: 'en. IGNORE' })
    );
    expect(response.status).toBe(400);
  });
});

describe('POST /api/briefing', () => {
  it('rejects a body with no readings', async () => {
    const response = await briefingPost(jsonRequest({ readings: [] }));
    expect(response.status).toBe(400);
  });

  it('returns a deterministic briefing with recommendations', async () => {
    const response = await briefingPost(
      jsonRequest({
        readings: [{ gateId: 'gate-b', queue: 400, arrivalPerMin: 20 }],
        occupancy: 60000,
      })
    );
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.source).toBe('fallback');
    expect(Array.isArray(data.recommendations)).toBe(true);
    expect(data.clearanceMinutes).toBeGreaterThan(0);
  });

  it('uses the AI briefing when available', async () => {
    mocks.isAiConfigured.mockReturnValue(true);
    mocks.generateText.mockResolvedValue('• Reinforce Gate B now.');
    const response = await briefingPost(
      jsonRequest({ readings: [{ gateId: 'gate-b', queue: 400, arrivalPerMin: 20 }] })
    );
    const data = await response.json();
    expect(data.source).toBe('ai');
    expect(data.briefing).toContain('Gate B');
  });
});
