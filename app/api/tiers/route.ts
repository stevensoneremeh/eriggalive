import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    const { data: tiers, error } = await supabase
      .from("tiers")
      .select("*")
      .eq("is_active", true)
      .order("rank", { ascending: true })

    if (error) {
      console.error("Error fetching tiers:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch tiers" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      tiers: tiers || [],
    })
  } catch (error) {
    console.error("Tiers API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
