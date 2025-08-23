import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's current membership
    const { data: membership, error } = await supabase
      .from("memberships")
      .select(`
        *,
        membership_tiers!inner(code, name, description)
      `)
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Membership fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch membership" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      membership: membership || null,
    })
  } catch (error) {
    console.error("User membership API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
