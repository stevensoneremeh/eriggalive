import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase-utils"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check feature flag
    const featureEnabled = process.env.FEATURE_PAYSTACK_TICKETS === "true"
    if (!featureEnabled) {
      return NextResponse.json({ error: "Feature not available" }, { status: 403 })
    }

    const { eventId, surveyData, amount } = await request.json()

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    const price = 20000 // Fixed price for all tickets
    const amountInKobo = price * 100

    // Generate unique reference
    const reference = `ticket_${Date.now()}_${user.id.slice(0, 8)}`

    // Initialize Paystack transaction
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: amountInKobo,
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/tickets/verify?reference=${reference}`,
        metadata: {
          user_id: user.id,
          event_id: eventId,
          order_type: "ticket",
          survey_data: surveyData,
          fixed_price: price,
        },
      }),
    })

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok) {
      console.error("Paystack initialization failed:", paystackData)
      return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 })
    }

    // Store pending payment in database
    const { error: dbError } = await supabase.from("payments").insert({
      user_id: user.id,
      reference,
      amount: price,
      currency: "NGN",
      payment_method: "paystack",
      status: "pending",
      metadata: {
        event_id: eventId,
        survey_data: surveyData,
        paystack_reference: reference,
        fixed_price: price,
      },
    })

    if (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: "Failed to create payment record" }, { status: 500 })
    }

    return NextResponse.json({
      authorization_url: paystackData.data.authorization_url,
      reference,
      amount: price,
    })
  } catch (error) {
    console.error("Ticket checkout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
