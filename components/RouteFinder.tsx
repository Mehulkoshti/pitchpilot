'use client';

import { useMemo, useState } from 'react';
import type { PoiType } from '@/lib/stadium-data';
import { findNearest } from '@/lib/wayfinding';

/** Destinations a fan can route to, with a friendly label and icon. */
const DESTINATIONS: ReadonlyArray<{ type: PoiType; label: string; icon: string }> = [
  { type: 'restroom', label: 'Restroom', icon: '🚻' },
  { type: 'food', label: 'Food', icon: '🍔' },
  { type: 'medical', label: 'First aid', icon: '🚑' },
  { type: 'exit', label: 'Exit', icon: '🚪' },
  { type: 'transport', label: 'Transport', icon: '🚆' },
  { type: 'seat', label: 'My seat', icon: '💺' },
];

/** Where the fan is and how they move — owned by the page, shared with the chat. */
export interface RouteFinderProps {
  readonly fromId: string;
  readonly accessibleOnly: boolean;
}

/**
 * Client-side wayfinding widget. Runs the pure {@link findNearest} engine
 * directly in the browser — instant, offline-capable.
 *
 * Origin and the step-free preference are controlled by the page rather than
 * held here: the concierge must answer from the *same* location and honour the
 * same preference, otherwise a fan who sets both here still gets routed from
 * the default gate — down stairs — when they ask the chat instead.
 */
export function RouteFinder({
  fromId,
  accessibleOnly,
}: RouteFinderProps): React.JSX.Element {
  const [type, setType] = useState<PoiType>('restroom');

  const route = useMemo(
    () => findNearest(fromId, type, { accessibleOnly }),
    [fromId, type, accessibleOnly]
  );

  return (
    <section className="card" aria-labelledby="route-heading">
      <h2 id="route-heading" className="text-lg font-semibold text-ink-900">
        Find your way
      </h2>

      <fieldset className="mt-4">
        <legend className="mb-2 text-sm font-medium text-ink-700">Take me to</legend>
        <div className="flex flex-wrap gap-2">
          {DESTINATIONS.map((destination) => {
            const isActive = destination.type === type;
            return (
              <button
                key={destination.type}
                type="button"
                onClick={() => setType(destination.type)}
                aria-pressed={isActive}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-pitch-600 bg-pitch-600 text-white'
                    : 'border-slate-300 text-ink-700 hover:bg-pitch-50'
                }`}
              >
                <span aria-hidden="true">{destination.icon}</span>
                {destination.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4 rounded-xl bg-slate-50 p-4" aria-live="polite">
        {route ? (
          <>
            <p className="mb-3 flex flex-wrap items-baseline gap-2">
              <span className="text-2xl font-bold text-pitch-700">
                {route.distanceM} m
              </span>
              {route.accessible && (
                <span className="rounded-full bg-pitch-100 px-2 py-0.5 text-xs font-semibold text-pitch-700">
                  Step-free
                </span>
              )}
            </p>
            <ol className="space-y-2 text-sm text-ink-900">
              {route.steps.map((step, index) => (
                <li key={`${step}-${index}`} className="flex items-start gap-2.5">
                  {/* slate-600, not lighter: on this slate-50 panel a slate-400
                      marker measures 2.45:1 against a 4.5:1 requirement.
                      Decorative to screen readers, but still read by eye. */}
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-600 ring-1 ring-slate-200"
                  >
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p className="text-sm text-ink-700">
            No {accessibleOnly ? 'step-free ' : ''}route found from here — please ask a
            steward.
          </p>
        )}
      </div>
    </section>
  );
}
