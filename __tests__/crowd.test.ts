import { describe, expect, it } from 'vitest';
import {
  congestionLevel,
  effectiveThroughput,
  estimateWaitMinutes,
  evacuationLoad,
  gateStatus,
  recommendGate,
  recommendLaneChanges,
} from '@/lib/crowd';
import type { Gate, GateReading } from '@/lib/stadium-data';

const gate: Gate = {
  id: 'gate-a',
  label: 'Gate A',
  throughputPerMin: 40,
  openLanes: 5,
  maxLanes: 10,
};

describe('effectiveThroughput', () => {
  it('scales throughput by the open-lane ratio', () => {
    expect(effectiveThroughput(gate)).toBe(20);
  });

  it('returns full throughput when all lanes are open', () => {
    expect(effectiveThroughput({ ...gate, openLanes: 10 })).toBe(40);
  });

  it('returns 0 when no lanes are open', () => {
    expect(effectiveThroughput({ ...gate, openLanes: 0 })).toBe(0);
  });

  it('returns 0 when maxLanes is 0 (avoids divide-by-zero)', () => {
    expect(effectiveThroughput({ ...gate, maxLanes: 0 })).toBe(0);
  });

  it('clamps when openLanes exceeds maxLanes', () => {
    expect(effectiveThroughput({ ...gate, openLanes: 20, maxLanes: 10 })).toBe(40);
  });
});

describe('estimateWaitMinutes', () => {
  it('divides queue by effective throughput', () => {
    const reading: GateReading = { gateId: 'gate-a', queue: 100, arrivalPerMin: 10 };
    expect(estimateWaitMinutes(reading, gate)).toBe(5);
  });

  it('returns 0 for an empty queue', () => {
    const reading: GateReading = { gateId: 'gate-a', queue: 0, arrivalPerMin: 10 };
    expect(estimateWaitMinutes(reading, gate)).toBe(0);
  });

  it('returns Infinity when throughput is 0', () => {
    const reading: GateReading = { gateId: 'gate-a', queue: 50, arrivalPerMin: 10 };
    expect(estimateWaitMinutes(reading, { ...gate, openLanes: 0 })).toBe(Infinity);
  });

  it('rounds to one decimal place', () => {
    const reading: GateReading = { gateId: 'gate-a', queue: 33, arrivalPerMin: 0 };
    expect(estimateWaitMinutes(reading, gate)).toBe(1.7);
  });

  it('is unaffected by arrivals, which queue up behind the fan', () => {
    // Under FIFO a fan waits only for those already ahead of them, so a surge of
    // late arrivals must not change this fan's estimate. Netting arrivals off
    // the service rate here would drive the wait negative or infinite.
    const calm: GateReading = { gateId: 'gate-a', queue: 100, arrivalPerMin: 0 };
    const surge: GateReading = { gateId: 'gate-a', queue: 100, arrivalPerMin: 999 };
    expect(estimateWaitMinutes(surge, gate)).toBe(estimateWaitMinutes(calm, gate));
    expect(estimateWaitMinutes(surge, gate)).toBe(5);
  });
});

describe('congestionLevel', () => {
  it.each([
    [0, 'low'],
    [4.9, 'low'],
    [5, 'moderate'],
    [11.9, 'moderate'],
    [12, 'high'],
    [19.9, 'high'],
    [20, 'critical'],
    [Infinity, 'critical'],
  ])('maps %s min to %s', (minutes, expected) => {
    expect(congestionLevel(minutes)).toBe(expected);
  });
});

describe('gateStatus', () => {
  it('flags a growing backlog when arrivals exceed throughput', () => {
    // throughput = 40 * (5/10) = 20/min; queue 500 => 25 min => critical.
    const reading: GateReading = { gateId: 'gate-a', queue: 500, arrivalPerMin: 30 };
    const status = gateStatus(reading, gate);
    expect(status.isBacklogGrowing).toBe(true);
    expect(status.level).toBe('critical');
  });

  it('does not flag a backlog when throughput exceeds arrivals', () => {
    const reading: GateReading = { gateId: 'gate-a', queue: 20, arrivalPerMin: 10 };
    expect(gateStatus(reading, gate).isBacklogGrowing).toBe(false);
  });
});

describe('recommendGate', () => {
  const gates: Gate[] = [
    gate,
    { id: 'gate-b', label: 'Gate B', throughputPerMin: 60, openLanes: 6, maxLanes: 6 },
  ];

  it('picks the gate with the shortest wait', () => {
    const readings: GateReading[] = [
      { gateId: 'gate-a', queue: 200, arrivalPerMin: 10 },
      { gateId: 'gate-b', queue: 60, arrivalPerMin: 10 },
    ];
    expect(recommendGate(readings, gates)?.gateId).toBe('gate-b');
  });

  it('returns null when there are no readings', () => {
    expect(recommendGate([], gates)).toBeNull();
  });

  it('ignores readings for unknown gates', () => {
    const readings: GateReading[] = [{ gateId: 'ghost', queue: 1, arrivalPerMin: 1 }];
    expect(recommendGate(readings, gates)).toBeNull();
  });
});

describe('recommendLaneChanges', () => {
  it('suggests opening spare lanes for a highly congested gate', () => {
    const readings: GateReading[] = [{ gateId: 'gate-a', queue: 300, arrivalPerMin: 10 }];
    const recs = recommendLaneChanges(readings, [gate]);
    expect(recs).toHaveLength(1);
    expect(recs[0]?.openExtraLanes).toBe(5);
  });

  it('advises redirecting when the gate is already at full staffing', () => {
    const full: Gate = { ...gate, openLanes: 10, maxLanes: 10 };
    const readings: GateReading[] = [{ gateId: 'gate-a', queue: 600, arrivalPerMin: 10 }];
    const recs = recommendLaneChanges(readings, [full]);
    expect(recs[0]?.openExtraLanes).toBe(0);
    expect(recs[0]?.reason).toContain('redirect');
  });

  it('returns nothing when all gates flow within target', () => {
    const readings: GateReading[] = [{ gateId: 'gate-a', queue: 10, arrivalPerMin: 5 }];
    expect(recommendLaneChanges(readings, [gate])).toHaveLength(0);
  });
});

describe('evacuationLoad', () => {
  it('distributes occupancy evenly across exits', () => {
    expect(evacuationLoad(720, 8, 90)).toEqual({ perExit: 90, clearanceMinutes: 1 });
  });

  it('rounds fans-per-exit up so no one is stranded', () => {
    expect(evacuationLoad(721, 8, 90).perExit).toBe(91);
  });

  it('returns Infinity clearance for zero exits', () => {
    expect(evacuationLoad(100, 0, 90).clearanceMinutes).toBe(Infinity);
  });

  it('treats negative occupancy as zero', () => {
    expect(evacuationLoad(-50, 4, 10).perExit).toBe(0);
  });
});
