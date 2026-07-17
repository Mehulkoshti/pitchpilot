'use client';

import { useMemo } from 'react';
import { recommendGate } from '@/lib/crowd';
import { DEFAULT_GATE_READINGS, GATES, NODES } from '@/lib/stadium-data';

/** Places a fan can say they are. Transport links are destinations, not origins. */
const ORIGINS = NODES.filter((node) => node.type !== 'transport');

/**
 * The fan's "where I am and how I move" bar.
 *
 * These two controls used to live inside the wayfinding panel, which hid the
 * fact that the concierge answers from the same values. Surfacing them at the
 * top of the page makes the shared context visible: change your location here
 * and both the map and the chat follow.
 */
export function FanContextBar({
  fromId,
  onFromIdChange,
  accessibleOnly,
  onAccessibleOnlyChange,
}: {
  fromId: string;
  onFromIdChange: (fromId: string) => void;
  accessibleOnly: boolean;
  onAccessibleOnlyChange: (accessibleOnly: boolean) => void;
}): React.JSX.Element {
  // The crowd engine is pure and already in the browser, so the fastest-gate
  // hint costs no network and is correct offline.
  const fastest = useMemo(() => recommendGate(DEFAULT_GATE_READINGS, GATES), []);

  return (
    <div className="card flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <label className="flex items-center gap-2 text-sm">
          <span aria-hidden="true">📍</span>
          <span className="font-medium text-ink-700">I&apos;m at</span>
          <select
            value={fromId}
            onChange={(event) => onFromIdChange(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-medium text-ink-900"
          >
            {ORIGINS.map((node) => (
              <option key={node.id} value={node.id}>
                {node.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={accessibleOnly}
            onChange={(event) => onAccessibleOnlyChange(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-pitch-600"
          />
          <span aria-hidden="true">♿</span>
          Step-free routes only
        </label>
      </div>

      {fastest && (
        <p className="flex items-center gap-2 rounded-lg bg-pitch-50 px-3 py-2 text-sm">
          <span aria-hidden="true">🚦</span>
          <span className="text-ink-700">Fastest entry now:</span>
          <span className="font-semibold text-pitch-700">
            {fastest.label} · {fastest.waitMinutes} min
          </span>
        </p>
      )}
    </div>
  );
}
