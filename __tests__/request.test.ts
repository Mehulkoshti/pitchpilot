import { describe, expect, it } from 'vitest';
import { readJsonBody } from '@/lib/request';

/** Build a POST request with a JSON string body. */
function jsonReq(body: string, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body,
  });
}

describe('readJsonBody', () => {
  it('parses a valid JSON body', async () => {
    expect(await readJsonBody(jsonReq('{"message":"hi"}'))).toEqual({ message: 'hi' });
  });

  it('returns null for malformed JSON', async () => {
    expect(await readJsonBody(jsonReq('{ not json'))).toBeNull();
  });

  it('rejects a body larger than the cap', async () => {
    const huge = JSON.stringify({ message: 'x'.repeat(20_000) });
    expect(await readJsonBody(jsonReq(huge))).toBeNull();
  });

  it('rejects when the declared Content-Length exceeds the cap', async () => {
    // Guard fires on the header before the body is even read.
    expect(await readJsonBody(jsonReq('{}', { 'content-length': '99999' }))).toBeNull();
  });

  it('honours a custom cap', async () => {
    expect(await readJsonBody(jsonReq('{"a":1}'), 4)).toBeNull();
  });
});
