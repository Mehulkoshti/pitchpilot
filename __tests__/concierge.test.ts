import { describe, expect, it } from 'vitest';
import { answerQuery, buildGroundingContext, classifyIntent } from '@/lib/concierge';
import type { GateReading } from '@/lib/stadium-data';

const readings: GateReading[] = [
  { gateId: 'gate-a', queue: 300, arrivalPerMin: 20 },
  { gateId: 'gate-b', queue: 20, arrivalPerMin: 10 },
  { gateId: 'gate-c', queue: 90, arrivalPerMin: 20 },
  { gateId: 'gate-d', queue: 150, arrivalPerMin: 10 },
];

describe('classifyIntent', () => {
  it.each([
    ['Which gate is fastest?', 'gate'],
    ['Where is the nearest toilet?', 'restroom'],
    ['I am hungry, where can I eat?', 'food'],
    ['I need first aid', 'medical'],
    ['How do I exit the stadium?', 'exit'],
    ['Which train goes to the airport?', 'transport'],
    ['Is there a wheelchair accessible route?', 'accessibility'],
    ['What is the score?', 'unknown'],
  ])('classifies "%s" as %s', (query, expected) => {
    expect(classifyIntent(query)).toBe(expected);
  });

  it('prioritises accessibility over other matching keywords', () => {
    expect(classifyIntent('accessible route to the gate')).toBe('accessibility');
  });

  it('is case-insensitive', () => {
    expect(classifyIntent('WHERE IS THE EXIT')).toBe('exit');
  });

  it.each([
    ['¿Qué puerta uso?', 'gate'],
    ['¿Dónde está el baño?', 'restroom'],
    ['¿Cómo llego a casa?', 'transport'],
    ['¿Dónde está la salida?', 'exit'],
  ])('understands common Spanish query "%s" as %s', (query, expected) => {
    expect(classifyIntent(query)).toBe(expected);
  });

  it.each([
    ['Where is my seat?', 'seat'],
    ['How do I find seat block 115?', 'seat'],
    ['¿Dónde está mi asiento?', 'seat'],
  ])('routes seat queries to the seat intent, not food ("%s")', (query, expected) => {
    expect(classifyIntent(query)).toBe(expected);
  });

  it.each([
    // Each of these embeds a keyword inside a longer word: 'eat' in 'seat',
    // 'line' in 'airline', 'car' in 'card'. Matching raw substrings misfiled
    // all three.
    ['Which airline lounge is open?', 'unknown'],
    ['I lost my card', 'unknown'],
    ['Great match today', 'unknown'],
  ])('does not match a keyword buried inside another word ("%s")', (query, expected) => {
    expect(classifyIntent(query)).toBe(expected);
  });

  it.each([
    ['Which gates are open?', 'gate'],
    ['Where are the restrooms?', 'restroom'],
    ['¿Dónde están los baños?', 'restroom'],
  ])('still matches natural plurals ("%s")', (query, expected) => {
    expect(classifyIntent(query)).toBe(expected);
  });
});

describe('answerQuery', () => {
  const context = { readings, fromNodeId: 'seat-2-115' };

  it('recommends the least-congested gate', () => {
    const answer = answerQuery('Which gate should I use?', context);
    expect(answer.intent).toBe('gate');
    expect(answer.text).toContain('Gate B');
  });

  it('routes to the nearest restroom', () => {
    const answer = answerQuery('nearest restroom?', context);
    expect(answer.intent).toBe('restroom');
    expect(answer.text.toLowerCase()).toContain('restroom');
  });

  it('gives a transport answer grounded in the greenest option', () => {
    const answer = answerQuery('how do I get home?', context);
    expect(answer.intent).toBe('transport');
    expect(answer.text).toMatch(/kg CO/);
  });

  it('provides a step-free answer for accessibility queries', () => {
    const answer = answerQuery('wheelchair route please', context);
    expect(answer.intent).toBe('accessibility');
  });

  it('routes a step-free query to the facility it actually names', () => {
    const answer = answerQuery('step-free route to the food court?', context);
    expect(answer.intent).toBe('accessibility');
    expect(answer.text).toContain('food');
    expect(answer.text).not.toContain('restroom');
  });

  it('defaults a bare accessibility query to the nearest restroom', () => {
    const answer = answerQuery('is there a wheelchair accessible route?', context);
    expect(answer.intent).toBe('accessibility');
    expect(answer.text).toContain('restroom');
  });

  it('routes a fan to their seat block with a grounded distance', () => {
    const answer = answerQuery('where is my seat?', { readings, fromNodeId: 'gate-a' });
    expect(answer.intent).toBe('seat');
    expect(answer.text).toContain('Seat Block 115');
    expect(answer.text).toMatch(/\d+ m away/);
  });

  it('gives ticket guidance when the fan is already at their seat', () => {
    const answer = answerQuery('where is my seat?', {
      readings,
      fromNodeId: 'seat-2-115',
    });
    expect(answer.intent).toBe('seat');
    expect(answer.text).toContain('ticket');
  });

  it('falls back to a help message for unknown intents', () => {
    const answer = answerQuery('who will win?', context);
    expect(answer.intent).toBe('unknown');
    expect(answer.text).toContain('help');
  });

  it('handles missing gate telemetry gracefully', () => {
    const answer = answerQuery('fastest gate', { readings: [], fromNodeId: 'gate-a' });
    expect(answer.text.length).toBeGreaterThan(0);
  });
});

describe('buildGroundingContext', () => {
  it('includes every gate and the fastest recommendation', () => {
    const context = buildGroundingContext(readings);
    expect(context).toContain('Gate A');
    expect(context).toContain('Gate D');
    expect(context).toContain('Fastest gate');
  });

  it('notes when telemetry is unavailable', () => {
    expect(buildGroundingContext([])).toContain('unavailable');
  });
});
