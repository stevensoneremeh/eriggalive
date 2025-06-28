import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const freebieId = params.id

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

    const { data: freebie, error } = await supabase.from("freebies").select("*").eq("id", freebieId).single()

    if (error) {
      console.error("Error fetching freebie:", error)
      return NextResponse.json({ error: "Freebie not found" }, { status: 404 })
    }

    return NextResponse.json({ freebie, success: true })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const freebieId = params.id
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
      .update({
        name: body.name,
        slug: body.slug,
        description: body.description,
        short_description: body.short_description,
        images: body.images,
        thumbnail_url: body.thumbnail_url,
        category: body.category,
        subcategory: body.subcategory,
        brand: body.brand,
        required_tier: body.required_tier,
        stock_quantity: body.stock_quantity,
        max_per_user: body.max_per_user,
        is_active: body.is_active,
        is_featured: body.is_featured,
        requires_shipping: body.requires_shipping,
        weight: body.weight,
        dimensions: body.dimensions,
        tags: body.tags,
        expires_at: body.expires_at,
        metadata: body.metadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", freebieId)
      .select()
      .single()

    if (error) {
      console.error("Error updating freebie:", error)
      return NextResponse.json({ error: "Failed to update freebie" }, { status: 500 })
    }

    return NextResponse.json({ freebie, success: true })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const freebieId = params.id

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

    const { error } = await supabase.from("freebies").delete().eq("id", freebieId)

    if (error) {
      console.error("Error deleting freebie:", error)
      return NextResponse.json({ error: "Failed to delete freebie" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
