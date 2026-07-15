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
});

describe('clientKey', () => {
  it('extracts the first forwarded IP', () => {
    const headers = new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
    expect(clientKey(headers)).toBe('1.2.3.4');
  });

  it('falls back to anonymous when no IP is present', () => {
    expect(clientKey(new Headers())).toBe('anonymous');
  });
});
