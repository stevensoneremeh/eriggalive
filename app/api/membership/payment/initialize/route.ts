import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, amount, tier, billing_interval, custom_amount, callback_url, metadata } = body

    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ success: false, message: "Payment service not configured" }, { status: 500 })
    }

    // Validate Enterprise minimum amount
    if (tier === "enterprise" && custom_amount && custom_amount < 150000) {
      return NextResponse.json(
        { success: false, message: "Enterprise tier requires minimum ₦150,000 annually" },
        { status: 400 },
      )
    }

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from("membership_payments")
      .insert({
        user_id: user.id,
        amount: Math.floor(amount / 100), // Convert from kobo to naira
        currency: "NGN",
        status: "pending",
        metadata: {
          ...metadata,
          tier,
          billing_interval,
          custom_amount,
        },
      })
      .select()
      .single()

    if (paymentError) {
      console.error("Payment record creation error:", paymentError)
      return NextResponse.json({ success: false, message: "Failed to create payment record" }, { status: 500 })
    }

    // Initialize Paystack payment
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount,
        currency: "NGN",
        callback_url,
        reference: payment.id, // Use our payment ID as reference
        metadata: {
          ...metadata,
          payment_id: payment.id,
          tier,
          billing_interval,
          custom_amount,
        },
      }),
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status) {
      // Update payment record as failed
      await supabase.from("membership_payments").update({ status: "failed" }).eq("id", payment.id)

      return NextResponse.json(
        { success: false, message: paystackData.message || "Payment initialization failed" },
        { status: 400 },
      )
    }

    // Update payment record with Paystack reference
    await supabase
      .from("membership_payments")
      .update({ paystack_reference: paystackData.data.reference })
      .eq("id", payment.id)

    return NextResponse.json({
      success: true,
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference,
    })
  } catch (error) {
    console.error("Payment initialization error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
