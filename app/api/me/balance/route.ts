import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ balance: 0 })
  }

  const { data } = await supabase.from("wallet").select("balance").eq("user_id", user.id).single()

  return NextResponse.json({ balance: data?.balance ?? 0 })
}
