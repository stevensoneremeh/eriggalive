<<<<<<< HEAD
import { NextRequest, NextResponse } from "next/server"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export async function GET() {
  try {
    const supabase = createClientComponentClient()

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
      categories: categories && categories.length > 0 ? categories : defaultCategories 
    })
  } catch (error: any) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
=======
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const categories = [
      {
        id: 1,
        name: "General Discussion",
        slug: "general",
        description: "General conversations about Erigga and music",
        color: "#3B82F6",
        icon: "💬",
        display_order: 1
      },
      {
        id: 2,
        name: "Music & Lyrics",
        slug: "music",
        description: "Discuss Erigga's music, lyrics, and releases",
        color: "#8B5CF6",
        icon: "🎵",
        display_order: 2
      },
      {
        id: 3,
        name: "Fan Art & Media",
        slug: "fanart",
        description: "Share your creative works and fan art",
        color: "#10B981",
        icon: "🎨",
        display_order: 3
      },
      {
        id: 4,
        name: "Events & News",
        slug: "events",
        description: "Latest news, events, and announcements",
        color: "#F59E0B",
        icon: "🎤",
        display_order: 4
      },
      {
        id: 5,
        name: "Support & Help",
        slug: "support",
        description: "Get help and support from the community",
        color: "#6B7280",
        icon: "❓",
        display_order: 5
      }
    ]

    return NextResponse.json({
      success: true,
      categories
    })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch categories" }, { status: 500 })
>>>>>>> new
  }
}
