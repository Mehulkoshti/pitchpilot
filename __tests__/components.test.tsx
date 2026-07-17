import { useState } from 'react';
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

/**
 * RouteFinder's location and step-free state are owned by the fan page so the
 * concierge can share them; this harness stands in for that owner.
 */
function ControlledRouteFinder(): React.JSX.Element {
  const [fromId, setFromId] = useState('seat-2-115');
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  return (
    <RouteFinder
      fromId={fromId}
      onFromIdChange={setFromId}
      accessibleOnly={accessibleOnly}
      onAccessibleOnlyChange={setAccessibleOnly}
    />
  );
}

describe('RouteFinder', () => {
  it('renders a route with numbered steps by default', () => {
    render(<ControlledRouteFinder />);
    expect(screen.getByRole('heading', { name: 'Find your way' })).toBeInTheDocument();
    // From "Seat Block 115" the nearest restroom is the Upper North restroom,
    // which appears as the final routing step (and in the origin selector).
    expect(screen.getAllByText('Restroom (Upper North)').length).toBeGreaterThan(0);
  });

  it('recomputes a step-free route when the accessibility toggle is checked', async () => {
    const user = userEvent.setup();
    render(<ControlledRouteFinder />);
    const toggle = screen.getByRole('checkbox', { name: /step-free/i });
    await user.click(toggle);
    expect(toggle).toBeChecked();
    expect(screen.getByText(/step-free/)).toBeInTheDocument();
  });
});
