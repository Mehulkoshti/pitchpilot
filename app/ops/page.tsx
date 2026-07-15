import type { Metadata } from 'next';
import { OpsDashboard } from '@/components/OpsDashboard';

export const metadata: Metadata = {
  title: 'Operations dashboard',
  description:
    'Real-time crowd-flow intelligence and AI decision support for venue operators and volunteers.',
};

/** The operations-facing control room for venue staff and organizers. */
export default function OpsPage(): React.JSX.Element {
  return (
    <div className="container-page py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-ink-900">Operations control</h1>
        <p className="mt-2 max-w-2xl text-ink-700">
          Live gate telemetry, entry recommendations and an AI briefing that turns data
          into action — for organizers, volunteers and venue staff.
        </p>
      </header>
      <OpsDashboard />
    </div>
  );
}
