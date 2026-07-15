import type { CongestionLevel } from '@/lib/crowd';

/** Visual style and accessible label for each congestion band. */
const LEVEL_STYLE: Record<CongestionLevel, { classes: string; label: string }> = {
  low: { classes: 'bg-pitch-100 text-pitch-700', label: 'Low congestion' },
  moderate: { classes: 'bg-amber-100 text-amber-800', label: 'Moderate congestion' },
  high: { classes: 'bg-orange-100 text-orange-800', label: 'High congestion' },
  critical: { classes: 'bg-red-100 text-red-800', label: 'Critical congestion' },
};

/**
 * A colour-coded congestion pill. Colour is paired with text so the meaning is
 * never conveyed by colour alone (WCAG 1.4.1).
 */
export function CongestionBadge({
  level,
}: {
  level: CongestionLevel;
}): React.JSX.Element {
  const style = LEVEL_STYLE[level];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.classes}`}
    >
      {style.label}
    </span>
  );
}
