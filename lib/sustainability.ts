/**
 * Sustainability engine.
 *
 * Estimates the CO2e footprint of a fan's stadium trip and ranks the greener
 * transport options. Pure and deterministic, backed by published per-mode
 * emission intensities in {@link TransportOption}.
 */

import { clamp, round } from './math';
import { TRANSPORT_OPTIONS } from './stadium-data';
import type { TransportOption } from './stadium-data';

/** The estimated footprint of one trip on one transport mode. */
export interface TripEstimate {
  readonly optionId: string;
  readonly label: string;
  /** Total kilograms of CO2e for the round trip. */
  readonly kgCo2e: number;
  readonly typicalMinutes: number;
  /** Percentage saved versus the private-car baseline (0–100). */
  readonly percentVsCar: number;
}

/** Grams per kilogram, used to convert the per-km intensities. */
const GRAMS_PER_KG = 1000;

/**
 * Estimate the round-trip footprint for a single transport option.
 *
 * @param distanceKm one-way distance in kilometres (round trip is 2×).
 */
export function estimateTrip(option: TransportOption, distanceKm: number): number {
  const safeDistance = Math.max(0, distanceKm);
  const grams = option.co2PerKm * safeDistance * 2;
  return round(grams / GRAMS_PER_KG, 2);
}

/**
 * Rank every transport option for a trip of `distanceKm`, greenest first, each
 * annotated with its saving versus a private car.
 */
export function rankTransport(
  distanceKm: number,
  options: readonly TransportOption[] = TRANSPORT_OPTIONS
): TripEstimate[] {
  const car = options.find((option) => option.id === 'car');
  const carKg = car ? estimateTrip(car, distanceKm) : 0;
  return options
    .map((option) => {
      const kgCo2e = estimateTrip(option, distanceKm);
      const percentVsCar = carKg > 0 ? Math.round(((carKg - kgCo2e) / carKg) * 100) : 0;
      return {
        optionId: option.id,
        label: option.label,
        kgCo2e,
        typicalMinutes: option.typicalMinutes,
        percentVsCar,
      };
    })
    .sort((a, b) => a.kgCo2e - b.kgCo2e);
}

/**
 * Aggregate footprint for a crowd, assuming a modal split.
 *
 * @param attendees total fans attending.
 * @param modalSplit fraction of fans per option id; values should sum to ~1.
 * @param distanceKm one-way trip distance.
 * @returns total tonnes of CO2e for the crowd's travel.
 */
export function crowdFootprintTonnes(
  attendees: number,
  modalSplit: Readonly<Record<string, number>>,
  distanceKm: number,
  options: readonly TransportOption[] = TRANSPORT_OPTIONS
): number {
  let totalKg = 0;
  for (const option of options) {
    const share = modalSplit[option.id] ?? 0;
    const fans = Math.max(0, attendees) * clamp(share, 0, 1);
    totalKg += fans * estimateTrip(option, distanceKm);
  }
  return round(totalKg / GRAMS_PER_KG, 2);
}
