import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createClient()

    const { data: categories, error } = await supabase
      .from("community_categories")
      .select("id, name, slug, description, icon, color, post_count, display_order")
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (error) {
      console.error("Error fetching categories:", error)
      // Return fallback categories if database query fails
      return NextResponse.json({
        categories: [
          {
            id: 1,
            name: "General Discussion",
            slug: "general",
            description: "General discussions about Erigga and his music",
            icon: "💬",
            color: "#3B82F6",
            post_count: 0,
            display_order: 1,
          },
          {
            id: 2,
            name: "Music & Lyrics",
            slug: "music",
            description: "Discuss Erigga's music, lyrics, and their meanings",
            icon: "🎵",
            color: "#10B981",
            post_count: 0,
            display_order: 2,
          },
          {
            id: 3,
            name: "Freestyle Corner",
            slug: "freestyle",
            description: "Share your own freestyle lyrics and get feedback",
            icon: "🔥",
            color: "#F59E0B",
            post_count: 0,
            display_order: 3,
          },
        ],
      })
    }

    return NextResponse.json({ categories: categories || [] })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({
      categories: [
        {
          id: 1,
          name: "General Discussion",
          slug: "general",
          description: "General discussions",
          icon: "💬",
          color: "#3B82F6",
          post_count: 0,
          display_order: 1,
        },
      ],
    })
  }
}
