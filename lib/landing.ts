import { gateStatus, recommendGate } from './crowd';
import type { GateStatus } from './crowd';
import {
  DEFAULT_GATE_READINGS,
  DEFAULT_OCCUPANCY,
  GATES,
  REFERENCE_TRIP_KM,
  VENUES,
} from './stadium-data';
import { crowdFootprintTonnes, rankTransport } from './sustainability';
import type { TripEstimate } from './sustainability';
import { findNearest } from './wayfinding';
import type { Route } from './wayfinding';

/** Representative post-match travel mix (fractions sum to 1) for the crowd figure. */
const MODAL_SPLIT: Readonly<Record<string, number>> = {
  rail: 0.45,
  carpool: 0.15,
  bus: 0.15,
  walk: 0.05,
  car: 0.2,
};

/** Every figure the landing page shows, derived from the engines. */
export interface LandingData {
  readonly statuses: GateStatus[];
  readonly fastest: GateStatus | null;
  readonly busiest: GateStatus | null;
  readonly stepFreeRoute: Route | null;
  readonly rail: TripEstimate | undefined;
  readonly car: TripEstimate | undefined;
  readonly mixedTonnes: number;
  readonly allCarTonnes: number;
  readonly tonnesSaved: number;
  readonly totalSeats: number;
  readonly hostCountryCount: number;
}

/**
 * Compute the landing figures once. Everything the page shows comes from here,
 * so the marketing can't drift from what the engines actually produce.
 */
export function getLandingData(): LandingData {
  const statuses = DEFAULT_GATE_READINGS.map((reading) => {
    const gate = GATES.find((candidate) => candidate.id === reading.gateId);
    return gate ? gateStatus(reading, gate) : null;
  }).filter((status): status is GateStatus => status !== null);

  const fastest = recommendGate(DEFAULT_GATE_READINGS, GATES);
  const busiest = statuses.reduce<GateStatus | null>(
    (worst, status) =>
      worst === null || status.waitMinutes > worst.waitMinutes ? status : worst,
    null
  );

  const transport = rankTransport(REFERENCE_TRIP_KM);
  const mixedTonnes = Math.round(
    crowdFootprintTonnes(DEFAULT_OCCUPANCY, MODAL_SPLIT, REFERENCE_TRIP_KM)
  );
  const allCarTonnes = Math.round(
    crowdFootprintTonnes(DEFAULT_OCCUPANCY, { car: 1 }, REFERENCE_TRIP_KM)
  );

  return {
    statuses,
    fastest,
    busiest,
    stepFreeRoute: findNearest('seat-2-115', 'restroom', { accessibleOnly: true }),
    rail: transport.find((option) => option.optionId === 'rail'),
    car: transport.find((option) => option.optionId === 'car'),
    mixedTonnes,
    allCarTonnes,
    tonnesSaved: allCarTonnes - mixedTonnes,
    totalSeats: VENUES.reduce((sum, venue) => sum + venue.capacity, 0),
    hostCountryCount: new Set(VENUES.map((venue) => venue.country)).size,
  };
}
