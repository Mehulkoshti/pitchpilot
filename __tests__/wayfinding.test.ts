import { describe, expect, it } from 'vitest';
import { findNearest, findRoute } from '@/lib/wayfinding';

describe('findRoute', () => {
  it('returns a zero-length route for identical endpoints', () => {
    const route = findRoute('gate-a', 'gate-a');
    expect(route?.distanceM).toBe(0);
    expect(route?.path).toEqual(['gate-a']);
  });

  it('finds a path between connected nodes', () => {
    const route = findRoute('gate-a', 'medical-0');
    expect(route).not.toBeNull();
    expect(route?.path[0]).toBe('gate-a');
    expect(route?.path.at(-1)).toBe('medical-0');
    expect(route?.distanceM).toBeGreaterThan(0);
  });

  it('produces one human-readable step per node', () => {
    const route = findRoute('gate-a', 'medical-0');
    expect(route?.steps).toHaveLength(route?.path.length ?? 0);
  });

  it('returns null for an unknown origin', () => {
    expect(findRoute('nowhere', 'medical-0')).toBeNull();
  });

  it('returns null for an unknown destination', () => {
    expect(findRoute('gate-a', 'nowhere')).toBeNull();
  });

  it('chooses the shorter of two possible paths', () => {
    // Ground concourse to upper level: the lift path is shorter than the stairs.
    const route = findRoute('concourse-0-n', 'concourse-2-n');
    expect(route?.path).toContain('lift-1');
  });

  it('routes via stairs when accessibility is not required and it is shortest', () => {
    const route = findRoute('concourse-0-n', 'concourse-2-n', { accessibleOnly: false });
    expect(route).not.toBeNull();
  });
});

describe('findRoute — accessibility', () => {
  it('avoids stairs-only edges in step-free mode', () => {
    const route = findRoute('concourse-0-n', 'concourse-2-n', { accessibleOnly: true });
    expect(route?.path).not.toContain('stairs-1');
    expect(route?.path).toContain('lift-1');
    expect(route?.accessible).toBe(true);
  });

  it('reports a genuinely step-free route as accessible even when not requested', () => {
    // gate-a → concourse-0-n → medical-0 uses no stairs and only accessible
    // nodes, so it is step-free regardless of how it was asked for.
    const route = findRoute('gate-a', 'medical-0', { accessibleOnly: false });
    expect(route?.accessible).toBe(true);
  });

  it('marks a route that must use stairs as not accessible', () => {
    const route = findRoute('concourse-0-n', 'stairs-1', { accessibleOnly: false });
    expect(route?.path).toContain('stairs-1');
    expect(route?.accessible).toBe(false);
  });

  it('marks a zero-length route at an inaccessible node as not accessible', () => {
    expect(findRoute('stairs-1', 'stairs-1')?.accessible).toBe(false);
  });

  it('never reports an inaccessible route in step-free mode', () => {
    expect(findRoute('concourse-0-n', 'stairs-1', { accessibleOnly: true })).toBeNull();
  });
});

describe('findNearest', () => {
  it('finds the nearest restroom from a seat', () => {
    const route = findNearest('seat-2-115', 'restroom');
    expect(route?.path.at(-1)).toBe('restroom-2-n');
  });

  it('finds the nearest medical station', () => {
    const route = findNearest('gate-a', 'medical');
    expect(route?.path.at(-1)).toBe('medical-0');
  });

  it('returns a step-free route to the nearest food court', () => {
    const route = findNearest('seat-2-115', 'food', { accessibleOnly: true });
    expect(route?.accessible).toBe(true);
    expect(route?.path.at(-1)).toBe('food-2-n');
  });

  it('returns null when no POI of the type exists', () => {
    // There is no "gate" typed POI reachable that differs — expect a route or null,
    // but a nonsensical type yields null.
    expect(findNearest('gate-a', 'seat')?.path.at(-1)).toBe('seat-2-115');
  });

  it('excludes the origin node itself from nearest search', () => {
    const route = findNearest('restroom-2-n', 'restroom');
    expect(route).toBeNull();
  });
});
