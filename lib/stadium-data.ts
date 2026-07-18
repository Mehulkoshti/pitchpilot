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
  /**
   * Approximate seating capacity in tournament configuration.
   *
   * Published figures vary by source and by how each venue is configured for a
   * given match, so these are rounded rather than falsely precise. Capacity is
   * display-only — no engine computes anything from it.
   */
  readonly capacity: number;
}

/**
 * All sixteen host venues: eleven in the United States, three in Mexico, two in
 * Canada. Ordered by capacity, largest first.
 */
export const VENUES: readonly Venue[] = [
  { id: 'att', name: 'AT&T Stadium', city: 'Dallas', country: 'USA', capacity: 94000 },
  {
    id: 'azteca',
    name: 'Estadio Azteca',
    city: 'Mexico City',
    country: 'Mexico',
    capacity: 83000,
  },
  {
    id: 'metlife',
    name: 'MetLife Stadium',
    city: 'New York / New Jersey',
    country: 'USA',
    capacity: 82500,
  },
  {
    id: 'mercedes-benz',
    name: 'Mercedes-Benz Stadium',
    city: 'Atlanta',
    country: 'USA',
    capacity: 75000,
  },
  {
    id: 'arrowhead',
    name: 'Arrowhead Stadium',
    city: 'Kansas City',
    country: 'USA',
    capacity: 73000,
  },
  { id: 'nrg', name: 'NRG Stadium', city: 'Houston', country: 'USA', capacity: 72000 },
  {
    id: 'levis',
    name: "Levi's Stadium",
    city: 'San Francisco Bay Area',
    country: 'USA',
    capacity: 71000,
  },
  {
    id: 'sofi',
    name: 'SoFi Stadium',
    city: 'Los Angeles',
    country: 'USA',
    capacity: 70000,
  },
  { id: 'lumen', name: 'Lumen Field', city: 'Seattle', country: 'USA', capacity: 69000 },
  {
    id: 'lincoln-financial',
    name: 'Lincoln Financial Field',
    city: 'Philadelphia',
    country: 'USA',
    capacity: 69000,
  },
  {
    id: 'gillette',
    name: 'Gillette Stadium',
    city: 'Boston',
    country: 'USA',
    capacity: 65000,
  },
  {
    id: 'hard-rock',
    name: 'Hard Rock Stadium',
    city: 'Miami',
    country: 'USA',
    capacity: 65000,
  },
  {
    id: 'bc-place',
    name: 'BC Place',
    city: 'Vancouver',
    country: 'Canada',
    capacity: 54000,
  },
  {
    id: 'bbva',
    name: 'Estadio BBVA',
    city: 'Monterrey',
    country: 'Mexico',
    capacity: 53500,
  },
  {
    id: 'akron',
    name: 'Estadio Akron',
    city: 'Guadalajara',
    country: 'Mexico',
    capacity: 48000,
  },
  { id: 'bmo', name: 'BMO Field', city: 'Toronto', country: 'Canada', capacity: 45000 },
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

// Emergency-egress model, from the Guide to Safety at Sports Grounds (the
// "Green Guide"): an 8-minute target and 66 persons/metre/minute on stairs.
// Shared here so the ops console and the AI briefing quote the same figures.
// @see https://sgsa.org.uk/physical-factors/circulation/egress/

/** Green Guide maximum emergency egress time, in minutes. */
export const EGRESS_TARGET_MINUTES = 8;

/** Green Guide maximum rate of passage on a stepped surface (persons/metre/minute). */
export const RATE_OF_PASSAGE_STEPPED = 66;

/** Clear width of a single egress portal, in metres. */
export const EXIT_WIDTH_M = 3;

/** Exits serving the bowl — 40 × 3 m gives the ~115 m needed to clear in 8 min. */
export const EXIT_COUNT = 40;

/** Fans per minute one exit clears: rate of passage × its clear width. */
export const EXIT_THROUGHPUT_PER_MIN = RATE_OF_PASSAGE_STEPPED * EXIT_WIDTH_M;

/** Representative in-bowl occupancy used to seed the ops demo. */
export const DEFAULT_OCCUPANCY = 61_000;

/** Representative one-way stadium-to-city distance, in kilometres. */
export const REFERENCE_TRIP_KM = 8;

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

/**
 * Id indexes, built once at module load. These lookups run inside the
 * wayfinding engine's hot paths — once per node when labelling a route, and
 * again per node when checking accessibility — so an O(1) Map beats re-scanning
 * the arrays each time.
 */
const NODE_BY_ID: ReadonlyMap<string, StadiumNode> = new Map(
  NODES.map((node) => [node.id, node])
);
const GATE_BY_ID: ReadonlyMap<string, Gate> = new Map(
  GATES.map((gate) => [gate.id, gate])
);

/** Look up a node by id, or `undefined` when the id is unknown. */
export function findNode(id: string): StadiumNode | undefined {
  return NODE_BY_ID.get(id);
}

/** Look up a gate by id, or `undefined` when the id is unknown. */
export function findGate(id: string): Gate | undefined {
  return GATE_BY_ID.get(id);
}
