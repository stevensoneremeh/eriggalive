import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { email, amount, callback_url } = await request.json()
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Generate transaction reference
    const transactionRef = `mg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create session record
    const { data: session, error: sessionError } = await supabase
      .from("meet_greet_sessions")
      .insert({
        user_id: user.id,
        user_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        user_email: email,
        amount: amount / 100, // Convert from kobo to naira
        transaction_reference: transactionRef,
        payment_status: "pending",
        session_status: "scheduled",
      })
      .select()
      .single()

    if (sessionError) {
      console.error("Session creation error:", sessionError)
      return NextResponse.json({ success: false, error: "Failed to create session" }, { status: 500 })
    }

    // Initialize Paystack payment
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount,
        reference: transactionRef,
        callback_url: `${callback_url}?transaction_reference=${transactionRef}`,
        metadata: {
          session_id: session.id,
          user_id: user.id,
          service: "meet_greet",
        },
      }),
    })

    const paystackData = await paystackResponse.json()

    if (paystackData.status) {
      return NextResponse.json({
        success: true,
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
        reference: transactionRef,
      })
    } else {
      return NextResponse.json({ success: false, error: "Payment initialization failed" }, { status: 500 })
    }
  } catch (error) {
    console.error("Payment initialization error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
