import { CongestionBadge } from '@/components/CongestionBadge';
import type { GateStatus } from '@/lib/crowd';

/** A read-only summary card for one gate's live status. */
export function GateCard({
  status,
  isRecommended,
}: {
  status: GateStatus;
  isRecommended: boolean;
}): React.JSX.Element {
  return (
    <article
      className={`rounded-xl border p-4 ${
        isRecommended ? 'border-pitch-500 bg-pitch-50' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-semibold text-ink-900">{status.label}</h3>
        <CongestionBadge level={status.level} />
      </div>
      <dl className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="text-slate-500">Queue</dt>
          <dd className="font-semibold text-ink-900">{status.queue}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Wait</dt>
          <dd className="font-semibold text-ink-900">
            {Number.isFinite(status.waitMinutes) ? `${status.waitMinutes} min` : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Throughput</dt>
          <dd className="font-semibold text-ink-900">{status.effectiveThroughput}/min</dd>
        </div>
      </dl>
      {isRecommended && (
        <p className="mt-2 text-xs font-semibold text-pitch-700">
          ✓ Recommended entry — shortest wait
        </p>
      )}
      {status.isBacklogGrowing && (
        <p className="mt-1 text-xs font-medium text-orange-700">
          ⚠ Backlog growing — arrivals exceed throughput
        </p>
      )}
    </article>
  );
}
