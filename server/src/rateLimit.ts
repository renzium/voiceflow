/**
 * Fixed-window, in-memory rate limiter. Good enough for a single-instance demo
 * deployment; swap for Redis or the platform's limiter when scaling out.
 */
export class RateLimiter {
  private hits = new Map<string, { count: number; windowStart: number }>();

  constructor(
    private max = 30,
    private windowMs = 60_000,
    private now: () => number = Date.now,
  ) {}

  allow(key: string): boolean {
    const t = this.now();
    const entry = this.hits.get(key);
    if (!entry || t - entry.windowStart >= this.windowMs) {
      this.hits.set(key, { count: 1, windowStart: t });
      this.prune(t);
      return true;
    }
    entry.count += 1;
    return entry.count <= this.max;
  }

  private prune(t: number) {
    if (this.hits.size < 10_000) return;
    for (const [k, v] of this.hits) {
      if (t - v.windowStart >= this.windowMs) this.hits.delete(k);
    }
  }
}
