import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-utils"

export async function POST(request: NextRequest) {
  try {
    const { email, amount, metadata } = await request.json()

    // Validate input
    if (!email || !amount || !metadata) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    // In a real implementation, you would initialize Paystack payment here
    // For demo purposes, we'll create a mock payment reference
    const reference = `mg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Store payment record in database
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("meet_greet_sessions")
      .insert({
        user_email: email,
        user_name: metadata.name,
        amount: amount / 100, // Convert from kobo to naira
        payment_reference: reference,
        status: "pending",
        session_duration: 20 * 60, // 20 minutes in seconds
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ success: false, message: "Failed to create session record" }, { status: 500 })
    }

    // Return success with payment URL (in real implementation, this would be Paystack URL)
    return NextResponse.json({
      success: true,
      data: {
        authorization_url: `https://checkout.paystack.com/mock/${reference}`,
        access_code: reference,
        reference: reference,
      },
    })
  } catch (error) {
    console.error("Payment initialization error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
