import Link from 'next/link';

/** Closing call to action, routing to the two experiences. */
export function FinalCta(): React.JSX.Element {
  return (
    <section className="relative isolate overflow-hidden bg-pitch-900 py-20 text-white">
      <div
        aria-hidden="true"
        className="animate-floodlight pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-pitch-500/20 blur-3xl"
      />
      <div className="container-page text-center">
        <h2 className="text-3xl font-bold tracking-tight">
          Pick a side of the turnstile
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-pitch-100">
          Both experiences run on the same engine — and both keep working when the network
          in the bowl does not.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/fan"
            className="rounded-xl bg-flood-400 px-6 py-3 font-semibold text-ink-900 transition-colors hover:bg-flood-500"
          >
            I&apos;m a fan
          </Link>
          <Link
            href="/ops"
            className="rounded-xl border border-white/30 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
          >
            I run the venue
          </Link>
        </div>
      </div>
    </section>
  );
}
