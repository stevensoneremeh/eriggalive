import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { booking_date, user_name, notes, amount } = body

    // Create Paystack payment initialization
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
      body: JSON.stringify({
        email: user.email,
        amount: amount * 100, // Convert to kobo
        metadata: {
          user_id: user.id,
          booking_date,
          user_name,
          type: "meet_and_greet",
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/meet-and-greet/confirm`,
      }),
    })

    if (!paystackResponse.ok) {
      throw new Error("Payment initialization failed")
    }

    const paystackData = await paystackResponse.json()

    // Create booking record
    const { data: booking, error } = await supabase
      .from("meet_greet_bookings")
      .insert([
        {
          user_id: user.id,
          user_email: user.email || "",
          user_name,
          booking_date,
          payment_amount: amount,
          payment_reference: paystackData.data.reference,
          notes,
          status: "pending",
          payment_status: "pending",
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      booking,
      payment_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    })
  } catch (error: any) {
    console.error("Booking error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
