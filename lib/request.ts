/**
 * Bounded, crash-safe JSON body reading for the API routes.
 */

/**
 * Largest request body accepted, in bytes.
 *
 * A valid request is a few kilobytes at most (a 500-char message plus up to 20
 * bounded gate readings), so 16 KB is generous. The cap is a cheap denial-of-
 * service guard on top of the platform's own request limit: an oversized body
 * is rejected before it is parsed into memory.
 */
const DEFAULT_MAX_BYTES = 16_384;

/**
 * Read a request body as JSON, or `null` when it is malformed or too large.
 *
 * The caller turns `null` into a 400, so an oversized or invalid body fails
 * cleanly rather than being materialised or crashing the handler.
 */
export async function readJsonBody(
  request: Request,
  maxBytes: number = DEFAULT_MAX_BYTES
): Promise<unknown> {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) return null;

  try {
    const text = await request.text();
    if (text.length > maxBytes) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}
