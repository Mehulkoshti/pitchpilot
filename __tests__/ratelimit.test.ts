import { describe, expect, it } from 'vitest';
import { RateLimiter, clientKey } from '@/lib/ratelimit';

describe('RateLimiter', () => {
  it('allows requests up to the limit', () => {
    const limiter = new RateLimiter(3, 1000);
    expect(limiter.check('a', 0).allowed).toBe(true);
    expect(limiter.check('a', 1).allowed).toBe(true);
    expect(limiter.check('a', 2).allowed).toBe(true);
  });

  it('blocks the request that exceeds the limit', () => {
    const limiter = new RateLimiter(2, 1000);
    limiter.check('a', 0);
    limiter.check('a', 1);
    expect(limiter.check('a', 2).allowed).toBe(false);
  });

  it('reports remaining requests accurately', () => {
    const limiter = new RateLimiter(3, 1000);
    expect(limiter.check('a', 0).remaining).toBe(2);
    expect(limiter.check('a', 1).remaining).toBe(1);
    expect(limiter.check('a', 2).remaining).toBe(0);
  });

  it('frees capacity once the window slides past old hits', () => {
    const limiter = new RateLimiter(1, 1000);
    expect(limiter.check('a', 0).allowed).toBe(true);
    expect(limiter.check('a', 500).allowed).toBe(false);
    expect(limiter.check('a', 1001).allowed).toBe(true);
  });

  it('tracks separate keys independently', () => {
    const limiter = new RateLimiter(1, 1000);
    expect(limiter.check('a', 0).allowed).toBe(true);
    expect(limiter.check('b', 0).allowed).toBe(true);
  });

  it('evicts clients whose hits have aged out, so the map does not grow forever', () => {
    const limiter = new RateLimiter(5, 1000);
    for (let i = 0; i < 50; i += 1) limiter.check(`ip-${i}`, 0);
    expect(limiter.trackedKeys).toBe(50);

    // One request a full window later must sweep the 50 stale clients away.
    limiter.check('ip-fresh', 5000);
    expect(limiter.trackedKeys).toBe(1);
  });

  it('does not evict a client that is still inside its window', () => {
    const limiter = new RateLimiter(5, 1000);
    limiter.check('a', 0);
    limiter.check('b', 900);
    limiter.check('c', 1500);
    // 'a' (t=0) has aged out by t=1500; 'b' (t=900) has not.
    expect(limiter.trackedKeys).toBe(2);
    expect(limiter.check('b', 1500).remaining).toBe(3);
  });
});

describe('clientKey', () => {
  it('extracts the first forwarded IP', () => {
    const headers = new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
    expect(clientKey(headers)).toBe('1.2.3.4');
  });

  it('falls back to anonymous when no IP is present', () => {
    expect(clientKey(new Headers())).toBe('anonymous');
  });

  it('prefers a platform-trusted header over spoofable X-Forwarded-For', () => {
    // X-Forwarded-For is client-set and spoofable; the platform header wins so
    // an attacker rotating XFF cannot escape their rate-limit bucket.
    const headers = new Headers({
      'x-forwarded-for': '9.9.9.9',
      'x-nf-client-connection-ip': '203.0.113.7',
    });
    expect(clientKey(headers)).toBe('203.0.113.7');
  });

  it('uses x-real-ip when no Netlify header is present', () => {
    const headers = new Headers({
      'x-real-ip': '203.0.113.9',
      'x-forwarded-for': '9.9.9.9',
    });
    expect(clientKey(headers)).toBe('203.0.113.9');
  });
});
