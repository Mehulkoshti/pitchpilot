'use client';

/** Root error boundary with a recovery action; logs the error client-side. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  console.error('[pitchpilot] route error:', error);
  return (
    <div className="container-page flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-bold text-ink-900">Something went wrong</h1>
      <p className="mt-2 max-w-md text-ink-700">
        An unexpected error occurred. The core stadium tools still work offline — try
        again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-pitch-700 px-5 py-2.5 font-semibold text-white hover:bg-pitch-600"
      >
        Try again
      </button>
    </div>
  );
}
