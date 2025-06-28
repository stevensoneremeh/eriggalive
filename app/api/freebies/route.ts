import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const tier = searchParams.get("tier")

    let query = supabase
      .from("freebies")
      .select("*")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })

    if (category && category !== "all") {
      query = query.eq("category", category)
    }

    if (tier) {
      // Filter by tier accessibility
      const tierLevels = { grassroot: 0, pioneer: 1, elder: 2, blood: 3 }
      const userTierLevel = tierLevels[tier as keyof typeof tierLevels] || 0

      query = query.or(
        Object.entries(tierLevels)
          .filter(([, level]) => level <= userTierLevel)
          .map(([tierName]) => `required_tier.eq.${tierName}`)
          .join(","),
      )
    }

    const { data: freebies, error } = await query

    if (error) {
      console.error("Error fetching freebies:", error)
      return NextResponse.json({ error: "Failed to fetch freebies" }, { status: 500 })
    }

    return NextResponse.json({ freebies, success: true })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
