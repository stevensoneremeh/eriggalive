import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    const { data: tiers, error } = await supabase.from("membership_tiers").select("*").order("code")

    if (error) {
      console.error("Tiers fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch tiers" }, { status: 500 })
    }

    // Get pricing from settings
    const { data: settings } = await supabase
      .from("settings")
      .select("key, value_json")
      .in("key", ["pro_monthly_price_ngn", "pro_quarterly_price_ngn", "pro_yearly_price_ngn"])

    const pricing =
      settings?.reduce((acc: any, setting: any) => {
        acc[setting.key] = setting.value_json
        return acc
      }, {}) || {}

    return NextResponse.json({
      success: true,
      tiers: tiers.map((tier) => ({
        ...tier,
        pricing:
          tier.code === "PRO"
            ? {
                monthly: pricing.pro_monthly_price_ngn || 10000,
                quarterly: pricing.pro_quarterly_price_ngn || 30000,
                yearly: pricing.pro_yearly_price_ngn || 120000,
              }
            : null,
      })),
    })
  } catch (error) {
    console.error("Tiers API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
