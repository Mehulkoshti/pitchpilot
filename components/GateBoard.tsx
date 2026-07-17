import { CongestionBadge } from '@/components/CongestionBadge';
import type { GateStatus } from '@/lib/crowd';

/**
 * The hero's proof panel: real gate statuses, rendered on the server by the
 * same crowd engine the operations room runs.
 *
 * The numbers are not decoration and are not hard-coded — they are
 * {@link GateStatus} values derived from the seeded telemetry snapshot, so the
 * landing page demonstrates the product rather than describing it. If the
 * engine's model changes, this board changes with it.
 */
export function GateBoard({
  statuses,
  recommendedGateId,
}: {
  statuses: readonly GateStatus[];
  recommendedGateId: string | null;
}): React.JSX.Element {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-flood-400">
          Gate board
        </h2>
        <p className="text-xs text-pitch-100">Sample telemetry</p>
      </div>

      <ul className="space-y-2">
        {statuses.map((status) => {
          const isRecommended = status.gateId === recommendedGateId;
          return (
            <li
              key={status.gateId}
              className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${
                isRecommended
                  ? 'border-flood-400/70 bg-flood-400/10'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {status.label}
                </p>
                <p className="text-xs text-pitch-100">
                  {status.queue} queued · {status.effectiveThroughput}/min
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <p className="text-right">
                  <span className="block text-lg font-bold leading-none text-white">
                    {Number.isFinite(status.waitMinutes) ? status.waitMinutes : '—'}
                  </span>
                  <span className="text-[0.65rem] uppercase tracking-wide text-pitch-100">
                    min wait
                  </span>
                </p>
                <CongestionBadge level={status.level} />
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-xs leading-relaxed text-pitch-100">
        Computed by <code className="text-flood-400">lib/crowd.ts</code> — the same pure
        engine behind the ops room, running with no network.
      </p>
    </div>
  );
}
