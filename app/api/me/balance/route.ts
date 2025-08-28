import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ balance: 0, walletBalance: 0 })
  }

  const { data: wallet } = await supabase
    .from("user_wallets")
    .select("coin_balance, balance_naira")
    .eq("user_id", user.id)
    .single()

  const { data: profile } = await supabase.from("users").select("coins").eq("id", user.id).single()

  return NextResponse.json({
    balance: wallet?.coin_balance || profile?.coins || 0,
    walletBalance: wallet?.balance_naira || 0,
  })
}
