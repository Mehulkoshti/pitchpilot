import { describe, expect, it } from 'vitest';
import { evacuationLoad } from '@/lib/crowd';
import {
  DEFAULT_OCCUPANCY,
  EDGES,
  EGRESS_TARGET_MINUTES,
  EXIT_COUNT,
  EXIT_WIDTH_M,
  EXIT_THROUGHPUT_PER_MIN,
  GATES,
  NODES,
  RATE_OF_PASSAGE_STEPPED,
  VENUES,
  findGate,
  findNode,
} from '@/lib/stadium-data';
import type { Venue } from '@/lib/stadium-data';

describe('stadium data integrity', () => {
  it('has unique node ids', () => {
    const ids = NODES.map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique gate ids', () => {
    const ids = GATES.map((gate) => gate.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only references known nodes in edges', () => {
    const nodeIds = new Set(NODES.map((node) => node.id));
    for (const edge of EDGES) {
      expect(nodeIds.has(edge.from)).toBe(true);
      expect(nodeIds.has(edge.to)).toBe(true);
    }
  });

  it('has positive edge distances', () => {
    for (const edge of EDGES) expect(edge.distanceM).toBeGreaterThan(0);
  });

  it('covers all three host countries', () => {
    const countries = new Set(VENUES.map((venue) => venue.country));
    expect(countries).toEqual(new Set(['USA', 'Canada', 'Mexico']));
  });

  it('seeds all sixteen host venues, split 11/3/2 across the hosts', () => {
    expect(VENUES).toHaveLength(16);
    const byCountry = (country: Venue['country']): number =>
      VENUES.filter((venue) => venue.country === country).length;
    expect(byCountry('USA')).toBe(11);
    expect(byCountry('Mexico')).toBe(3);
    expect(byCountry('Canada')).toBe(2);
  });

  it('has unique venue ids', () => {
    const ids = VENUES.map((venue) => venue.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('lists venues largest-capacity first', () => {
    const capacities = VENUES.map((venue) => venue.capacity);
    expect(capacities).toEqual([...capacities].sort((a, b) => b - a));
  });

  it('keeps gate open lanes within max lanes', () => {
    for (const gate of GATES) expect(gate.openLanes).toBeLessThanOrEqual(gate.maxLanes);
  });
});

describe('emergency egress model', () => {
  it('derives per-exit throughput from the Green Guide rate of passage', () => {
    expect(EXIT_THROUGHPUT_PER_MIN).toBe(RATE_OF_PASSAGE_STEPPED * EXIT_WIDTH_M);
  });

  it('clears the seeded occupancy inside the Green Guide 8-minute limit', () => {
    const { clearanceMinutes } = evacuationLoad(
      DEFAULT_OCCUPANCY,
      EXIT_COUNT,
      EXIT_THROUGHPUT_PER_MIN
    );
    expect(clearanceMinutes).toBeLessThanOrEqual(EGRESS_TARGET_MINUTES);
  });

  it('provides enough aggregate egress width to be physically plausible', () => {
    // 61,000 fans in 8 minutes needs ~7,625 people/min of flow; at 66 per metre
    // per minute that is ~115 m of exit width. Anything far below this is a
    // model that cannot hold, however tidy its arithmetic.
    const requiredFlowPerMin = DEFAULT_OCCUPANCY / EGRESS_TARGET_MINUTES;
    const requiredWidthM = requiredFlowPerMin / RATE_OF_PASSAGE_STEPPED;
    expect(EXIT_COUNT * EXIT_WIDTH_M).toBeGreaterThanOrEqual(requiredWidthM);
  });

  it('goes over target when exits are lost, rather than silently passing', () => {
    const { clearanceMinutes } = evacuationLoad(
      DEFAULT_OCCUPANCY,
      Math.floor(EXIT_COUNT / 2),
      EXIT_THROUGHPUT_PER_MIN
    );
    expect(clearanceMinutes).toBeGreaterThan(EGRESS_TARGET_MINUTES);
  });
});

describe('lookups', () => {
  it('finds a node by id', () => {
    expect(findNode('gate-a')?.type).toBe('gate');
  });

  it('returns undefined for an unknown node', () => {
    expect(findNode('nope')).toBeUndefined();
  });

  it('finds a gate by id', () => {
    expect(findGate('gate-b')?.label).toContain('Gate B');
  });

  it('returns undefined for an unknown gate', () => {
    expect(findGate('nope')).toBeUndefined();
  });
});
