import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Offline',
  description: 'PitchPilot works without a connection — here is what you can still do.',
};

/** What still works with no connection. */
const AVAILABLE_OFFLINE: readonly string[] = [
  'Step-free and shortest-path routing to restrooms, food, first aid and exits',
  'Gate recommendations from the last known telemetry',
  'The greenest way home, ranked by CO₂e',
];

/**
 * The page the service worker serves when a fan navigates somewhere that was
 * never cached and the network is unreachable.
 *
 * It is deliberately not a dead end: the routing and concierge engines are
 * pure and already on the device, so the cached pages below keep working.
 */
export default function OfflinePage(): React.JSX.Element {
  return (
    <div className="container-page py-16">
      <h1 className="text-3xl font-bold text-ink-900">You&apos;re offline</h1>
      <p className="mt-2 max-w-2xl text-ink-700">
        This page hasn&apos;t been saved to your device yet. PitchPilot runs its routing
        and concierge maths locally, so plenty still works without a signal.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-ink-900">Still available</h2>
      <ul className="mt-3 space-y-2">
        {AVAILABLE_OFFLINE.map((item) => (
          <li key={item} className="flex gap-2 text-ink-700">
            <span aria-hidden="true" className="text-pitch-600">
              ✓
            </span>
            {item}
          </li>
        ))}
      </ul>

      <p className="mt-6 text-sm text-slate-500">
        Live gate queues and AI-phrased replies need a connection and will return
        automatically.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/fan"
          className="rounded-lg bg-pitch-700 px-4 py-2 text-sm font-semibold text-white hover:bg-pitch-600"
        >
          Fan companion
        </Link>
        <Link
          href="/ops"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-pitch-50"
        >
          Operations
        </Link>
      </div>
    </div>
  );
}
