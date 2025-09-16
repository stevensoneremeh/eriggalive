import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("community_categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order")

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
    }

    return NextResponse.json({ categories: data || [] })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
