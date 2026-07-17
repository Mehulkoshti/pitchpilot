import type { Metadata } from 'next';
import { FanCompanion } from '@/components/FanCompanion';

export const metadata: Metadata = {
  title: 'Fan companion',
  description:
    'Your AI matchday companion: multilingual help, step-free wayfinding and the greenest way home.',
};

/** The fan-facing companion: concierge, wayfinding and sustainable transport. */
export default function FanPage(): React.JSX.Element {
  return (
    <div className="container-page py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-ink-900">Fan companion</h1>
        <p className="mt-2 max-w-2xl text-ink-700">
          Everything you need on matchday — ask in any language, find step-free routes and
          travel greener.
        </p>
      </header>

      <FanCompanion />
    </div>
  );
}
