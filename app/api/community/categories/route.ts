import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: categories, error } = await supabase
      .from("community_categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      categories: categories || [],
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Check if user is admin
    const { data: userProfile } = await supabase.from("users").select("role").eq("auth_user_id", user.id).single()

    if (!userProfile || !["admin", "super_admin"].includes(userProfile.role)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { name, slug, description, icon, color } = body

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 })
    }

    const { data: category, error } = await supabase
      .from("community_categories")
      .insert({
        name,
        slug,
        description,
        icon: icon || "💬",
        color: color || "#6B7280",
        is_active: true,
      })
      .select("*")
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      category,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
