import Link from 'next/link';
import { GateBoard } from '@/components/GateBoard';
import { PitchMarkings } from '@/components/PitchMarkings';
import type { GateStatus } from '@/lib/crowd';

/** The landing hero: pitch, headline, entry points, and the live gate board. */
export function HeroSection({
  statuses,
  fastest,
  busiest,
}: {
  statuses: readonly GateStatus[];
  fastest: GateStatus | null;
  busiest: GateStatus | null;
}): React.JSX.Element {
  return (
    <section className="relative isolate overflow-hidden bg-pitch-900 text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {/* Fainter on small screens: `slice` scales the markings up as the
            viewport narrows. */}
        <div className="absolute inset-0 text-white/[0.03] sm:text-white/[0.07]">
          <PitchMarkings />
        </div>
        <div className="animate-floodlight absolute -left-24 -top-32 h-[28rem] w-[28rem] rounded-full bg-pitch-500/25 blur-3xl" />
        <div className="animate-floodlight absolute -right-20 top-10 h-[24rem] w-[24rem] rounded-full bg-flood-500/20 blur-3xl [animation-delay:3s]" />
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
              . PitchPilot tells the fan which door to walk to, and tells the venue which
              one to staff.
            </p>
          )}
        </div>

        <div className="animate-rise lg:justify-self-end lg:[animation-delay:120ms]">
          <GateBoard statuses={statuses} recommendedGateId={fastest?.gateId ?? null} />
        </div>
      </div>
    </section>
  );
}
