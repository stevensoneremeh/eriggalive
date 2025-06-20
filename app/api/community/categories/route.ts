
import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-utils"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    const { data: categories, error } = await supabase
      .from("community_categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (error) {
      console.error("Error fetching categories:", error)
      // Return default categories as fallback
      return NextResponse.json({
        categories: [
          { id: 1, name: "General", slug: "general", description: "General discussions", is_active: true },
          { id: 2, name: "Bars", slug: "bars", description: "Share your bars and lyrics", is_active: true },
          { id: 3, name: "Discussion", slug: "discussion", description: "Music discussions", is_active: true },
        ],
      })
    }

    return NextResponse.json({ categories: categories || [] })
  } catch (error: any) {
    console.error("API Error:", error)
    // Return default categories as fallback
    return NextResponse.json({
      categories: [
        { id: 1, name: "General", slug: "general", description: "General discussions", is_active: true },
        { id: 2, name: "Bars", slug: "bars", description: "Share your bars and lyrics", is_active: true },
        { id: 3, name: "Discussion", slug: "discussion", description: "Music discussions", is_active: true },
      ],
    })
  }
}
