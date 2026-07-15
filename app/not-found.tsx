import Link from 'next/link';

/** Custom 404 page keeping fans oriented inside the venue. */
export default function NotFound(): React.JSX.Element {
  return (
    <div className="container-page flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-flood-500">404</p>
      <h1 className="mt-2 text-2xl font-bold text-ink-900">
        This route doesn&apos;t exist
      </h1>
      <p className="mt-2 max-w-md text-ink-700">
        Like a wrong turn in the concourse — let&apos;s get you back on track.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-pitch-700 px-5 py-2.5 font-semibold text-white hover:bg-pitch-600"
      >
        Back to home
      </Link>
    </div>
  );
}
