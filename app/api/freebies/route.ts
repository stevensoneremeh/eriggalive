import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    const category = searchParams.get("category")
    const required_tier = searchParams.get("required_tier")
    const is_featured = searchParams.get("is_featured")
    const search = searchParams.get("search")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let query = supabase.from("freebies").select("*").eq("is_active", true).order("created_at", { ascending: false })

    if (category) {
      query = query.eq("category", category)
    }

    if (required_tier) {
      query = query.eq("required_tier", required_tier)
    }

    if (is_featured === "true") {
      query = query.eq("is_featured", true)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    query = query.range(offset, offset + limit - 1)

    const { data: freebies, error } = await query

    if (error) {
      console.error("Error fetching freebies:", error)
      return NextResponse.json({ error: "Failed to fetch freebies" }, { status: 500 })
    }

    return NextResponse.json({ freebies })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
