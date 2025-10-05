import { type NextRequest, NextResponse } from "next/server"
<<<<<<< HEAD
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
=======
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
>>>>>>> new
    const userId = params.id

    // Get user by internal ID
    const { data: user, error } = await supabase
      .from("users")
      .select("id, auth_user_id, username, full_name, avatar_url, tier")
      .eq("id", userId)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ data: user })
  } catch (error: any) {
    console.error("Get user API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
