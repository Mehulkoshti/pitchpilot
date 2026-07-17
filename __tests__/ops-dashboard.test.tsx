import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OpsDashboard } from '@/components/OpsDashboard';

/** The lane-recommendation panel, scoped away from the gate cards. */
function advicePanel(): HTMLElement {
  return screen.getByRole('region', { name: /lane recommendations/i });
}

/**
 * The advice entry for one gate. The seeded snapshot congests both Gate B and
 * Gate D, so assertions have to name a gate or they match whichever entry the
 * query happens to reach first.
 */
function adviceFor(gateLabel: string): HTMLElement {
  const heading = within(advicePanel()).getByText(new RegExp(gateLabel));
  const item = heading.closest('li');
  if (item === null) throw new Error(`No advice entry for ${gateLabel}`);
  return item;
}

describe('OpsDashboard — acting on recommendations', () => {
  it('recommends opening spare lanes at a congested gate', () => {
    render(<OpsDashboard />);
    // Gate B ships with a 320-deep queue on 4 of 8 lanes — well past the
    // "high" band, so the engine should ask for the 4 spare lanes.
    expect(
      within(adviceFor('Gate B')).getByRole('button', { name: /open 4 lanes now/i })
    ).toBeInTheDocument();
  });

  it('leaves gates that are flowing well out of the advice panel', () => {
    render(<OpsDashboard />);
    // Gate A (60 queued on 6 of 10 lanes) is ~2 min — nothing to advise.
    expect(within(advicePanel()).queryByText(/Gate A/)).not.toBeInTheDocument();
  });

  it('opens the lanes and clears the recommendation when the operator acts', async () => {
    const user = userEvent.setup();
    render(<OpsDashboard />);

    await user.click(
      within(advicePanel()).getByRole('button', { name: /open 4 lanes now/i })
    );

    // Acting doubles Gate B's throughput, so its wait drops under the
    // threshold and the recommendation retires itself.
    expect(within(advicePanel()).queryByText(/Gate B/)).not.toBeInTheDocument();
    expect(screen.getByText('8 / 8')).toBeInTheDocument();
  });

  it('never opens more lanes than the gate physically has', async () => {
    const user = userEvent.setup();
    render(<OpsDashboard />);

    await user.click(
      within(advicePanel()).getByRole('button', { name: /open 4 lanes now/i })
    );
    expect(screen.getByText('8 / 8')).toBeInTheDocument();
  });

  it('advises redirecting once a gate is surging at full staffing', async () => {
    const user = userEvent.setup();
    render(<OpsDashboard />);

    await user.click(
      within(advicePanel()).getByRole('button', { name: /open 4 lanes now/i })
    );
    expect(within(advicePanel()).queryByText(/Gate B/)).not.toBeInTheDocument();

    // With all 8 lanes open Gate B clears 30/min, so a 500-deep queue is still
    // ~16.7 min. The gate must resurface — but with no lanes left to open, the
    // only honest advice is to send arrivals elsewhere.
    fireEvent.change(screen.getByRole('slider', { name: /queue length at gate b/i }), {
      target: { value: '500' },
    });

    const gateB = adviceFor('Gate B');
    expect(within(gateB).getByText(/redirect/i)).toBeInTheDocument();
    expect(
      within(gateB).queryByRole('button', { name: /open .* lanes? now/i })
    ).not.toBeInTheDocument();
  });
});
