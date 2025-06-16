interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

interface RateLimitEntry {
  count: number
  resetTime: number
  blocked: boolean
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup()
      },
      5 * 60 * 1000,
    )
  }

  async checkLimit(
    key: string,
    maxRequests: number,
    windowSeconds: number,
    options: { skipOnSuccess?: boolean } = {},
  ): Promise<void> {
    const now = Date.now()
    const windowMs = windowSeconds * 1000
    const resetTime = now + windowMs

    let entry = this.store.get(key)

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      entry = {
        count: 1,
        resetTime,
        blocked: false,
      }
      this.store.set(key, entry)
      return
    }

    if (entry.blocked && now < entry.resetTime) {
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil((entry.resetTime - now) / 1000)} seconds`)
    }

    entry.count++

    if (entry.count > maxRequests) {
      entry.blocked = true
      throw new Error(`Rate limit exceeded. Maximum ${maxRequests} requests per ${windowSeconds} seconds`)
    }

    this.store.set(key, entry)
  }

  // Get current usage for a key
  getUsage(key: string): { count: number; remaining: number; resetTime: number } | null {
    const entry = this.store.get(key)
    if (!entry) return null

    return {
      count: entry.count,
      remaining: Math.max(0, entry.resetTime - Date.now()),
      resetTime: entry.resetTime,
    }
  }

  // Reset limit for a key
  reset(key: string): void {
    this.store.delete(key)
  }

  // Clean up expired entries
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key)
      }
    }
  }

  // Destroy the rate limiter
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.store.clear()
  }
}

export const rateLimit = new RateLimiter()

// Middleware for API routes
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async (request: Request, identifier?: string) => {
    const key = identifier || getClientIdentifier(request)

    try {
      await rateLimit.checkLimit(key, config.maxRequests, config.windowMs / 1000)
    } catch (error) {
      throw new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: error instanceof Error ? error.message : "Too many requests",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": Math.ceil(config.windowMs / 1000).toString(),
          },
        },
      )
    }
  }
}

function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const cfConnectingIp = request.headers.get("cf-connecting-ip")

  const ip = forwarded?.split(",")[0] || realIp || cfConnectingIp || "unknown"
  return `ip:${ip}`
}
