import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

<<<<<<< HEAD
=======
// Force dynamic rendering
export const dynamic = 'force-dynamic'

>>>>>>> new
export async function GET() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

<<<<<<< HEAD
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
=======
    // Get user profile (change "user_profiles" to "users" if that's your table)
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
>>>>>>> new
      .single()

    if (profileError) {
      console.error("Error fetching profile:", profileError)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    return NextResponse.json({
      profile: { ...profile, email: user.email },
      success: true,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
