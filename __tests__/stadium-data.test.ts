import { describe, expect, it } from 'vitest';
import {
  EDGES,
  GATES,
  NODES,
  VENUES,
  findGate,
  findNode,
} from '@/lib/stadium-data';

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

  it('keeps gate open lanes within max lanes', () => {
    for (const gate of GATES) expect(gate.openLanes).toBeLessThanOrEqual(gate.maxLanes);
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
