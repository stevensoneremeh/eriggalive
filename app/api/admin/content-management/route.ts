import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db/client"
import { sql } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    let data: any[] = []

    switch (type) {
      case "homepage":
        data = await db.execute(sql`
          SELECT * FROM homepage 
          ORDER BY display_order ASC
        `) as any[]
        break

      case "events":
        data = await db.execute(sql`
          SELECT * FROM events 
          ORDER BY event_date DESC
        `) as any[]
        break

      case "merch":
        data = await db.execute(sql`
          SELECT * FROM merch 
          ORDER BY created_at DESC
        `) as any[]
        break

      case "vault":
        data = await db.execute(sql`
          SELECT * FROM vault_items 
          ORDER BY created_at DESC
        `) as any[]
        break

      case "videos":
        data = await db.execute(sql`
          SELECT * FROM videos 
          ORDER BY created_at DESC
        `) as any[]
        break

      case "livestreams":
        data = await db.execute(sql`
          SELECT * FROM live_streams 
          ORDER BY created_at DESC
        `) as any[]
        break

      default:
        return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Content management error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const body = await request.json()

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    let result: any

    switch (type) {
      case "homepage":
        result = await db.execute(sql`
          INSERT INTO homepage (title, content, media_url, media_type, display_order, is_active, created_at, updated_at)
          VALUES (
            ${body.title}, ${body.content}, ${body.media_url}, ${body.media_type}, 
            ${body.display_order || 0}, ${body.is_active !== false}, NOW(), NOW()
          )
          RETURNING *
        `)
        break

      case "events":
        result = await db.execute(sql`
          INSERT INTO events (title, description, event_date, location, ticket_price, image_url, created_at, updated_at)
          VALUES (
            ${body.title}, ${body.description}, ${body.event_date}, ${body.location},
            ${body.ticket_price || 0}, ${body.image_url}, NOW(), NOW()
          )
          RETURNING *
        `)
        break

      case "merch":
        result = await db.execute(sql`
          INSERT INTO merch (name, description, price, image_url, stock, is_active, created_at, updated_at)
          VALUES (
            ${body.name}, ${body.description}, ${body.price}, ${body.image_url},
            ${body.stock || 0}, ${body.is_active !== false}, NOW(), NOW()
          )
          RETURNING *
        `)
        break

      case "vault":
        result = await db.execute(sql`
          INSERT INTO vault_items (title, description, media_url, media_type, tier_required, is_active, created_at, updated_at)
          VALUES (
            ${body.title}, ${body.description}, ${body.media_url}, ${body.media_type},
            ${body.tier_required || 'free'}, ${body.is_active !== false}, NOW(), NOW()
          )
          RETURNING *
        `)
        break

      default:
        return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: (result as any[])[0],
    })
  } catch (error) {
    console.error("Content creation error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
