import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: tiers, error } = await supabase.from("membership_tiers").select("*").order("code")

    if (error) {
      console.error("Error fetching membership tiers:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch membership tiers" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: tiers,
    })
  } catch (error) {
    console.error("Membership tiers API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
