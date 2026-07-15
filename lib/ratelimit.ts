/**
 * In-memory sliding-window rate limiter.
 *
 * Protects the AI endpoints from abuse without an external dependency. Suitable
 * for a single-instance deployment; a distributed deployment would swap the
 * store for Redis behind the same interface. Pure logic aside from reading the
 * caller-supplied timestamp, which keeps it deterministic under test.
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
}

/** Shared limiter instance for the AI routes. */
export const aiRateLimiter = new RateLimiter();

/**
 * Best-effort client key from a request's forwarded headers. Falls back to a
 * constant bucket so the limiter still applies when no IP is available.
 */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim();
  return ip && ip.length > 0 ? ip : 'anonymous';
}
