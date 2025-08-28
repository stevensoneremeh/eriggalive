import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  const { data, error } = await supabase.from("branding").select("dark_logo_url,dark_bg_hex").single()

  if (error && error.code !== "PGRST116") {
    console.error("Branding fetch error:", error)
  }

  return NextResponse.json(data || { dark_logo_url: null, dark_bg_hex: null })
}
