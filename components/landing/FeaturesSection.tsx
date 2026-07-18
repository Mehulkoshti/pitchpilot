import { FeatureCard } from '@/components/FeatureCard';
import type { Feature } from '@/components/FeatureCard';

/** The six capabilities, each mapped to a challenge focus area. */
const FEATURES: readonly Feature[] = [
  {
    icon: '🚦',
    title: 'Crowd-flow intelligence',
    description:
      'Live gate queues become wait-time estimates and congestion bands, so fans and staff always know the fastest way in.',
  },
  {
    icon: '🧭',
    title: 'Accessible wayfinding',
    description:
      'Shortest-path routing to restrooms, food, medical and exits — with a guaranteed step-free mode for wheelchair users.',
  },
  {
    icon: '🌐',
    title: 'Multilingual AI concierge',
    description:
      'Ask anything in your language. Answers are grounded in real stadium data and work even when the AI is offline.',
  },
  {
    icon: '📊',
    title: 'Operational decision support',
    description:
      'A real-time briefing turns telemetry into action: which gate to reinforce, and evacuation readiness at a glance.',
  },
  {
    icon: '🌱',
    title: 'Sustainable transport',
    description:
      'Ranks the greenest way home by CO₂e, nudging fans toward rail and carpooling over private cars.',
  },
  {
    icon: '🛡️',
    title: 'Resilient by design',
    description:
      'Validated inputs, rate-limited AI and deterministic fallbacks keep the venue running under any load.',
  },
];

/** The "what it does" grid. */
export function FeaturesSection(): React.JSX.Element {
  return (
    <section className="container-page py-20" aria-labelledby="features-heading">
      <div className="mx-auto max-w-2xl text-center">
        <h2
          id="features-heading"
          className="text-3xl font-bold tracking-tight text-ink-900"
        >
          One platform, six ways to help
        </h2>
        <p className="mt-3 text-ink-700">
          Two audiences — fans and the people running the venue — served by one
          deterministic engine, with generative AI layered on top for language.
        </p>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </div>
    </section>
  );
}
