import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: banks, error } = await supabase
      .from("nigerian_banks")
      .select("*")
      .eq("is_active", true)
      .order("bank_name")

    if (error) {
      console.error("Error fetching banks:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch banks" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      banks: banks || [],
    })
  } catch (error) {
    console.error("Banks list API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
