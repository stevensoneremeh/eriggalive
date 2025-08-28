import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()

    // Get authenticated user with proper error handling
    let user = null
    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        console.error("Auth error:", authError)
        return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
      }

      user = authUser
    } catch (error) {
      console.error("Failed to get user:", error)
      return NextResponse.json({ error: "Authentication service unavailable" }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get user profile with proper error handling
    try {
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", user.id)
        .single()

      if (profileError) {
        console.error("Error fetching profile:", profileError)
        return NextResponse.json({ error: "Profile not found" }, { status: 404 })
      }

      if (!profile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 })
      }

      return NextResponse.json({
        profile: { ...profile, email: user.email },
        success: true,
      })
    } catch (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
    }
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
