import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { data, error } = await supabase.from("user_profiles").select("coin_balance").eq("id", userId).single()

    if (error) {
      console.error("Error fetching coin balance:", error)
      return NextResponse.json({ error: "Failed to fetch coin balance" }, { status: 500 })
    }

    return NextResponse.json({
      balance: data?.coin_balance || 0,
    })
  } catch (error) {
    console.error("Error in balance API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
