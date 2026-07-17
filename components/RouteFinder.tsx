'use client';

import { useMemo, useState } from 'react';
import { NODES } from '@/lib/stadium-data';
import type { PoiType } from '@/lib/stadium-data';
import { findNearest } from '@/lib/wayfinding';

/** Destinations a fan can route to, with a friendly label. */
const DESTINATIONS: ReadonlyArray<{ type: PoiType; label: string }> = [
  { type: 'restroom', label: 'Restroom' },
  { type: 'food', label: 'Food' },
  { type: 'medical', label: 'First aid' },
  { type: 'exit', label: 'Exit' },
  { type: 'transport', label: 'Transport' },
];

/** Nodes a fan can select as their starting point. */
const ORIGINS = NODES.filter((node) => node.type !== 'transport');

/** Where the fan is and how they move — owned by the page, shared with the concierge. */
export interface RouteFinderProps {
  readonly fromId: string;
  readonly onFromIdChange: (fromId: string) => void;
  readonly accessibleOnly: boolean;
  readonly onAccessibleOnlyChange: (accessibleOnly: boolean) => void;
}

/**
 * Client-side wayfinding widget. Runs the pure {@link findNearest} engine
 * directly in the browser — instant, offline-capable — and offers a step-free
 * toggle so wheelchair users get a guaranteed accessible route.
 *
 * Location and the step-free preference are controlled by the parent rather
 * than held here: the concierge must answer from the *same* location and honour
 * the same preference, otherwise a fan who sets both here still gets routed
 * from the default gate — down stairs — when they ask the chat instead.
 */
export function RouteFinder({
  fromId,
  onFromIdChange,
  accessibleOnly,
  onAccessibleOnlyChange,
}: RouteFinderProps): React.JSX.Element {
  const [type, setType] = useState<PoiType>('restroom');

  const route = useMemo(
    () => findNearest(fromId, type, { accessibleOnly }),
    [fromId, type, accessibleOnly]
  );

  return (
    <section className="card" aria-labelledby="route-heading">
      <h2 id="route-heading" className="mb-3 text-lg font-semibold text-ink-900">
        Find your way
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-ink-700">I&apos;m at</span>
          <select
            value={fromId}
            onChange={(event) => onFromIdChange(event.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-2"
          >
            {ORIGINS.map((node) => (
              <option key={node.id} value={node.id}>
                {node.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-ink-700">Take me to</span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as PoiType)}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-2"
          >
            {DESTINATIONS.map((destination) => (
              <option key={destination.type} value={destination.type}>
                {destination.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-ink-700">
        <input
          type="checkbox"
          checked={accessibleOnly}
          onChange={(event) => onAccessibleOnlyChange(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        Step-free route only (wheelchair accessible)
      </label>

      <div className="mt-4 rounded-lg bg-slate-50 p-4" aria-live="polite">
        {route ? (
          <>
            <p className="mb-2 text-sm font-semibold text-pitch-700">
              {route.distanceM} m{accessibleOnly && ' · step-free'}
            </p>
            <ol className="space-y-1 text-sm text-ink-900">
              {route.steps.map((step, index) => (
                <li key={`${step}-${index}`} className="flex gap-2">
                  {/* slate-600, not a lighter grey: these step numbers sit on a
                      slate-50 panel, where slate-400 measures 2.45:1 and fails
                      WCAG AA. Decorative to screen readers, but still read by
                      eye. */}
                  <span aria-hidden="true" className="text-slate-600">
                    {index + 1}.
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
