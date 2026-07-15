import Link from 'next/link';
import { FeatureCard } from '@/components/FeatureCard';
import type { Feature } from '@/components/FeatureCard';
import { VENUES } from '@/lib/stadium-data';

/** The six capabilities, each mapped to a challenge focus area. */
const FEATURES: readonly Feature[] = [
  {
    icon: '🚦',
    title: 'Crowd-flow intelligence',
    description:
      'Live gate queues become wait-time estimates and congestion bands, so fans and staff always know the fastest way in.',
  },
  {
    icon: '🧭',
    title: 'Accessible wayfinding',
    description:
      'Shortest-path routing to restrooms, food, medical and exits — with a guaranteed step-free mode for wheelchair users.',
  },
  {
    icon: '🌐',
    title: 'Multilingual AI concierge',
    description:
      'Ask anything in your language. Answers are grounded in real stadium data and work even when the AI is offline.',
  },
  {
    icon: '📊',
    title: 'Operational decision support',
    description:
      'A real-time briefing turns telemetry into action: which gate to reinforce, and evacuation readiness at a glance.',
  },
  {
    icon: '🌱',
    title: 'Sustainable transport',
    description:
      'Ranks the greenest way home by CO₂e, nudging fans toward rail and carpooling over private cars.',
  },
  {
    icon: '🛡️',
    title: 'Resilient by design',
    description:
      'Validated inputs, rate-limited AI and deterministic fallbacks keep the venue running under any load.',
  },
];

/** Public landing page introducing PitchPilot and its two entry points. */
export default function HomePage(): React.JSX.Element {
  return (
    <>
      <section className="bg-gradient-to-b from-pitch-900 to-pitch-700 text-white">
        <div className="container-page py-20 text-center sm:py-28">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-flood-400">
            FIFA World Cup 2026 · Smart Stadiums
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
            The AI copilot for matchday operations and fans
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-pitch-100">
            PitchPilot turns live stadium data into fast entry, step-free navigation,
            multilingual help and real-time decisions — for every fan, volunteer and
            operator across all host cities.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/fan"
              className="rounded-lg bg-white px-6 py-3 font-semibold text-pitch-700 hover:bg-pitch-50"
            >
              Open fan companion
            </Link>
            <Link
              href="/ops"
              className="rounded-lg border border-white/40 px-6 py-3 font-semibold text-white hover:bg-white/10"
            >
              Operations dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-16" aria-labelledby="features-heading">
        <h2 id="features-heading" className="text-center text-2xl font-bold text-ink-900">
          One platform, six ways to help
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-16" aria-labelledby="venues-heading">
        <div className="container-page">
          <h2 id="venues-heading" className="text-center text-2xl font-bold text-ink-900">
            Built for the host venues
          </h2>
          <ul className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-2">
            {VENUES.map((venue) => (
              <li key={venue.id} className="card flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ink-900">{venue.name}</p>
                  <p className="text-sm text-ink-700">
                    {venue.city}, {venue.country}
                  </p>
                </div>
                <span className="text-sm font-medium text-pitch-700">
                  {venue.capacity.toLocaleString('en-US')} seats
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
