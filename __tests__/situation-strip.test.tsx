import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { SituationStrip } from '@/components/SituationStrip';
import { gateStatus } from '@/lib/crowd';
import type { GateStatus } from '@/lib/crowd';
import { DEFAULT_GATE_READINGS, GATES } from '@/lib/stadium-data';

/** Build the live statuses the dashboard would pass in. */
function statuses(): GateStatus[] {
  const gateById = new Map(GATES.map((gate) => [gate.id, gate]));
  return DEFAULT_GATE_READINGS.map((reading) => {
    const gate = gateById.get(reading.gateId);
    if (!gate) throw new Error(`no gate ${reading.gateId}`);
    return gateStatus(reading, gate);
  });
}

/** The status board region, scoped. */
function board(): HTMLElement {
  return screen.getByRole('region', { name: /venue status/i });
}

describe('SituationStrip', () => {
  it('flags the gates in the high/critical bands as needing attention', () => {
    // The seeded snapshot has Gate B (critical) and Gate D (high).
    render(<SituationStrip statuses={statuses()} occupancy={61_000} />);
    expect(within(board()).getByText(/2 gates need attention/i)).toBeInTheDocument();
  });

  it('reports all-clear when every gate is within target', () => {
    const calm = statuses().map((s) => ({ ...s, level: 'low' as const }));
    render(<SituationStrip statuses={calm} occupancy={61_000} />);
    expect(within(board()).getByText(/all gates within target/i)).toBeInTheDocument();
  });

  it('sums the fans queued across every gate', () => {
    render(<SituationStrip statuses={statuses()} occupancy={61_000} />);
    // 60 + 320 + 90 + 180 = 650
    expect(within(board()).getByText('650')).toBeInTheDocument();
  });

  it('shows evacuation clearance judged against the Green Guide target', () => {
    render(<SituationStrip statuses={statuses()} occupancy={61_000} />);
    expect(within(board()).getByText(/within the 8 min target/i)).toBeInTheDocument();
  });
});
