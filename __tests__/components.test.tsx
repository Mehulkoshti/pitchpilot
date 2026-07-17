import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CongestionBadge } from '@/components/CongestionBadge';
import { FeatureCard } from '@/components/FeatureCard';
import { GateCard } from '@/components/GateCard';
import { RouteFinder } from '@/components/RouteFinder';
import type { GateStatus } from '@/lib/crowd';

describe('CongestionBadge', () => {
  it('renders an accessible text label, not colour alone', () => {
    render(<CongestionBadge level="critical" />);
    expect(screen.getByText('Critical congestion')).toBeInTheDocument();
  });

  it('renders the low band label', () => {
    render(<CongestionBadge level="low" />);
    expect(screen.getByText('Low congestion')).toBeInTheDocument();
  });
});

describe('FeatureCard', () => {
  it('renders the feature title and description', () => {
    render(
      <FeatureCard
        feature={{ icon: '🚦', title: 'Crowd flow', description: 'Live queues.' }}
      />
    );
    expect(screen.getByRole('heading', { name: 'Crowd flow' })).toBeInTheDocument();
    expect(screen.getByText('Live queues.')).toBeInTheDocument();
  });
});

describe('GateCard', () => {
  const status: GateStatus = {
    gateId: 'gate-a',
    label: 'Gate A',
    effectiveThroughput: 30,
    queue: 400,
    arrivalPerMin: 60,
    waitMinutes: 13.3,
    level: 'high',
    isBacklogGrowing: true,
  };

  it('shows the recommended banner when flagged', () => {
    render(<GateCard status={status} isRecommended />);
    expect(screen.getByText(/Recommended entry/)).toBeInTheDocument();
  });

  it('warns when the backlog is growing', () => {
    render(<GateCard status={status} isRecommended={false} />);
    expect(screen.getByText(/Backlog growing/)).toBeInTheDocument();
  });
});

describe('RouteFinder', () => {
  // Location and the step-free preference are owned by the fan page (see
  // FanContextBar) so the concierge shares them; RouteFinder just receives them.
  it('routes to the nearest restroom from the given origin', () => {
    render(<RouteFinder fromId="seat-2-115" accessibleOnly={false} />);
    expect(screen.getByRole('heading', { name: 'Find your way' })).toBeInTheDocument();
    expect(screen.getByText('Restroom (Upper North)')).toBeInTheDocument();
    expect(screen.getByText('48 m')).toBeInTheDocument();
  });

  it('re-routes when the fan picks a different destination', async () => {
    const user = userEvent.setup();
    render(<RouteFinder fromId="gate-a" accessibleOnly={false} />);
    await user.click(screen.getByRole('button', { name: /first aid/i }));
    expect(screen.getByText('First-Aid Station')).toBeInTheDocument();
  });

  it('marks the pressed destination for assistive technology', async () => {
    const user = userEvent.setup();
    render(<RouteFinder fromId="gate-a" accessibleOnly={false} />);
    const food = screen.getByRole('button', { name: /food/i });
    expect(food).toHaveAttribute('aria-pressed', 'false');
    await user.click(food);
    expect(food).toHaveAttribute('aria-pressed', 'true');
  });

  it('routes around the stairs when the page asks for step-free only', () => {
    // Ground concourse up to a level-2 restroom: the only step-free way is the
    // lift. (From the seat itself no lift is needed — seat and restroom share
    // level 2 — so this origin is what actually exercises the constraint.)
    render(<RouteFinder fromId="concourse-0-n" accessibleOnly />);
    expect(screen.getByText('Lift 1')).toBeInTheDocument();
    expect(screen.queryByText('Stairs 1')).not.toBeInTheDocument();
  });

  it('reports a route as step-free only when it genuinely is', () => {
    // gate-a → concourse-0-n → medical-0 uses no stairs, so the badge shows
    // even though step-free mode was not requested.
    render(<RouteFinder fromId="gate-a" accessibleOnly={false} />);
    expect(screen.getByText('Step-free')).toBeInTheDocument();
  });
});
