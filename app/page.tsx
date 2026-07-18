import Link from 'next/link';
import { FeatureCard } from '@/components/FeatureCard';
import type { Feature } from '@/components/FeatureCard';
import { GateBoard } from '@/components/GateBoard';
import { PitchMarkings } from '@/components/PitchMarkings';
import { gateStatus, recommendGate } from '@/lib/crowd';
import {
  DEFAULT_GATE_READINGS,
  DEFAULT_OCCUPANCY,
  GATES,
  VENUES,
} from '@/lib/stadium-data';
import { crowdFootprintTonnes, rankTransport } from '@/lib/sustainability';
import { findNearest } from '@/lib/wayfinding';

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

/** One-way stadium-to-city distance used for the headline CO₂e comparison. */
const REFERENCE_TRIP_KM = 8;

/**
 * A representative post-match modal split for a well-served urban venue —
 * most fans on rail, a minority still driving. Fractions sum to 1. Illustrative,
 * used only for the crowd-scale CO₂e figure.
 */
const MODAL_SPLIT: Readonly<Record<string, number>> = {
  rail: 0.45,
  carpool: 0.15,
  bus: 0.15,
  walk: 0.05,
  car: 0.2,
};

/**
 * Public landing page.
 *
 * Every number on this page is computed here by the real engines rather than
 * written into the copy: the gate board, the headline wait times, the step-free
 * distance and the CO₂e saving are all derived at render time. That keeps the
 * marketing honest — if the model changes, the page changes — and it means the
 * landing page demonstrates the product instead of describing it.
 */
export default function HomePage(): React.JSX.Element {
  const statuses = DEFAULT_GATE_READINGS.map((reading) => {
    const gate = GATES.find((candidate) => candidate.id === reading.gateId);
    return gate ? gateStatus(reading, gate) : null;
  }).filter((status): status is NonNullable<typeof status> => status !== null);

  const fastest = recommendGate(DEFAULT_GATE_READINGS, GATES);
  const busiest = statuses.reduce<(typeof statuses)[number] | null>(
    (worst, status) =>
      worst === null || status.waitMinutes > worst.waitMinutes ? status : worst,
    null
  );
  const stepFreeRoute = findNearest('seat-2-115', 'restroom', { accessibleOnly: true });
  const transport = rankTransport(REFERENCE_TRIP_KM);
  const rail = transport.find((option) => option.optionId === 'rail');
  const car = transport.find((option) => option.optionId === 'car');

  // Venue-scale footprint: a full house travelling the representative mix versus
  // everyone driving alone. Rounded to tonnes for a headline figure.
  const mixedTonnes = Math.round(
    crowdFootprintTonnes(DEFAULT_OCCUPANCY, MODAL_SPLIT, REFERENCE_TRIP_KM)
  );
  const allCarTonnes = Math.round(
    crowdFootprintTonnes(DEFAULT_OCCUPANCY, { car: 1 }, REFERENCE_TRIP_KM)
  );
  const tonnesSaved = allCarTonnes - mixedTonnes;

  const totalSeats = VENUES.reduce((sum, venue) => sum + venue.capacity, 0);
  const hostCountries = [...new Set(VENUES.map((venue) => venue.country))];

  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative isolate overflow-hidden bg-pitch-900 text-white">
        {/* Decorative stadium lighting. aria-hidden and text-free by design. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          {/* Fainter on small screens: `slice` scales the markings up as the
              viewport narrows, so at phone widths the halfway line runs
              straight through the headline unless it is dialled back. */}
          <div className="absolute inset-0 text-white/[0.03] sm:text-white/[0.07]">
            <PitchMarkings />
          </div>
          <div className="absolute -left-24 -top-32 h-[28rem] w-[28rem] rounded-full bg-pitch-500/25 blur-3xl animate-floodlight" />
          <div className="absolute -right-20 top-10 h-[24rem] w-[24rem] rounded-full bg-flood-500/20 blur-3xl animate-floodlight [animation-delay:3s]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-pitch-900" />
        </div>

        <div className="container-page grid items-center gap-12 py-20 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="animate-rise">
            <p className="inline-flex items-center gap-2 rounded-full border border-flood-400/30 bg-flood-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-flood-400">
              <span aria-hidden="true">⚽</span>
              FIFA World Cup 2026 · Smart Stadiums
            </p>

            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              The AI copilot for
              <span className="block text-flood-400">matchday operations</span>
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-pitch-100">
              PitchPilot turns live stadium data into fast entry, step-free navigation,
              multilingual help and real-time decisions — for every fan, volunteer and
              operator across all host cities.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/fan"
                className="rounded-xl bg-flood-400 px-6 py-3 text-center font-semibold text-ink-900 transition-colors hover:bg-flood-500"
              >
                Open fan companion
              </Link>
              <Link
                href="/ops"
                className="rounded-xl border border-white/30 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-white/10"
              >
                Operations dashboard
              </Link>
            </div>

            {fastest && busiest && (
              <p className="mt-8 max-w-xl text-sm leading-relaxed text-pitch-100">
                Right now in the sample snapshot, entry times across the venue span{' '}
                <strong className="font-semibold text-white">
                  {fastest.waitMinutes} to {busiest.waitMinutes} minutes
                </strong>
                . PitchPilot tells the fan which door to walk to, and tells the venue
                which one to staff.
              </p>
            )}
          </div>

          <div className="animate-rise lg:justify-self-end lg:[animation-delay:120ms]">
            <GateBoard statuses={statuses} recommendedGateId={fastest?.gateId ?? null} />
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- proof strip */}
      <section
        aria-labelledby="proof-heading"
        className="border-b border-slate-200 bg-white"
      >
        <h2 id="proof-heading" className="sr-only">
          What the engine computes
        </h2>
        <dl className="container-page grid gap-px divide-slate-200 py-10 sm:grid-cols-3 sm:divide-x">
          <ProofStat
            value={fastest ? `${fastest.waitMinutes} min` : '—'}
            label="Fastest way in"
            detail={
              fastest && busiest
                ? `${fastest.label.split('—')[0]?.trim()} instead of a ${busiest.waitMinutes}-minute queue`
                : 'Recommended entry gate'
            }
          />
          <ProofStat
            value={stepFreeRoute ? `${stepFreeRoute.distanceM} m` : '—'}
            label="Step-free to a restroom"
            detail="Routed around every stair, from your seat"
          />
          <ProofStat
            value={rail ? `${rail.percentVsCar}% less` : '—'}
            label="CO₂e by rail vs car"
            detail={
              rail && car
                ? `${rail.kgCo2e} kg versus ${car.kgCo2e} kg for the round trip`
                : 'Greenest way home'
            }
          />
        </dl>
      </section>

      {/* ------------------------------------------------------------ features */}
      <section className="container-page py-20" aria-labelledby="features-heading">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="features-heading"
            className="text-3xl font-bold tracking-tight text-ink-900"
          >
            One platform, six ways to help
          </h2>
          <p className="mt-3 text-ink-700">
            Two audiences — fans and the people running the venue — served by one
            deterministic engine, with generative AI layered on top for language.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------- sustainability scale */}
      <section
        aria-labelledby="footprint-heading"
        className="border-y border-pitch-100 bg-pitch-50"
      >
        <div className="container-page py-12 text-center">
          <h2
            id="footprint-heading"
            className="text-sm font-semibold uppercase tracking-wider text-pitch-700"
          >
            Sustainability at venue scale
          </h2>
          {/* Connectives are string expressions, not JSX text: prettier/JSX
              whitespace around inline <strong> is unreliable and dropped the
              space after some numbers. */}
          <p className="mx-auto mt-3 max-w-2xl text-lg text-ink-900">
            {'A full house of '}
            <strong>{DEFAULT_OCCUPANCY.toLocaleString('en-US')}</strong>
            {' travelling home by the greener mix emits about '}
            <strong className="text-pitch-700">{mixedTonnes} tonnes</strong>
            {' of CO₂e — versus '}
            <strong>{allCarTonnes} tonnes</strong>
            {
              ' if everyone drove alone. PitchPilot’s nudges toward rail and carpooling target that '
            }
            <strong className="text-pitch-700">{tonnesSaved}-tonne</strong>
            {' gap.'}
          </p>
        </div>
      </section>

      {/* -------------------------------------------------------------- venues */}
      <section className="bg-slate-50 py-20" aria-labelledby="venues-heading">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id="venues-heading"
              className="text-3xl font-bold tracking-tight text-ink-900"
            >
              Built for all {VENUES.length} host venues
            </h2>
            <p className="mt-3 text-ink-700">
              One navigation graph and telemetry model, portable across every stadium in
              the tournament — {totalSeats.toLocaleString('en-US')} seats across{' '}
              {hostCountries.length} countries.
            </p>
          </div>

          <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {VENUES.map((venue) => (
              <li
                key={venue.id}
                className="rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
              >
                <p className="truncate font-semibold text-ink-900" title={venue.name}>
                  {venue.name}
                </p>
                <p className="mt-0.5 truncate text-sm text-ink-700">{venue.city}</p>
                <p className="mt-3 flex items-center justify-between gap-2 text-xs">
                  <span className="rounded-full bg-pitch-50 px-2 py-0.5 font-semibold text-pitch-700">
                    {venue.country}
                  </span>
                  <span className="font-semibold text-slate-600">
                    {venue.capacity.toLocaleString('en-US')}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ----------------------------------------------------------- final cta */}
      <section className="relative isolate overflow-hidden bg-pitch-900 py-20 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-pitch-500/20 blur-3xl animate-floodlight"
        />
        <div className="container-page text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Pick a side of the turnstile
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-pitch-100">
            Both experiences run on the same engine — and both keep working when the
            network in the bowl does not.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/fan"
              className="rounded-xl bg-flood-400 px-6 py-3 font-semibold text-ink-900 transition-colors hover:bg-flood-500"
            >
              I&apos;m a fan
            </Link>
            <Link
              href="/ops"
              className="rounded-xl border border-white/30 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
            >
              I run the venue
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

/** One headline number in the proof strip, rendered as a definition pair. */
function ProofStat({
  value,
  label,
  detail,
}: {
  value: string;
  label: string;
  detail: string;
}): React.JSX.Element {
  return (
    <div className="px-0 py-4 text-center sm:px-6 sm:py-0">
      <dt className="text-sm font-semibold text-ink-700">{label}</dt>
      <dd>
        <span className="mt-1 block text-3xl font-extrabold tracking-tight text-pitch-700">
          {value}
        </span>
        <span className="mt-1 block text-sm text-slate-600">{detail}</span>
      </dd>
    </div>
  );
}
