import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    // Check admin access
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Check if user table exists and get profile
    let profile = null
    try {
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("auth_user_id", user.id)
        .single()
      profile = userProfile
    } catch {
      // Fallback to users table
      const { data: userData } = await supabase.from("users").select("role").eq("auth_user_id", user.id).single()
      profile = userData
    }

    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const startIndex = (page - 1) * limit

    // Try user_profiles first, then fallback to users
    let users = []
    try {
      const { data: userProfiles, error } = await supabase
        .from("user_profiles")
        .select("id, username, email, tier, role, is_active, created_at, last_login")
        .order("created_at", { ascending: false })
        .range(startIndex, startIndex + limit - 1)

      if (error) throw error
      users = userProfiles || []
    } catch {
      // Fallback to users table
      const { data: userData, error } = await supabase
        .from("users")
        .select("id, username, email, tier, role, is_active, created_at, last_login")
        .order("created_at", { ascending: false })
        .range(startIndex, startIndex + limit - 1)

      if (error) {
        console.error("Error fetching users:", error)
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
      }
      users = userData || []
    }

    return NextResponse.json({ users, success: true })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
