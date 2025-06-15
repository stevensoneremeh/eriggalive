import { type NextRequest, NextResponse } from "next/server"
import { authService } from "@/lib/auth/auth-service"
import { authorizationService } from "./authorization"
import { createRateLimitMiddleware } from "./rate-limiter"
import { auditLogger } from "./audit-logger"

interface MiddlewareOptions {
  requireAuth?: boolean
  requiredPermission?: {
    resource: string
    action: string
  }
  rateLimit?: {
    maxRequests: number
    windowMs: number
  }
  validateInput?: (data: any) => { isValid: boolean; errors: string[] }
  auditAction?: string
}

export function createSecureMiddleware(options: MiddlewareOptions = {}) {
  return async function middleware(
    request: NextRequest,
    handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  ) {
    const startTime = Date.now()
    let userId: string | null = null
    const context: any = {}

    try {
      // 1. Rate limiting
      if (options.rateLimit) {
        const rateLimitMiddleware = createRateLimitMiddleware(options.rateLimit)
        await rateLimitMiddleware(request)
      }

      // 2. Authentication
      if (options.requireAuth) {
        const authHeader = request.headers.get("authorization")
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }

        const token = authHeader.substring(7)
        try {
          const decoded = await authService.verifyAccessToken(token)
          userId = decoded.sub
          context.user = decoded
        } catch (error) {
          return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
        }
      }

      // 3. Authorization
      if (options.requiredPermission && userId) {
        try {
          await authorizationService.requirePermission(
            userId,
            options.requiredPermission.resource,
            options.requiredPermission.action,
            context,
          )
        } catch (error) {
          return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
        }
      }

      // 4. Input validation
      if (options.validateInput && request.method !== "GET") {
        try {
          const body = await request.json()
          const validation = options.validateInput(body)

          if (!validation.isValid) {
            return NextResponse.json(
              {
                error: "Validation failed",
                details: validation.errors,
              },
              { status: 400 },
            )
          }

          context.validatedData = body
        } catch (error) {
          return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
        }
      }

      // 5. Execute handler
      const response = await handler(request, context)

      // 6. Audit logging
      if (options.auditAction) {
        await auditLogger.log({
          action: options.auditAction,
          userId,
          ipAddress: getClientIP(request),
          userAgent: request.headers.get("user-agent") || undefined,
          metadata: {
            method: request.method,
            url: request.url,
            responseStatus: response.status,
            duration: Date.now() - startTime,
          },
        })
      }

      // Add security headers
      response.headers.set("X-Content-Type-Options", "nosniff")
      response.headers.set("X-Frame-Options", "DENY")
      response.headers.set("X-XSS-Protection", "1; mode=block")
      response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
      response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

      return response
    } catch (error) {
      console.error("Middleware error:", error)

      // Log security incidents
      await auditLogger.log({
        action: "SECURITY_ERROR",
        userId,
        ipAddress: getClientIP(request),
        userAgent: request.headers.get("user-agent") || undefined,
        metadata: {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          url: request.url,
          method: request.method,
        },
        severity: "high",
      })

      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  }
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const cfConnectingIp = request.headers.get("cf-connecting-ip")

  return forwarded?.split(",")[0] || realIp || cfConnectingIp || "unknown"
}

// Pre-configured middleware for common use cases
export const authMiddleware = createSecureMiddleware({
  requireAuth: true,
  rateLimit: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
  auditAction: "API_ACCESS",
})

export const publicMiddleware = createSecureMiddleware({
  rateLimit: { maxRequests: 200, windowMs: 60000 }, // 200 requests per minute
})

export const adminMiddleware = createSecureMiddleware({
  requireAuth: true,
  requiredPermission: { resource: "admin", action: "access" },
  rateLimit: { maxRequests: 50, windowMs: 60000 }, // 50 requests per minute
  auditAction: "ADMIN_ACCESS",
})
