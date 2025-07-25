import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, amount, phone, preferredTime, specialRequests } = body

    if (!email || !amount || !phone) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    // In a real implementation, you would initialize Paystack payment here
    // For demo purposes, we'll create a mock payment record
    const paymentReference = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Store payment initialization in database
    const { data: paymentData, error: paymentError } = await supabase
      .from("meet_greet_payments")
      .insert({
        user_id: user.id,
        email,
        phone,
        amount: amount / 100, // Convert from kobo to naira
        preferred_time: preferredTime || null,
        special_requests: specialRequests || null,
        payment_reference: paymentReference,
        status: "pending",
      })
      .select()
      .single()

    if (paymentError) {
      console.error("Payment creation error:", paymentError)
      return NextResponse.json({ success: false, message: "Failed to initialize payment" }, { status: 500 })
    }

    // In production, you would return Paystack authorization URL
    return NextResponse.json({
      success: true,
      data: {
        authorization_url: `https://checkout.paystack.com/mock/${paymentReference}`,
        access_code: `access_${paymentReference}`,
        reference: paymentReference,
      },
    })
  } catch (error) {
    console.error("Payment initialization error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
