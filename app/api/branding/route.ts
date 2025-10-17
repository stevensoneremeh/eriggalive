import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("branding").select("dark_logo_url,dark_bg_hex").single()

    if (error) {
      console.error("Branding fetch error:", error)
      // Return default branding if table doesn't exist or has no data
      return NextResponse.json({ dark_logo_url: null, dark_bg_hex: null })
    }

    return NextResponse.json(data || { dark_logo_url: null, dark_bg_hex: null })
  } catch (error) {
    console.error("Branding API error:", error)
    return NextResponse.json({ dark_logo_url: null, dark_bg_hex: null })
  }
}
