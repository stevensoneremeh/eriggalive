import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Get user membership with tier details
    const { data: membershipData, error: membershipError } = await supabase
      .rpc("get_user_membership", { user_uuid: user.id })
      .single()

    if (membershipError) {
      console.error("Error fetching user membership:", membershipError)
      return NextResponse.json({ success: false, error: "Failed to fetch membership data" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        membership: membershipData,
      },
    })
  } catch (error) {
    console.error("User membership API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
