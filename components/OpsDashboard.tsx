'use client';

import { useMemo, useState } from 'react';
import { GateCard } from '@/components/GateCard';
import { SituationStrip } from '@/components/SituationStrip';
import { gateStatus, recommendGate, recommendLaneChanges } from '@/lib/crowd';
import type { LaneRecommendation } from '@/lib/crowd';
import { DEFAULT_GATE_READINGS, DEFAULT_OCCUPANCY, GATES } from '@/lib/stadium-data';
import type { Gate, GateReading } from '@/lib/stadium-data';

/** Starting demo readings, one per configured gate. */
const INITIAL_READINGS: readonly GateReading[] = DEFAULT_GATE_READINGS;

/** Shape of the `/api/briefing` success response. */
interface BriefingApiResponse {
  briefing: string;
  recommendations: LaneRecommendation[];
  clearanceMinutes: number;
  source: 'ai' | 'fallback';
}

/**
 * The operations control dashboard. Gate statuses are computed live in the
 * browser from the pure crowd engine as operators adjust queues; the AI
 * briefing is generated on demand from the server route.
 */
export function OpsDashboard(): React.JSX.Element {
  const [readings, setReadings] = useState<GateReading[]>([...INITIAL_READINGS]);
  // Lane staffing is operator-controlled state, not fixed config: a briefing
  // that says "open 5 more lanes" is only decision *support* if the operator can
  // act on it here and watch the queue respond.
  const [gates, setGates] = useState<Gate[]>([...GATES]);
  const [briefing, setBriefing] = useState<BriefingApiResponse | null>(null);
  const [isLoading, setLoading] = useState(false);

  const gateById = useMemo(() => new Map(gates.map((gate) => [gate.id, gate])), [gates]);

  const statuses = useMemo(
    () =>
      readings
        .map((reading) => {
          const gate = gateById.get(reading.gateId);
          return gate ? gateStatus(reading, gate) : null;
        })
        .filter((status): status is NonNullable<typeof status> => status !== null),
    [readings, gateById]
  );

  const recommended = useMemo(() => recommendGate(readings, gates), [readings, gates]);

  // Computed locally from the pure engine, so recommendations update the instant
  // an operator moves a slider — no round trip, and correct with no network.
  const laneAdvice = useMemo(
    () => recommendLaneChanges(readings, gates),
    [readings, gates]
  );

  function updateQueue(gateId: string, queue: number): void {
    setReadings((prev) =>
      prev.map((reading) => (reading.gateId === gateId ? { ...reading, queue } : reading))
    );
  }

  /** Act on a recommendation: open the spare lanes the engine asked for. */
  function applyLanes(gateId: string, extraLanes: number): void {
    setGates((prev) =>
      prev.map((gate) =>
        gate.id === gateId
          ? { ...gate, openLanes: Math.min(gate.maxLanes, gate.openLanes + extraLanes) }
          : gate
      )
    );
  }

  async function generateBriefing(): Promise<void> {
    setLoading(true);
    try {
      const response = await fetch('/api/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readings, occupancy: DEFAULT_OCCUPANCY }),
      });
      if (response.ok) setBriefing((await response.json()) as BriefingApiResponse);
    } catch {
      setBriefing(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <SituationStrip statuses={statuses} occupancy={DEFAULT_OCCUPANCY} />

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="lg:col-span-8" aria-labelledby="gates-heading">
          <h2 id="gates-heading" className="mb-4 text-lg font-semibold text-ink-900">
            Live gate status
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {statuses.map((status) => {
              const gate = gateById.get(status.gateId);
              const spare = gate ? Math.max(0, gate.maxLanes - gate.openLanes) : 0;
              return (
                <GateCard
                  key={status.gateId}
                  status={status}
                  isRecommended={status.gateId === recommended?.gateId}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-600">
                      Lanes open{' '}
                      <span className="font-semibold text-ink-900">
                        {gate?.openLanes ?? 0} / {gate?.maxLanes ?? 0}
                      </span>
                    </span>
                    {spare > 0 && (
                      <button
                        type="button"
                        onClick={() => applyLanes(status.gateId, 1)}
                        className="rounded-lg border border-slate-300 px-2 py-1 font-semibold text-ink-700 transition-colors hover:bg-pitch-50"
                      >
                        + Open a lane
                      </button>
                    )}
                  </div>
                  <label className="mt-3 block text-xs text-slate-600">
                    Simulate queue at {status.label}
                    <input
                      type="range"
                      min={0}
                      max={500}
                      value={status.queue}
                      onChange={(event) =>
                        updateQueue(status.gateId, Number(event.target.value))
                      }
                      className="mt-1 w-full accent-pitch-600"
                      aria-label={`Queue length at ${status.label}`}
                    />
                  </label>
                </GateCard>
              );
            })}
          </div>
        </section>

        <div className="space-y-6 lg:sticky lg:top-6 lg:col-span-4 lg:self-start">
          <section aria-labelledby="advice-heading">
            <h2 id="advice-heading" className="mb-4 text-lg font-semibold text-ink-900">
              Lane recommendations
            </h2>
            <div className="card" aria-live="polite">
              {laneAdvice.length === 0 ? (
                <p className="text-sm text-slate-600">
                  All gates flowing within target wait times.
                </p>
              ) : (
                <ul className="space-y-3">
                  {laneAdvice.map((advice) => (
                    <li
                      key={advice.gateId}
                      className="rounded-lg border border-slate-200 p-3"
                    >
                      <p className="text-sm font-semibold text-ink-900">{advice.label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-ink-700">
                        {advice.reason}
                      </p>
                      {advice.openExtraLanes > 0 && (
                        <button
                          type="button"
                          onClick={() => applyLanes(advice.gateId, advice.openExtraLanes)}
                          className="mt-2 w-full rounded-lg bg-pitch-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-pitch-600"
                        >
                          Open {advice.openExtraLanes} lane
                          {advice.openExtraLanes === 1 ? '' : 's'} now
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section aria-labelledby="briefing-heading">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="briefing-heading" className="text-lg font-semibold text-ink-900">
                AI ops briefing
              </h2>
              <button
                type="button"
                onClick={() => void generateBriefing()}
                disabled={isLoading}
                className="rounded-lg bg-pitch-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-pitch-600 disabled:opacity-50"
              >
                {isLoading ? 'Generating…' : 'Generate'}
              </button>
            </div>

            <div className="card" aria-live="polite">
              {briefing ? (
                <>
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink-900">
                    {briefing.briefing}
                  </pre>
                  <p className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-600">
                    {briefing.source === 'ai'
                      ? 'AI-generated from the engine’s recommendations'
                      : 'Offline fallback — written by the engine itself'}
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-600">
                  Turn the current telemetry into a prioritised, shift-ready briefing.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
