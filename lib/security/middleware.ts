import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { rateLimits } from "./validation"

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: any) => Promise<NextResponse>,
) {
  try {
    const supabase = createServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 })
    }

    return handler(request, user)
  } catch (error) {
    console.error("[Security] Auth middleware error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}

export async function withAdminAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: any) => Promise<NextResponse>,
) {
  try {
    const supabase = createServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    return handler(request, user)
  } catch (error) {
    console.error("[Security] Admin auth middleware error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}

export function withRateLimit(limitKey: keyof typeof rateLimits, identifier: string) {
  const limit = rateLimits[limitKey]
  const key = `${limitKey}:${identifier}`
  const now = Date.now()

  const current = rateLimitStore.get(key)

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + limit.window,
    })
    return { allowed: true, remaining: limit.requests - 1 }
  }

  if (current.count >= limit.requests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime,
    }
  }

  current.count++
  return {
    allowed: true,
    remaining: limit.requests - current.count,
  }
}

export function createSecureResponse(data: any, status = 200) {
  const response = NextResponse.json(data, { status })

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  return response
}
