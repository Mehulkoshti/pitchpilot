'use client';

import { useMemo, useState } from 'react';
import { GateCard } from '@/components/GateCard';
import { gateStatus, recommendGate } from '@/lib/crowd';
import type { LaneRecommendation } from '@/lib/crowd';
import { DEFAULT_GATE_READINGS, GATES } from '@/lib/stadium-data';
import type { GateReading } from '@/lib/stadium-data';

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
  const [briefing, setBriefing] = useState<BriefingApiResponse | null>(null);
  const [isLoading, setLoading] = useState(false);

  const statuses = useMemo(() => {
    const gateById = new Map(GATES.map((gate) => [gate.id, gate]));
    return readings
      .map((reading) => {
        const gate = gateById.get(reading.gateId);
        return gate ? gateStatus(reading, gate) : null;
      })
      .filter((status): status is NonNullable<typeof status> => status !== null);
  }, [readings]);

  const recommended = useMemo(() => recommendGate(readings, GATES), [readings]);

  function updateQueue(gateId: string, queue: number): void {
    setReadings((prev) =>
      prev.map((reading) =>
        reading.gateId === gateId ? { ...reading, queue } : reading
      )
    );
  }

  async function generateBriefing(): Promise<void> {
    setLoading(true);
    try {
      const response = await fetch('/api/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readings, occupancy: 61_000 }),
      });
      if (response.ok) setBriefing((await response.json()) as BriefingApiResponse);
    } catch {
      setBriefing(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="lg:col-span-2" aria-labelledby="gates-heading">
        <h2 id="gates-heading" className="mb-4 text-lg font-semibold text-ink-900">
          Live gate status
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {statuses.map((status) => (
            <div key={status.gateId}>
              <GateCard
                status={status}
                isRecommended={status.gateId === recommended?.gateId}
              />
              <label className="mt-2 block text-xs text-slate-500">
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
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="briefing-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="briefing-heading" className="text-lg font-semibold text-ink-900">
            AI ops briefing
          </h2>
          <button
            type="button"
            onClick={() => void generateBriefing()}
            disabled={isLoading}
            className="rounded-lg bg-pitch-700 px-3 py-2 text-sm font-semibold text-white hover:bg-pitch-600 disabled:opacity-50"
          >
            {isLoading ? 'Generating…' : 'Generate'}
          </button>
        </div>

        <div className="card" aria-live="polite">
          {briefing ? (
            <>
              <pre className="whitespace-pre-wrap font-sans text-sm text-ink-900">
                {briefing.briefing}
              </pre>
              <p className="mt-3 text-xs text-slate-500">
                Evacuation clearance: ~{briefing.clearanceMinutes} min ·{' '}
                {briefing.source === 'ai' ? 'AI-generated' : 'offline fallback'}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">
              Generate a real-time briefing from current gate telemetry.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
