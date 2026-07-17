import { describe, expect, it } from 'vitest';
import {
  briefingRequestSchema,
  conciergeRequestSchema,
  gateReadingSchema,
} from '@/lib/schema';

describe('gateReadingSchema', () => {
  it('accepts a valid reading', () => {
    const result = gateReadingSchema.safeParse({
      gateId: 'gate-a',
      queue: 50,
      arrivalPerMin: 30,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a negative queue', () => {
    const result = gateReadingSchema.safeParse({
      gateId: 'gate-a',
      queue: -1,
      arrivalPerMin: 30,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-integer queue', () => {
    const result = gateReadingSchema.safeParse({
      gateId: 'gate-a',
      queue: 1.5,
      arrivalPerMin: 30,
    });
    expect(result.success).toBe(false);
  });
});

describe('conciergeRequestSchema', () => {
  it('applies defaults for optional fields', () => {
    const parsed = conciergeRequestSchema.parse({ message: 'hi' });
    expect(parsed.language).toBe('en');
    expect(parsed.fromNodeId).toBe('gate-a');
    expect(parsed.accessibleOnly).toBe(false);
    expect(parsed.readings).toEqual([]);
  });

  it('trims and rejects an empty message', () => {
    expect(conciergeRequestSchema.safeParse({ message: '   ' }).success).toBe(false);
  });

  it('rejects a message over the length limit', () => {
    const long = 'a'.repeat(501);
    expect(conciergeRequestSchema.safeParse({ message: long }).success).toBe(false);
  });

  it('caps the number of readings', () => {
    const readings = Array.from({ length: 21 }, () => ({
      gateId: 'g',
      queue: 1,
      arrivalPerMin: 1,
    }));
    expect(conciergeRequestSchema.safeParse({ message: 'hi', readings }).success).toBe(
      false
    );
  });
});

describe('briefingRequestSchema', () => {
  it('requires at least one reading', () => {
    expect(briefingRequestSchema.safeParse({ readings: [] }).success).toBe(false);
  });

  it('defaults occupancy to 0', () => {
    const parsed = briefingRequestSchema.parse({
      readings: [{ gateId: 'gate-a', queue: 10, arrivalPerMin: 5 }],
    });
    expect(parsed.occupancy).toBe(0);
  });
});
