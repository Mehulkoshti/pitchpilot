/** Global site footer with attribution and challenge context. */
export function SiteFooter(): React.JSX.Element {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="container-page flex flex-col gap-2 py-8 text-sm text-ink-700 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-semibold text-pitch-700">PitchPilot</span> — smart-stadium
          operations for the FIFA World Cup 2026.
        </p>
        <p className="text-slate-500">
          Built with Next.js &amp; Google Gemini. Degrades gracefully offline.
        </p>
      </div>
    </footer>
  );
}
