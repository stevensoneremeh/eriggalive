import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const { dark_logo_url, dark_bg_hex } = await req.json()

  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("branding")
    .upsert({ id: 1, dark_logo_url, dark_bg_hex })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}
