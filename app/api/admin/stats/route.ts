import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

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

    // Fetch stats in parallel
    const [
      { count: totalUsers },
      { count: activeUsers },
      { count: totalPosts },
      { count: totalProducts },
      { count: totalFreebies },
      { count: pendingClaims },
    ] = await Promise.all([
      supabase.from("user_profiles").select("*", { count: "exact", head: true }),
      supabase.from("user_profiles").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("community_posts").select("*", { count: "exact", head: true }).eq("is_deleted", false),
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("freebies").select("*", { count: "exact", head: true }),
      supabase.from("freebie_claims").select("*", { count: "exact", head: true }).eq("status", "pending"),
    ])

    const stats = {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalPosts: totalPosts || 0,
      totalProducts: totalProducts || 0,
      totalFreebies: totalFreebies || 0,
      totalRevenue: 0, // This would come from payment records
      pendingOrders: 0, // This would come from order records
      pendingClaims: pendingClaims || 0,
    }

    return NextResponse.json({ stats, success: true })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
