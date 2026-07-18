import { VENUES } from '@/lib/stadium-data';

/** The host-venue grid, with the aggregate seat and country counts. */
export function VenuesSection({
  totalSeats,
  hostCountryCount,
}: {
  totalSeats: number;
  hostCountryCount: number;
}): React.JSX.Element {
  return (
    <section className="bg-slate-50 py-20" aria-labelledby="venues-heading">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="venues-heading"
            className="text-3xl font-bold tracking-tight text-ink-900"
          >
            Built for all {VENUES.length} host venues
          </h2>
          <p className="mt-3 text-ink-700">
            One navigation graph and telemetry model, portable across every stadium in the
            tournament — {totalSeats.toLocaleString('en-US')} seats across{' '}
            {hostCountryCount} countries.
          </p>
        </div>

        <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {VENUES.map((venue) => (
            <li
              key={venue.id}
              className="rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
            >
              <p className="truncate font-semibold text-ink-900" title={venue.name}>
                {venue.name}
              </p>
              <p className="mt-0.5 truncate text-sm text-ink-700">{venue.city}</p>
              <p className="mt-3 flex items-center justify-between gap-2 text-xs">
                <span className="rounded-full bg-pitch-50 px-2 py-0.5 font-semibold text-pitch-700">
                  {venue.country}
                </span>
                <span className="font-semibold text-slate-600">
                  {venue.capacity.toLocaleString('en-US')}
                </span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
