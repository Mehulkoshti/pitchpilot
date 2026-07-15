import { describe, expect, it } from 'vitest';
import {
  crowdFootprintTonnes,
  estimateTrip,
  rankTransport,
} from '@/lib/sustainability';
import { TRANSPORT_OPTIONS } from '@/lib/stadium-data';

const car = TRANSPORT_OPTIONS.find((option) => option.id === 'car')!;
const rail = TRANSPORT_OPTIONS.find((option) => option.id === 'rail')!;

describe('estimateTrip', () => {
  it('computes a round-trip footprint in kilograms', () => {
    // 171 g/km * 8 km * 2 = 2736 g = 2.74 kg
    expect(estimateTrip(car, 8)).toBe(2.74);
  });

  it('returns 0 for a zero-emission mode', () => {
    const walk = TRANSPORT_OPTIONS.find((option) => option.id === 'walk')!;
    expect(estimateTrip(walk, 10)).toBe(0);
  });

  it('treats negative distance as zero', () => {
    expect(estimateTrip(car, -5)).toBe(0);
  });
});

describe('rankTransport', () => {
  it('orders options from greenest to dirtiest', () => {
    const ranked = rankTransport(10);
    const emissions = ranked.map((option) => option.kgCo2e);
    const sorted = [...emissions].sort((a, b) => a - b);
    expect(emissions).toEqual(sorted);
  });

  it('places walking first as the greenest option', () => {
    expect(rankTransport(10)[0]?.optionId).toBe('walk');
  });

  it('computes the saving versus a private car', () => {
    const railEstimate = rankTransport(10).find((option) => option.optionId === 'rail');
    expect(railEstimate?.percentVsCar).toBeGreaterThan(0);
    expect(railEstimate?.percentVsCar).toBeLessThanOrEqual(100);
  });

  it('reports the car itself as 0% saving', () => {
    const carEstimate = rankTransport(10).find((option) => option.optionId === 'car');
    expect(carEstimate?.percentVsCar).toBe(0);
  });
});

describe('crowdFootprintTonnes', () => {
  it('aggregates a crowd footprint across a modal split', () => {
    const tonnes = crowdFootprintTonnes(1000, { car: 0.5, rail: 0.5 }, 10);
    const expected =
      ((1000 * 0.5 * estimateTrip(car, 10) + 1000 * 0.5 * estimateTrip(rail, 10)) / 1000);
    expect(tonnes).toBeCloseTo(expected, 2);
  });

  it('ignores unknown modes in the split', () => {
    expect(crowdFootprintTonnes(1000, { helicopter: 1 }, 10)).toBe(0);
  });

  it('clamps modal shares above 1', () => {
    const capped = crowdFootprintTonnes(100, { car: 5 }, 10);
    const atOne = crowdFootprintTonnes(100, { car: 1 }, 10);
    expect(capped).toBe(atOne);
  });

  it('treats negative attendee counts as zero', () => {
    expect(crowdFootprintTonnes(-100, { car: 1 }, 10)).toBe(0);
  });
});
