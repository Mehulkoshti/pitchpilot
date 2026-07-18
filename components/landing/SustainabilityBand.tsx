import { DEFAULT_OCCUPANCY } from '@/lib/stadium-data';

/** Venue-scale CO₂e comparison: the greener travel mix versus everyone driving. */
export function SustainabilityBand({
  mixedTonnes,
  allCarTonnes,
  tonnesSaved,
}: {
  mixedTonnes: number;
  allCarTonnes: number;
  tonnesSaved: number;
}): React.JSX.Element {
  return (
    <section
      aria-labelledby="footprint-heading"
      className="border-y border-pitch-100 bg-pitch-50"
    >
      <div className="container-page py-12 text-center">
        <h2
          id="footprint-heading"
          className="text-sm font-semibold uppercase tracking-wider text-pitch-700"
        >
          Sustainability at venue scale
        </h2>
        {/* Connectives are string expressions: JSX whitespace around inline
            <strong> is unreliable and dropped the space after some numbers. */}
        <p className="mx-auto mt-3 max-w-2xl text-lg text-ink-900">
          {'A full house of '}
          <strong>{DEFAULT_OCCUPANCY.toLocaleString('en-US')}</strong>
          {' travelling home by the greener mix emits about '}
          <strong className="text-pitch-700">{mixedTonnes} tonnes</strong>
          {' of CO₂e — versus '}
          <strong>{allCarTonnes} tonnes</strong>
          {
            ' if everyone drove alone. PitchPilot’s nudges toward rail and carpooling target that '
          }
          <strong className="text-pitch-700">{tonnesSaved}-tonne</strong>
          {' gap.'}
        </p>
      </div>
    </section>
  );
}
