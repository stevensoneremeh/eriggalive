import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ 
        balance: 0,
        error: authError?.message 
      }, { status: authError ? 401 : 200 })
    }

    const { data, error } = await supabase
      .from("wallet")
      .select("balance")
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.error("Wallet fetch error:", error)
      return NextResponse.json({ balance: 0 }, { status: 200 })
    }

    return NextResponse.json({ balance: data?.balance ?? 0 })
  } catch (error) {
    console.error("Error fetching wallet balance:", error)
    return NextResponse.json({ 
      balance: 0,
      error: "Internal server error" 
    }, { status: 500 })
  }
}