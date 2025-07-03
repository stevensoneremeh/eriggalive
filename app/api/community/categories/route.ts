import { NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase-utils"

/**
 * GET /api/community/categories
 * Returns `id, name, slug` only. If the table or columns are missing
 * we return an empty list so the frontend never crashes.
 */
export async function GET() {
  try {
    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase.from("community_categories").select("id, name, slug").order("name")

    if (error) throw error
    return NextResponse.json(data ?? [], { status: 200 })
  } catch (err) {
    console.warn("GET /api/community/categories -> fallback to []", err)
    return NextResponse.json([], { status: 200 })
  }
}
