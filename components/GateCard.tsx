import { CongestionBadge } from '@/components/CongestionBadge';
import type { GateStatus } from '@/lib/crowd';

/**
 * A summary card for one gate's live status.
 *
 * `children` render inside the card under a divider: an operator's controls for
 * a gate belong to that gate, not floating underneath it.
 */
export function GateCard({
  status,
  isRecommended,
  children,
}: {
  status: GateStatus;
  isRecommended: boolean;
  children?: React.ReactNode;
}): React.JSX.Element {
  const isUrgent = status.level === 'critical' || status.level === 'high';

  return (
    <article
      className={`rounded-xl border p-4 ${
        isRecommended
          ? 'border-pitch-500 bg-pitch-50'
          : isUrgent
            ? 'border-orange-300 bg-white'
            : 'border-slate-200 bg-white'
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-semibold text-ink-900">{status.label}</h3>
        <CongestionBadge level={status.level} />
      </div>

      <dl className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="text-slate-600">Queue</dt>
          <dd className="font-semibold text-ink-900">{status.queue}</dd>
        </div>
        <div>
          <dt className="text-slate-600">Wait</dt>
          <dd className="text-lg font-bold leading-tight text-ink-900">
            {Number.isFinite(status.waitMinutes) ? `${status.waitMinutes} min` : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-slate-600">Throughput</dt>
          <dd className="font-semibold text-ink-900">{status.effectiveThroughput}/min</dd>
        </div>
      </dl>

      {isRecommended && (
        <p className="mt-3 text-xs font-semibold text-pitch-700">
          <span aria-hidden="true">✓ </span>
          Recommended entry — shortest wait
        </p>
      )}
      {status.isBacklogGrowing && (
        <p className="mt-1 text-xs font-medium text-orange-700">
          <span aria-hidden="true">⚠ </span>
          Backlog growing — arrivals exceed throughput
        </p>
      )}

      {children && <div className="mt-4 border-t border-slate-200 pt-3">{children}</div>}
    </article>
  );
}
