/**
 * Crowd-flow engine.
 *
 * A pure, deterministic model of gate queues used for congestion monitoring and
 * real-time entry recommendations. Every function is a total function of its
 * inputs — no I/O, no clock — so behaviour is fully reproducible and testable.
 */

import { clamp, round } from './math';
import type { Gate, GateReading } from './stadium-data';

/** Ordered congestion bands from calmest to most severe. */
export type CongestionLevel = 'low' | 'moderate' | 'high' | 'critical';

/** Wait-time thresholds (minutes) that separate the congestion bands. */
export const WAIT_THRESHOLDS_MIN = { moderate: 5, high: 12, critical: 20 } as const;

/** A fully derived, display-ready status for one gate. */
export interface GateStatus {
  readonly gateId: string;
  readonly label: string;
  /** Effective fans-per-minute given the number of open lanes. */
  readonly effectiveThroughput: number;
  readonly queue: number;
  readonly arrivalPerMin: number;
  /** Estimated minutes for a fan joining the queue now to pass through. */
  readonly waitMinutes: number;
  readonly level: CongestionLevel;
  /** True when the queue is growing faster than the gate can clear it. */
  readonly isBacklogGrowing: boolean;
}

/**
 * Effective throughput for a gate, scaled by how many of its lanes are open.
 *
 * @returns fans per minute, never negative.
 */
export function effectiveThroughput(gate: Gate): number {
  if (gate.maxLanes <= 0) return 0;
  const openRatio = clamp(gate.openLanes / gate.maxLanes, 0, 1);
  return round(gate.throughputPerMin * openRatio);
}

/**
 * Estimated wait for a fan joining now: `queue / throughput` under FIFO.
 * Arrivals are excluded (they queue behind this fan) — they only drive
 * {@link GateStatus.isBacklogGrowing}. Returns `Infinity` when no lane is open.
 */
export function estimateWaitMinutes(reading: GateReading, gate: Gate): number {
  const throughput = effectiveThroughput(gate);
  if (throughput <= 0) return Infinity;
  if (reading.queue <= 0) return 0;
  return round(reading.queue / throughput);
}

/** Map a wait time in minutes to a congestion band. */
export function congestionLevel(waitMinutes: number): CongestionLevel {
  if (waitMinutes >= WAIT_THRESHOLDS_MIN.critical) return 'critical';
  if (waitMinutes >= WAIT_THRESHOLDS_MIN.high) return 'high';
  if (waitMinutes >= WAIT_THRESHOLDS_MIN.moderate) return 'moderate';
  return 'low';
}

/** Derive a complete {@link GateStatus} from a reading and its gate config. */
export function gateStatus(reading: GateReading, gate: Gate): GateStatus {
  const throughput = effectiveThroughput(gate);
  const waitMinutes = estimateWaitMinutes(reading, gate);
  return {
    gateId: gate.id,
    label: gate.label,
    effectiveThroughput: throughput,
    queue: reading.queue,
    arrivalPerMin: reading.arrivalPerMin,
    waitMinutes,
    level: congestionLevel(waitMinutes),
    isBacklogGrowing: reading.arrivalPerMin > throughput,
  };
}

/**
 * Recommend the gate with the shortest wait among the open gates.
 *
 * @returns the best {@link GateStatus}, or `null` when no gate/reading pairs.
 */
export function recommendGate(
  readings: readonly GateReading[],
  gates: readonly Gate[]
): GateStatus | null {
  const gateById = new Map(gates.map((gate) => [gate.id, gate]));
  let best: GateStatus | null = null;
  for (const reading of readings) {
    const gate = gateById.get(reading.gateId);
    if (!gate) continue;
    const status = gateStatus(reading, gate);
    if (best === null || status.waitMinutes < best.waitMinutes) best = status;
  }
  return best;
}

/** A staffing recommendation surfaced to venue operations. */
export interface LaneRecommendation {
  readonly gateId: string;
  readonly label: string;
  /** Additional lanes to open (0 when none are needed or available). */
  readonly openExtraLanes: number;
  readonly reason: string;
}

/**
 * Suggest opening extra lanes at any gate whose wait exceeds the `high` band
 * while spare lanes remain. Gates already at capacity are reported with zero
 * extra lanes so operators still see the pressure.
 */
export function recommendLaneChanges(
  readings: readonly GateReading[],
  gates: readonly Gate[]
): LaneRecommendation[] {
  const gateById = new Map(gates.map((gate) => [gate.id, gate]));
  const recommendations: LaneRecommendation[] = [];
  for (const reading of readings) {
    const gate = gateById.get(reading.gateId);
    if (!gate) continue;
    const status = gateStatus(reading, gate);
    if (status.waitMinutes < WAIT_THRESHOLDS_MIN.high) continue;
    const spare = Math.max(0, gate.maxLanes - gate.openLanes);
    recommendations.push({
      gateId: gate.id,
      label: gate.label,
      openExtraLanes: spare,
      reason:
        spare > 0
          ? `Wait ${status.waitMinutes} min — open ${spare} more lane(s) to relieve the queue.`
          : `Wait ${status.waitMinutes} min at full staffing — redirect arrivals to a calmer gate.`,
    });
  }
  return recommendations;
}

/**
 * Distribute the current total occupancy evenly across the available exits for
 * an evacuation drill, returning fans-per-exit and estimated clearance minutes.
 */
export function evacuationLoad(
  totalOccupancy: number,
  exitCount: number,
  exitThroughputPerMin: number
): { perExit: number; clearanceMinutes: number } {
  if (exitCount <= 0 || exitThroughputPerMin <= 0) {
    return { perExit: 0, clearanceMinutes: Infinity };
  }
  const perExit = Math.ceil(Math.max(0, totalOccupancy) / exitCount);
  return { perExit, clearanceMinutes: round(perExit / exitThroughputPerMin) };
}
