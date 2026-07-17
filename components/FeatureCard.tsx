/** A single feature highlighted on the landing page. */
export interface Feature {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

/** Presentational card describing one PitchPilot capability. */
export function FeatureCard({ feature }: { feature: Feature }): React.JSX.Element {
  return (
    <article className="card group animate-rise transition-shadow hover:shadow-md">
      <div
        aria-hidden="true"
        className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-pitch-50 text-2xl"
      >
        {feature.icon}
      </div>
      <h3 className="mb-1.5 text-base font-semibold text-ink-900">{feature.title}</h3>
      <p className="text-sm leading-relaxed text-ink-700">{feature.description}</p>
    </article>
  );
}
