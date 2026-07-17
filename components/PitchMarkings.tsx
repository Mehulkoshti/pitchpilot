/**
 * Decorative pitch markings behind the hero.
 *
 * Inline SVG rather than an image: the Content-Security-Policy allows no
 * external origins, and vector lines stay crisp at any viewport without
 * shipping a single byte over the network. Purely presentational, so it is
 * hidden from assistive technology.
 */
export function PitchMarkings(): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 800 500"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      {/* Touchlines */}
      <rect x="40" y="30" width="720" height="440" rx="2" />
      {/* Halfway line + centre circle */}
      <path d="M400 30V470" />
      <circle cx="400" cy="250" r="72" />
      <circle cx="400" cy="250" r="3" fill="currentColor" stroke="none" />
      {/* Penalty areas */}
      <rect x="40" y="130" width="120" height="240" />
      <rect x="640" y="130" width="120" height="240" />
      {/* Six-yard boxes */}
      <rect x="40" y="190" width="48" height="120" />
      <rect x="712" y="190" width="48" height="120" />
      {/* Penalty spots */}
      <circle cx="130" cy="250" r="3" fill="currentColor" stroke="none" />
      <circle cx="670" cy="250" r="3" fill="currentColor" stroke="none" />
      {/* Corner arcs */}
      <path d="M40 48a18 18 0 0 0 18-18" />
      <path d="M760 48a18 18 0 0 1-18-18" />
      <path d="M40 452a18 18 0 0 1 18 18" />
      <path d="M760 452a18 18 0 0 0-18 18" />
    </svg>
  );
}
