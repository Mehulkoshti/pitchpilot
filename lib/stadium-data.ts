/**
 * Domain model and seed data for PitchPilot.
 *
 * The data describes FIFA World Cup 2026 host venues and, for one flagship
 * stadium, a full indoor navigation graph. All engines in `lib/` operate on
 * these plain data structures, which keeps them pure, deterministic and fully
 * unit-testable — no network, no clock, no randomness.
 */

/** A point of interest a fan may want to reach inside the venue. */
export type PoiType =
  'seat' | 'concourse' | 'restroom' | 'food' | 'exit' | 'medical' | 'gate' | 'transport';

/** A node in the stadium navigation graph. */
export interface StadiumNode {
  /** Stable unique identifier, e.g. `gate-a` or `restroom-l2-n`. */
  readonly id: string;
  /** Human-readable label shown to fans. */
  readonly label: string;
  readonly type: PoiType;
  /** Concourse level: 0 = ground, 1 = lower, 2 = upper. */
  readonly level: number;
  /**
   * Whether the node is reachable by a step-free (wheelchair-accessible) route.
   * A route is only accessible if every node along it is accessible.
   */
  readonly accessible: boolean;
}

/** An undirected walkable connection between two nodes. */
export interface StadiumEdge {
  readonly from: string;
  readonly to: string;
  /** Walking distance in metres. */
  readonly distanceM: number;
  /** True when the only physical path uses stairs (blocks accessible routing). */
  readonly stairsOnly: boolean;
}

/** A staffed entry gate with a measured throughput. */
export interface Gate {
  readonly id: string;
  readonly label: string;
  /** Sustained scanning throughput in fans per minute at full staffing. */
  readonly throughputPerMin: number;
  /** Number of turnstiles currently open. */
  readonly openLanes: number;
  /** Maximum turnstiles physically available at the gate. */
  readonly maxLanes: number;
}

/** A live crowd reading for a single gate at one moment. */
export interface GateReading {
  readonly gateId: string;
  /** Fans currently waiting in the queue. */
  readonly queue: number;
  /** Fans arriving per minute (from ticket-scan telemetry). */
  readonly arrivalPerMin: number;
}

/** A supported transport mode from the stadium to the city. */
export interface TransportOption {
  readonly id: string;
  readonly label: string;
  /** Grams of CO2 equivalent per passenger-kilometre. */
  readonly co2PerKm: number;
  /** Typical door-to-door minutes for the reference city trip. */
  readonly typicalMinutes: number;
}

/** A FIFA World Cup 2026 host venue. */
export interface Venue {
  readonly id: string;
  readonly name: string;
  readonly city: string;
  readonly country: 'USA' | 'Canada' | 'Mexico';
  readonly capacity: number;
}

/** The eleven US, three Mexican and two Canadian host venues (subset seeded). */
export const VENUES: readonly Venue[] = [
  {
    id: 'metlife',
    name: 'MetLife Stadium',
    city: 'New York / New Jersey',
    country: 'USA',
    capacity: 82500,
  },
  {
    id: 'sofi',
    name: 'SoFi Stadium',
    city: 'Los Angeles',
    country: 'USA',
    capacity: 70240,
  },
  {
    id: 'azteca',
    name: 'Estadio Azteca',
    city: 'Mexico City',
    country: 'Mexico',
    capacity: 87523,
  },
  {
    id: 'bmo',
    name: 'BMO Field',
    city: 'Toronto',
    country: 'Canada',
    capacity: 45000,
  },
];

/** Default gate configuration for the flagship venue. */
export const GATES: readonly Gate[] = [
  {
    id: 'gate-a',
    label: 'Gate A — North',
    throughputPerMin: 45,
    openLanes: 6,
    maxLanes: 10,
  },
  {
    id: 'gate-b',
    label: 'Gate B — East',
    throughputPerMin: 30,
    openLanes: 4,
    maxLanes: 8,
  },
  {
    id: 'gate-c',
    label: 'Gate C — South',
    throughputPerMin: 40,
    openLanes: 5,
    maxLanes: 10,
  },
  {
    id: 'gate-d',
    label: 'Gate D — West',
    throughputPerMin: 25,
    openLanes: 3,
    maxLanes: 6,
  },
];

/**
 * A representative live snapshot used to seed demos and to ground the concierge
 * when a client sends no telemetry of its own.
 */
export const DEFAULT_GATE_READINGS: readonly GateReading[] = [
  { gateId: 'gate-a', queue: 60, arrivalPerMin: 50 },
  { gateId: 'gate-b', queue: 320, arrivalPerMin: 40 },
  { gateId: 'gate-c', queue: 90, arrivalPerMin: 45 },
  { gateId: 'gate-d', queue: 180, arrivalPerMin: 30 },
];

/** Transport modes with representative CO2e intensities (gCO2e/passenger-km). */
export const TRANSPORT_OPTIONS: readonly TransportOption[] = [
  { id: 'rail', label: 'Metro / commuter rail', co2PerKm: 41, typicalMinutes: 35 },
  { id: 'bus', label: 'Shuttle bus', co2PerKm: 105, typicalMinutes: 45 },
  { id: 'carpool', label: 'Carpool (4 riders)', co2PerKm: 43, typicalMinutes: 30 },
  { id: 'car', label: 'Private car (1 rider)', co2PerKm: 171, typicalMinutes: 30 },
  { id: 'walk', label: 'Walk / cycle', co2PerKm: 0, typicalMinutes: 60 },
];

/**
 * Navigation graph for the flagship venue. Nodes span three concourse levels;
 * accessible nodes are reachable step-free, and `stairsOnly` edges are excluded
 * from wheelchair routing.
 */
export const NODES: readonly StadiumNode[] = [
  { id: 'gate-a', label: 'Gate A — North', type: 'gate', level: 0, accessible: true },
  { id: 'gate-c', label: 'Gate C — South', type: 'gate', level: 0, accessible: true },
  {
    id: 'concourse-0-n',
    label: 'Ground Concourse (North)',
    type: 'concourse',
    level: 0,
    accessible: true,
  },
  {
    id: 'concourse-0-s',
    label: 'Ground Concourse (South)',
    type: 'concourse',
    level: 0,
    accessible: true,
  },
  { id: 'lift-1', label: 'Lift 1', type: 'concourse', level: 0, accessible: true },
  { id: 'stairs-1', label: 'Stairs 1', type: 'concourse', level: 0, accessible: false },
  {
    id: 'concourse-2-n',
    label: 'Upper Concourse (North)',
    type: 'concourse',
    level: 2,
    accessible: true,
  },
  {
    id: 'restroom-2-n',
    label: 'Restroom (Upper North)',
    type: 'restroom',
    level: 2,
    accessible: true,
  },
  {
    id: 'food-2-n',
    label: 'Food Court (Upper North)',
    type: 'food',
    level: 2,
    accessible: true,
  },
  {
    id: 'medical-0',
    label: 'First-Aid Station',
    type: 'medical',
    level: 0,
    accessible: true,
  },
  { id: 'seat-2-115', label: 'Seat Block 115', type: 'seat', level: 2, accessible: true },
  { id: 'exit-a', label: 'Emergency Exit A', type: 'exit', level: 0, accessible: true },
  {
    id: 'transport-rail',
    label: 'Rail Station Link',
    type: 'transport',
    level: 0,
    accessible: true,
  },
];

/** Undirected walkable edges between nodes (metres). */
export const EDGES: readonly StadiumEdge[] = [
  { from: 'gate-a', to: 'concourse-0-n', distanceM: 40, stairsOnly: false },
  { from: 'gate-c', to: 'concourse-0-s', distanceM: 40, stairsOnly: false },
  { from: 'concourse-0-n', to: 'concourse-0-s', distanceM: 120, stairsOnly: false },
  { from: 'concourse-0-n', to: 'medical-0', distanceM: 25, stairsOnly: false },
  { from: 'concourse-0-n', to: 'exit-a', distanceM: 30, stairsOnly: false },
  { from: 'concourse-0-n', to: 'lift-1', distanceM: 15, stairsOnly: false },
  { from: 'concourse-0-n', to: 'stairs-1', distanceM: 10, stairsOnly: true },
  { from: 'lift-1', to: 'concourse-2-n', distanceM: 20, stairsOnly: false },
  { from: 'stairs-1', to: 'concourse-2-n', distanceM: 35, stairsOnly: true },
  { from: 'concourse-2-n', to: 'restroom-2-n', distanceM: 18, stairsOnly: false },
  { from: 'concourse-2-n', to: 'food-2-n', distanceM: 22, stairsOnly: false },
  { from: 'concourse-2-n', to: 'seat-2-115', distanceM: 30, stairsOnly: false },
  { from: 'concourse-0-s', to: 'transport-rail', distanceM: 80, stairsOnly: false },
];

/** Look up a node by id, or `undefined` when the id is unknown. */
export function findNode(id: string): StadiumNode | undefined {
  return NODES.find((node) => node.id === id);
}

/** Look up a gate by id, or `undefined` when the id is unknown. */
export function findGate(id: string): Gate | undefined {
  return GATES.find((gate) => gate.id === id);
}
