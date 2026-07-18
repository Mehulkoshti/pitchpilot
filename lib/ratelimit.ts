/**
 * In-memory sliding-window rate limiter for the AI routes. Single-instance; a
 * distributed deployment would swap the store for Redis behind this interface.
 */

/** The outcome of a rate-limit check. */
export interface RateLimitResult {
  readonly allowed: boolean;
  /** Requests still available in the current window. */
  readonly remaining: number;
  /** Epoch milliseconds when the window resets. */
  readonly resetAt: number;
}

/** Default policy: requests permitted per window per key. */
const DEFAULT_LIMIT = 20;
/** Default sliding window length in milliseconds. */
const DEFAULT_WINDOW_MS = 60_000;

/** A fixed-size sliding-window limiter keyed by client identifier. */
export class RateLimiter {
  private readonly hits = new Map<string, number[]>();
  /** When the stale-key sweep last ran, so it runs at most once per window. */
  private lastSweep = Number.NEGATIVE_INFINITY;

  constructor(
    private readonly limit: number = DEFAULT_LIMIT,
    private readonly windowMs: number = DEFAULT_WINDOW_MS
  ) {}

  /**
   * Record a hit for `key` and report whether it is within the limit.
   *
   * @param key stable client identifier (e.g. hashed IP).
   * @param now current epoch milliseconds (injected for testability).
   */
  check(key: string, now: number): RateLimitResult {
    this.sweep(now);
    const windowStart = now - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((ts) => ts > windowStart);

    if (recent.length >= this.limit) {
      const oldest = recent[0] ?? now;
      this.hits.set(key, recent);
      return { allowed: false, remaining: 0, resetAt: oldest + this.windowMs };
    }

    recent.push(now);
    this.hits.set(key, recent);
    return {
      allowed: true,
      remaining: this.limit - recent.length,
      resetAt: now + this.windowMs,
    };
  }

  /** Number of clients currently tracked. Exposed for tests and diagnostics. */
  get trackedKeys(): number {
    return this.hits.size;
  }

  /** Drop keys whose hits have all aged out, so the map can't grow unbounded. */
  private sweep(now: number): void {
    if (now - this.lastSweep < this.windowMs) return;
    this.lastSweep = now;
    const windowStart = now - this.windowMs;
    for (const [key, timestamps] of this.hits) {
      if (timestamps.every((ts) => ts <= windowStart)) this.hits.delete(key);
    }
  }
}

/** Shared limiter instance for the AI routes. */
export const aiRateLimiter = new RateLimiter();

/**
 * Client key from the most trustworthy IP header. Platform-injected headers come
 * first because `X-Forwarded-For` is client-set and spoofable; a shared
 * `anonymous` bucket is the fail-closed fallback.
 */
const TRUSTED_IP_HEADERS = ['x-nf-client-connection-ip', 'x-real-ip'] as const;

export function clientKey(headers: Headers): string {
  for (const header of TRUSTED_IP_HEADERS) {
    const value = headers.get(header)?.trim();
    if (value) return value;
  }
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded && forwarded.length > 0 ? forwarded : 'anonymous';
}
