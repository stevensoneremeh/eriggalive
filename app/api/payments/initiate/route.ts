import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PaymentInitiateRequestSchema } from "@/lib/types/ticketing"
import { z } from "zod"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Parse and validate request
    const body = await request.json()
    const validatedData = PaymentInitiateRequestSchema.parse(body)

    const { context, context_id, amount_ngn, plan_code, interval, tier_code, custom_amount } = validatedData

    // Calculate final amount based on context
    let finalAmount: number
    let metadata: Record<string, any> = {}

    if (context === "ticket") {
      // Get current event and its price
      const { data: settings } = await supabase
        .from("settings")
        .select("value_json")
        .eq("key", "current_event_id")
        .single()

      if (!settings?.value_json || settings.value_json === "null") {
        return NextResponse.json({ error: "No active event found" }, { status: 400 })
      }

      const eventId = settings.value_json as string
      const { data: event } = await supabase
        .from("events_v2")
        .select("*")
        .eq("id", eventId)
        .eq("status", "active")
        .single()

      if (!event) {
        return NextResponse.json({ error: "Event not found or not active" }, { status: 400 })
      }

      // Check capacity
      const { data: capacityRemaining } = await supabase.rpc("get_event_capacity_remaining", { p_event_id: eventId })
      if (capacityRemaining <= 0) {
        return NextResponse.json({ error: "Event is sold out" }, { status: 400 })
      }

      finalAmount = event.ticket_price_ngn
      metadata = {
        event_id: eventId,
        event_title: event.title,
        context: "ticket",
      }
    } else if (context === "membership") {
      // Handle membership payments
      const { data: pricingSettings } = await supabase
        .from("settings")
        .select("value_json")
        .in("key", ["pro_monthly_price_ngn", "pro_quarterly_price_ngn", "pro_yearly_price_ngn", "enterprise_min_ngn"])

      const pricing = pricingSettings.reduce(
        (acc, setting) => {
          acc[setting.key] = setting.value_json as number
          return acc
        },
        {} as Record<string, number>,
      )

      if (tier_code === "ENT") {
        // Enterprise custom amount
        if (!custom_amount) {
          return NextResponse.json({ error: "Custom amount required for Enterprise tier" }, { status: 400 })
        }
        finalAmount = custom_amount
        metadata = {
          tier_code: "ENT",
          interval: "annual_custom",
          context: "membership",
        }
      } else if (tier_code === "PRO") {
        // Pro tier with intervals
        switch (interval) {
          case "monthly":
            finalAmount = pricing.pro_monthly_price_ngn || 10000
            break
          case "quarterly":
            finalAmount = pricing.pro_quarterly_price_ngn || 30000
            break
          case "yearly":
            finalAmount = pricing.pro_yearly_price_ngn || 120000
            break
          default:
            return NextResponse.json({ error: "Invalid interval for Pro tier" }, { status: 400 })
        }
        metadata = {
          tier_code: "PRO",
          interval,
          context: "membership",
        }
      } else {
        return NextResponse.json({ error: "Invalid tier code" }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: "Invalid payment context" }, { status: 400 })
    }

    // Generate unique reference
    const reference = `erigga_${context}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        context,
        context_id,
        provider: "paystack",
        provider_ref: reference,
        amount_ngn: finalAmount,
        status: "pending",
        metadata,
      })
      .select()
      .single()

    if (paymentError) {
      console.error("Payment creation error:", paymentError)
      return NextResponse.json({ error: "Failed to create payment record" }, { status: 500 })
    }

    // Initialize Paystack transaction
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: finalAmount * 100, // Convert to kobo
        reference,
        currency: "NGN",
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payments/callback`,
        metadata: {
          payment_id: payment.id,
          user_id: user.id,
          context,
          ...metadata,
        },
      }),
    })

    if (!paystackResponse.ok) {
      console.error("Paystack initialization failed:", await paystackResponse.text())
      return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 })
    }

    const paystackData = await paystackResponse.json()

    if (!paystackData.status) {
      console.error("Paystack error:", paystackData.message)
      return NextResponse.json({ error: paystackData.message || "Payment initialization failed" }, { status: 500 })
    }

    return NextResponse.json({
      payment_id: payment.id,
      reference,
      authorization_url: paystackData.data.authorization_url,
      amount: finalAmount,
      context,
      metadata,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 })
    }

    console.error("Payment initiation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
