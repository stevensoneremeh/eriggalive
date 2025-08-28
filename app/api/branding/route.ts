import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables")
      return NextResponse.json({ dark_logo_url: null, dark_bg_hex: null })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
      const { data, error } = await supabase.from("branding").select("dark_logo_url,dark_bg_hex").single()

      if (error && error.code !== "PGRST116") {
        console.error("Branding fetch error:", error)
      }

      return NextResponse.json(data || { dark_logo_url: null, dark_bg_hex: null })
    } catch (fetchError) {
      console.error("Database fetch failed:", fetchError)
      return NextResponse.json({ dark_logo_url: null, dark_bg_hex: null })
    }
  } catch (error) {
    console.error("Branding API error:", error)
    return NextResponse.json({ dark_logo_url: null, dark_bg_hex: null })
  }
}
