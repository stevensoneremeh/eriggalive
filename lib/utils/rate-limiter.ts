
interface RateLimitEntry {
  count: number
  resetAt: number
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>()
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  check(key: string): { allowed: boolean; remaining: number } {
    const now = Date.now()
    const entry = this.limits.get(key)

    if (!entry || now > entry.resetAt) {
      this.limits.set(key, {
        count: 1,
        resetAt: now + this.windowMs,
      })
      return { allowed: true, remaining: this.maxRequests - 1 }
    }

    if (entry.count >= this.maxRequests) {
      return { allowed: false, remaining: 0 }
    }

    entry.count++
    return { allowed: true, remaining: this.maxRequests - entry.count }
  }

  reset(key: string): void {
    this.limits.delete(key)
  }
}

export const adminRateLimiter = new RateLimiter(50, 60000) // 50 requests per minute
