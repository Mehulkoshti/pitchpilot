'use client';

import { useMemo, useState } from 'react';
import { rankTransport } from '@/lib/sustainability';

/** Default one-way stadium-to-city distance in kilometres. */
const DEFAULT_DISTANCE_KM = 8;

/**
 * Sustainable-transport widget. Ranks travel options by round-trip CO₂e using
 * the pure {@link rankTransport} engine and lets fans explore how distance
 * changes the greenest choice.
 */
export function TransportPanel(): React.JSX.Element {
  const [distanceKm, setDistanceKm] = useState(DEFAULT_DISTANCE_KM);
  const ranked = useMemo(() => rankTransport(distanceKm), [distanceKm]);

  return (
    <section className="card" aria-labelledby="transport-heading">
      <h2 id="transport-heading" className="mb-3 text-lg font-semibold text-ink-900">
        Greenest way home
      </h2>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-ink-700">
          Trip distance: {distanceKm} km
        </span>
        <input
          type="range"
          min={1}
          max={40}
          value={distanceKm}
          onChange={(event) => setDistanceKm(Number(event.target.value))}
          className="w-full accent-pitch-600"
          aria-label="One-way trip distance in kilometres"
        />
      </label>

      <ol className="mt-4 space-y-2">
        {ranked.map((option, index) => (
          <li
            key={option.optionId}
            className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
          >
            <span className="font-medium text-ink-900">
              {index === 0 && (
                <span aria-hidden="true" className="mr-1">
                  🌱
                </span>
              )}
              {option.label}
            </span>
            <span className="text-right text-ink-700">
              {option.kgCo2e} kg CO₂e
              {option.percentVsCar > 0 && (
                <span className="ml-2 font-semibold text-pitch-700">
                  −{option.percentVsCar}%
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-slate-500">
        Round-trip estimates versus a single-occupancy private car.
      </p>
    </section>
  );
}
