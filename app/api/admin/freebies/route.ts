import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const category = searchParams.get("category")
    const status = searchParams.get("status")

    // Check admin access
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()

    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    let query = supabase.from("freebies").select("*").order("created_at", { ascending: false })

    if (category && category !== "all") {
      query = query.eq("category", category)
    }

    if (status && status !== "all") {
      query = query.eq("is_active", status === "active")
    }

    const startIndex = (page - 1) * limit
    query = query.range(startIndex, startIndex + limit - 1)

    const { data: freebies, error } = await query

    if (error) {
      console.error("Error fetching freebies:", error)
      return NextResponse.json({ error: "Failed to fetch freebies" }, { status: 500 })
    }

    return NextResponse.json({ freebies, success: true })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Check admin access
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()

    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { data: freebie, error } = await supabase
      .from("freebies")
      .insert({
        name: body.name,
        slug: body.slug,
        description: body.description,
        short_description: body.short_description,
        images: body.images || [],
        thumbnail_url: body.thumbnail_url,
        category: body.category,
        subcategory: body.subcategory,
        brand: body.brand || "Erigga",
        required_tier: body.required_tier || "grassroot",
        stock_quantity: body.stock_quantity || 0,
        max_per_user: body.max_per_user || 1,
        is_active: body.is_active ?? true,
        is_featured: body.is_featured ?? false,
        requires_shipping: body.requires_shipping ?? true,
        weight: body.weight,
        dimensions: body.dimensions || {},
        tags: body.tags || [],
        claim_count: 0,
        total_claims: 0,
        expires_at: body.expires_at,
        metadata: body.metadata || {},
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating freebie:", error)
      return NextResponse.json({ error: "Failed to create freebie" }, { status: 500 })
    }

    return NextResponse.json({ freebie, success: true })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
