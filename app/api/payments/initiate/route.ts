import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { z } from "zod"

const initiatePaymentSchema = z.object({
  tier_code: z.enum(["PRO", "ENT"]),
  interval: z.enum(["monthly", "quarterly", "annually"]),
  amount_ngn: z.number().positive(),
  email: z.string().email(),
  metadata: z.object({
    tier: z.string(),
    interval: z.string(),
    username: z.string(),
    full_name: z.string(),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = initiatePaymentSchema.parse(body)

    // Validate pricing
    const tierPrices = {
      PRO: {
        monthly: 9900,
        quarterly: 29700,
        annually: 118800,
      },
      ENT: {
        annually: 119900,
      },
    }

    const expectedAmount = tierPrices[validatedData.tier_code]?.[validatedData.interval]
    if (!expectedAmount || expectedAmount !== validatedData.amount_ngn) {
      return NextResponse.json({ error: "Invalid pricing" }, { status: 400 })
    }

    // Create payment record
    const paymentRef = `erigga_${validatedData.tier_code}_${validatedData.interval}_${Date.now()}`

    const { error: insertError } = await supabase.from("payments").insert({
      user_id: user.id,
      tier_code: validatedData.tier_code,
      interval: validatedData.interval,
      amount_ngn: validatedData.amount_ngn,
      provider: "paystack",
      provider_ref: paymentRef,
      status: "pending",
      metadata: validatedData.metadata,
    })

    if (insertError) {
      console.error("Payment insert error:", insertError)
      return NextResponse.json({ error: "Failed to create payment record" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      payment_reference: paymentRef,
      amount: validatedData.amount_ngn,
    })
  } catch (error) {
    console.error("Payment initiation error:", error)
    return NextResponse.json(
      { error: error instanceof z.ZodError ? "Invalid request data" : "Internal server error" },
      { status: 500 },
    )
  }
}
