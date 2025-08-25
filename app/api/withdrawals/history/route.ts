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

    // Fetch user's withdrawal history
    const { data: withdrawals, error } = await supabase
      .from("withdrawals")
      .select(`
        *,
        bank_accounts (
          account_number,
          account_name,
          nigerian_banks (
            bank_name,
            bank_type
          )
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching withdrawals:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch withdrawal history" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      withdrawals: withdrawals || [],
    })
  } catch (error) {
    console.error("Withdrawal history API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
