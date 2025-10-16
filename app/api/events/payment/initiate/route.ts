import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

export const dynamic = "force-dynamic"

interface PaymentInitiateRequest {
  eventId: string
  amount: number
  isCustomAmount: boolean
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    if (!user.email) {
      return NextResponse.json({ success: false, error: "User email is required" }, { status: 400 })
    }

    // Get or create user profile
    let { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, auth_user_id, username, full_name, email, coins, tier")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError && profileError.code === "PGRST116") {
      // User doesn't exist, create them
      const { data: newProfile, error: createError } = await supabase
        .from("users")
        .insert({
          auth_user_id: user.id,
          email: user.email,
          username: user.email?.split('@')[0] || 'user',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          coins: 0,
          tier: 'erigga_citizen'
        })
        .select("id, auth_user_id, username, full_name, email, coins, tier")
        .single()

      if (createError) {
        console.error("Failed to create user profile:", createError)
        return NextResponse.json({ success: false, error: "Failed to create user profile" }, { status: 500 })
      }
      profile = newProfile
    } else if (profileError) {
      console.error("Profile error:", profileError)
      return NextResponse.json({ success: false, error: "Failed to manage user profile" }, { status: 500 })
    }

    const body: PaymentInitiateRequest = await request.json()
    const { eventId, amount, isCustomAmount } = body

    if (!eventId || !amount) {
      return NextResponse.json(
        { success: false, error: "Event ID and amount are required" },
        { status: 400 }
      )
    }

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      )
    }

    if (isCustomAmount && event.min_custom_amount && amount < event.min_custom_amount) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum amount is ₦${event.min_custom_amount.toLocaleString()}`
        },
        { status: 400 }
      )
    }

    if (!isCustomAmount && amount !== event.ticket_price_naira) {
      return NextResponse.json(
        { success: false, error: "Invalid ticket price" },
        { status: 400 }
      )
    }

    const reference = `EL-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`
    const amountInKobo = Math.round(amount * 100)

    const { error: paymentError } = await supabase
      .from("event_payments")
      .insert({
        user_id: user.id,
        event_id: eventId,
        amount: amount,
        custom_amount: isCustomAmount,
        payment_method: "paystack",
        paystack_reference: reference,
        status: "pending",
        metadata: {
          user_email: user.email,
          user_name: profile.full_name || user.email,
          event_title: event.title,
        },
      })

    if (paymentError) {
      console.error("Failed to create payment record:", paymentError)
      return NextResponse.json(
        { success: false, error: "Failed to create payment record" },
        { status: 500 }
      )
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
      return NextResponse.json(
        { success: false, error: "Payment gateway not configured" },
        { status: 500 }
      )
    }

    const paystackPayload = {
      email: user.email,
      amount: amountInKobo,
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/events/payment/verify`,
      metadata: {
        user_id: user.id,
        event_id: eventId,
        event_title: event.title,
        custom_amount: isCustomAmount,
        full_name: profile.full_name || user.email,
      },
    }

    // Add timeout to Paystack request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000) // 25 second timeout

    try {
      const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paystackPayload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!paystackResponse.ok) {
        const errorText = await paystackResponse.text()
        console.error("Paystack HTTP error:", paystackResponse.status, errorText)
        
        await supabase
          .from("event_payments")
          .update({ status: "failed" })
          .eq("paystack_reference", reference)

        return NextResponse.json(
          { success: false, error: `Payment service error: ${paystackResponse.status}` },
          { status: 500 }
        )
      }

      const paystackData = await paystackResponse.json()

      if (!paystackData.status) {
        console.error("Paystack initialization failed:", paystackData)

        await supabase
          .from("event_payments")
          .update({ status: "failed" })
          .eq("paystack_reference", reference)

        return NextResponse.json(
          { success: false, error: paystackData.message || "Payment initialization failed" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
        reference,
      })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        console.error("Paystack request timeout")
        return NextResponse.json(
          { success: false, error: "Payment service timeout. Please try again." },
          { status: 504 }
        )
      }
      throw fetchError
    }

  } catch (error: any) {
    console.error("Payment initiation error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}