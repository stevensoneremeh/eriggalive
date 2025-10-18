
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db/client"
import { sql } from "drizzle-orm"
import { serverCache } from "@/lib/utils/server-cache"
import { adminRateLimiter } from "@/lib/utils/rate-limiter"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const { allowed, remaining } = adminRateLimiter.check(`admin-users:${ip}`)

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "X-RateLimit-Remaining": "0" } }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin privileges
    const profileResult = await db.execute(sql`
      SELECT role, tier FROM users WHERE auth_user_id = ${user.id} LIMIT 1
    `)
    const profile = (profileResult as any[])[0]

    const isAdmin =
      user.email === "info@eriggalive.com" ||
      profile?.role === "admin" ||
      profile?.role === "super_admin" ||
      profile?.tier === "enterprise"

    if (!isAdmin) {
      return NextResponse.json({ error: "Insufficient privileges" }, { status: 403 })
    }

    // Get pagination params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100)
    const offset = (page - 1) * limit

    // Check cache
    const cacheKey = `admin-users:page-${page}:limit-${limit}`
    const cached = serverCache.get(cacheKey)
    if (cached) {
      return NextResponse.json({
        success: true,
        ...cached,
        cached: true
      }, {
        headers: { "X-RateLimit-Remaining": remaining.toString() }
      })
    }

    // Fetch users with pagination
    const usersResult = await db.execute(sql`
      SELECT id, auth_user_id, email, full_name, role, tier, created_at, last_seen_at
      FROM users
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `)

    const totalResult = await db.execute(sql`
      SELECT COUNT(*) as total FROM users
    `)
    const total = (totalResult as any[])[0]?.total || 0

    const result = {
      users: usersResult,
      pagination: {
        page,
        limit,
        total: parseInt(total, 10),
        totalPages: Math.ceil(parseInt(total, 10) / limit)
      }
    }

    // Cache for 30 seconds
    serverCache.set(cacheKey, result, 30000)

    return NextResponse.json({
      success: true,
      ...result
    }, {
      headers: { "X-RateLimit-Remaining": remaining.toString() }
    })
  } catch (error) {
    console.error("Admin users fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
