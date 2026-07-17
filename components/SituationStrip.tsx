import { evacuationLoad } from '@/lib/crowd';
import type { GateStatus } from '@/lib/crowd';
import { EXIT_COUNT, EXIT_THROUGHPUT_PER_MIN } from '@/lib/stadium-data';

/** Bands that mean a human should be looking at the gate. */
const NEEDS_ATTENTION: ReadonlySet<GateStatus['level']> = new Set(['high', 'critical']);

/**
 * The venue-wide picture, in one glance.
 *
 * An operations console has to answer "are we in trouble?" before it answers
 * "what is gate C doing?". Reading four cards to find that out is exactly the
 * work this strip removes. Evacuation clearance lives here too — it used to
 * appear only after an operator asked for an AI briefing, which is the last
 * moment you want to discover it.
 *
 * Every figure is derived from the same engine as the cards below, so the strip
 * can never drift from them.
 */
export function SituationStrip({
  statuses,
  occupancy,
}: {
  statuses: readonly GateStatus[];
  occupancy: number;
}): React.JSX.Element {
  const totalQueued = statuses.reduce((sum, status) => sum + status.queue, 0);
  const needAttention = statuses.filter((status) => NEEDS_ATTENTION.has(status.level));
  const finiteWaits = statuses
    .map((status) => status.waitMinutes)
    .filter((minutes) => Number.isFinite(minutes));
  const longestWait = finiteWaits.length > 0 ? Math.max(...finiteWaits) : null;
  const { clearanceMinutes } = evacuationLoad(
    occupancy,
    EXIT_COUNT,
    EXIT_THROUGHPUT_PER_MIN
  );

  const isCalm = needAttention.length === 0;

  return (
    <section
      aria-labelledby="situation-heading"
      className="rounded-2xl bg-pitch-900 p-5 text-white sm:p-6"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2
          id="situation-heading"
          className="text-sm font-semibold uppercase tracking-wider text-flood-400"
        >
          Venue status
        </h2>
        <p
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isCalm ? 'bg-pitch-100 text-pitch-700' : 'bg-flood-400 text-ink-900'
          }`}
        >
          {isCalm
            ? 'All gates within target'
            : `${needAttention.length} gate${needAttention.length === 1 ? '' : 's'} need attention`}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric label="Fans queued" value={totalQueued.toLocaleString('en-US')} />
        <Metric
          label="Longest wait"
          value={longestWait === null ? '—' : `${longestWait} min`}
          tone={longestWait !== null && longestWait >= 12 ? 'alert' : 'normal'}
        />
        <Metric label="In the bowl" value={occupancy.toLocaleString('en-US')} />
        <Metric
          label={`Evacuation · ${EXIT_COUNT} exits`}
          value={Number.isFinite(clearanceMinutes) ? `~${clearanceMinutes} min` : '—'}
        />
      </dl>
    </section>
  );
}

/** One figure on the status board. */
function Metric({
  label,
  value,
  tone = 'normal',
}: {
  label: string;
  value: string;
  tone?: 'normal' | 'alert';
}): React.JSX.Element {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-pitch-100">{label}</dt>
      <dd
        className={`mt-1 text-2xl font-bold tracking-tight ${
          tone === 'alert' ? 'text-flood-400' : 'text-white'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
