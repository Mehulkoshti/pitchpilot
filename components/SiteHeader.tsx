import Link from 'next/link';

/** Primary navigation links surfaced in the header. */
const NAV_LINKS: ReadonlyArray<{ href: string; label: string }> = [
  { href: '/fan', label: 'Fan companion' },
  { href: '/ops', label: 'Operations' },
];

/** Global site header with the brand mark and primary navigation. */
export function SiteHeader(): React.JSX.Element {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-pitch-700">
          <span aria-hidden="true" className="text-xl">
            ⚽
          </span>
          <span className="text-lg">PitchPilot</span>
        </Link>
        <nav aria-label="Primary">
          <ul className="flex items-center gap-1 sm:gap-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-ink-700 hover:bg-pitch-50 hover:text-pitch-700"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
