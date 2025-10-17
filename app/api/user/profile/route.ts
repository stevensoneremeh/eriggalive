
import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Fetch user profile data using the correct mapping
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError) {
      console.error("Profile fetch error:", profileError)
      
      // If profile doesn't exist, return user data from auth
      return NextResponse.json({ 
        success: true,
        profile: {
          id: user.id,
          email: user.email,
          auth_user_id: user.id,
          created_at: user.created_at
        },
        message: "Profile not found in users table, using auth data"
      })
    }

    return NextResponse.json({ 
      success: true,
      profile 
    })
  } catch (error) {
    console.error("Profile route error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
