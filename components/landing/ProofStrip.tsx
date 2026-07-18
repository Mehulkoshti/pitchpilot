import type { GateStatus } from '@/lib/crowd';
import type { TripEstimate } from '@/lib/sustainability';
import type { Route } from '@/lib/wayfinding';

/** Three engine-computed headline figures beneath the hero. */
export function ProofStrip({
  fastest,
  busiest,
  stepFreeRoute,
  rail,
  car,
}: {
  fastest: GateStatus | null;
  busiest: GateStatus | null;
  stepFreeRoute: Route | null;
  rail: TripEstimate | undefined;
  car: TripEstimate | undefined;
}): React.JSX.Element {
  return (
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
  );
}

/** One headline number, rendered as a definition pair. */
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
