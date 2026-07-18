/** Largest request body accepted (a valid one is a few KB); a cheap DoS guard. */
const DEFAULT_MAX_BYTES = 16_384;

/** Read a request body as JSON, or `null` when it is malformed or too large. */
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
