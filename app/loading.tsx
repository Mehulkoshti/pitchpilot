/** Route-level loading fallback shown during navigation. */
export default function Loading(): React.JSX.Element {
  return (
    <div
      role="status"
      aria-live="polite"
      className="container-page flex min-h-[40vh] items-center justify-center"
    >
      <span className="text-ink-700">Loading…</span>
    </div>
  );
}
