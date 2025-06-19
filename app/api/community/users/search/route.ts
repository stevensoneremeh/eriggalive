import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, users: [] })
    }

    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("users")
      .select("id, username, full_name, avatar_url")
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(5)

    if (error) {
      console.error("Error searching users:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const users = (data || []).map((u) => ({
      id: u.id,
      username: u.username,
      full_name: u.full_name,
      avatar_url: u.avatar_url,
    }))

    return NextResponse.json({ success: true, users })
  } catch (error: any) {
    console.error("Search users API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
