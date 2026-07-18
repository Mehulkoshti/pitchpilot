import { LANGUAGES } from '@/lib/i18n';

/** One step in the ask → compute → phrase flow. */
interface Step {
  readonly icon: string;
  readonly title: string;
  readonly body: string;
}

const STEPS: readonly Step[] = [
  {
    icon: '🗣️',
    title: 'Ask naturally, in any language',
    body: 'Gemini reads the fan’s free-text question — “which gate is fastest?”, “baño accesible?” — and works out what they mean, whatever language they type in.',
  },
  {
    icon: '🧭',
    title: 'A deterministic engine finds the answer',
    body: 'Routes, wait times, the greenest trip and evacuation readiness are computed by a pure, tested engine — never guessed, so a gate or distance is never hallucinated.',
  },
  {
    icon: '✨',
    title: 'Gemini says it back, in their language',
    body: 'The model phrases that computed answer as a natural reply in the fan’s language. If the AI is ever unavailable, the engine’s answer still shows — the app never stalls.',
  },
];

/**
 * The "how it works" section: the separation of generative language from
 * deterministic maths, shown as a three-step flow.
 *
 * It states plainly where generative AI is used (understanding the question and
 * phrasing the reply, in any language) and where it is deliberately not (the
 * numbers), which is the heart of the design.
 */
export function HowItWorks(): React.JSX.Element {
  return (
    <section aria-labelledby="how-heading" className="bg-white py-20">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-pitch-700">
            Powered by Google Gemini
          </p>
          <h2
            id="how-heading"
            className="mt-2 text-3xl font-bold tracking-tight text-ink-900"
          >
            Generative AI for language, a tested engine for the truth
          </h2>
          <p className="mt-3 text-ink-700">
            The AI does what models are best at — understanding and speaking any language
            — while every number comes from deterministic code. Grounded, never guessed.
          </p>
        </div>

        <ol className="mt-12 grid gap-6 lg:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pitch-700 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <span aria-hidden="true" className="text-2xl">
                  {step.icon}
                </span>
              </div>
              <h3 className="mt-4 font-semibold text-ink-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-700">{step.body}</p>

              {index === 0 && (
                <ul
                  className="mt-4 flex flex-wrap gap-1.5"
                  aria-label="Supported languages"
                >
                  {LANGUAGES.map((language) => (
                    <li
                      key={language.code}
                      className="rounded-full bg-pitch-50 px-2.5 py-1 text-xs font-medium text-pitch-700"
                    >
                      {language.label}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
