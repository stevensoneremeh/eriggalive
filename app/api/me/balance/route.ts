import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering - uses cookies which requires runtime evaluation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ balance: 0 })
    }

    const { data } = await supabase.from("wallet").select("balance").eq("user_id", user.id).single()

    return NextResponse.json({ balance: data?.balance ?? 0 })
  } catch (error) {
    console.error("Error fetching wallet balance:", error)
    return NextResponse.json({ balance: 0 }, { status: 500 })
  }
}