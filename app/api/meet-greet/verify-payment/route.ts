import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json()

    if (!reference) {
      return NextResponse.json(
        { success: false, message: "Payment reference is required" },
        { status: 400 }
      )
    }

    // Verify payment with Paystack
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
      return NextResponse.json(
        { success: false, message: "Payment system configuration error" },
        { status: 500 }
      )
    }

    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
      }
    )

    if (!verifyResponse.ok) {
      throw new Error("Failed to verify payment with Paystack")
    }

    const paymentData = await verifyResponse.json()

    if (!paymentData.status || paymentData.data.status !== "success") {
      return NextResponse.json(
        { success: false, message: "Payment verification failed" },
        { status: 400 }
      )
    }

    // Store payment record in Supabase
    const supabase = await createClient()
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "User not authenticated" },
        { status: 401 }
      )
    }

    // Insert payment record
    const { error: insertError } = await supabase
      .from("meetgreet_payments")
      .insert({
        user_id: session.user.id,
        payment_reference: reference,
        amount: paymentData.data.amount / 100, // Convert from kobo to naira
        currency: paymentData.data.currency,
        payment_status: "completed",
        paystack_data: paymentData.data,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      })

    if (insertError) {
      console.error("Database insert error:", insertError)
      return NextResponse.json(
        { success: false, message: "Failed to record payment" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      reference: reference,
      amount: paymentData.data.amount / 100,
    })

  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Payment verification failed"
      },
      { status: 500 }
    )
  }
}

// Webhook endpoint for Paystack notifications
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-paystack-signature")

    if (!signature) {
      return NextResponse.json(
        { success: false, message: "No signature provided" },
        { status: 400 }
      )
    }

    // Verify webhook signature
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
      return NextResponse.json(
        { success: false, message: "Webhook configuration error" },
        { status: 500 }
      )
    }

    const hash = crypto
      .createHmac("sha512", paystackSecretKey)
      .update(body)
      .digest("hex")

    if (hash !== signature) {
      return NextResponse.json(
        { success: false, message: "Invalid signature" },
        { status: 400 }
      )
    }

    const event = JSON.parse(body)

    if (event.event === "charge.success") {
      // Handle successful payment webhook
      const reference = event.data.reference
      
      const supabase = await createClient()
      
      // Update payment status in database
      const { error } = await supabase
        .from("meetgreet_payments")
        .update({
          payment_status: "completed",
          webhook_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq("payment_reference", reference)

      if (error) {
        console.error("Webhook update error:", error)
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { success: false, message: "Webhook processing failed" },
      { status: 500 }
    )
  }
}