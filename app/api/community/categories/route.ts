import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()

    const { data: categories, error } = await supabase
      .from("community_categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (error) {
      console.error("Error fetching categories:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return default categories if none exist
    const defaultCategories = [
      { id: 1, name: "General", slug: "general", is_active: true },
      { id: 2, name: "Bars", slug: "bars", is_active: true },
      { id: 3, name: "Music Discussion", slug: "music-discussion", is_active: true },
    ]

    return NextResponse.json({
      categories: categories && categories.length > 0 ? categories : defaultCategories,
    })
  } catch (error: any) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
