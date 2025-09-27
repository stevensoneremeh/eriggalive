import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reference } = body

    if (!reference) {
      return NextResponse.json({ error: "Payment reference is required" }, { status: 400 })
    }

    const supabase = createClient()

    // Verify payment exists and is completed
    const { data: payment, error: paymentError } = await supabase
      .from('meetgreet_payments')
      .select(`
        *,
        users:user_id (
          full_name,
          email,
          username
        ),
        admin_user:admin_user_id (
          full_name,
          email,
          username
        )
      `)
      .eq('payment_reference', reference)
      .eq('payment_status', 'completed')
      .gte('expires_at', new Date().toISOString())
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ 
        error: "Invalid or expired payment",
        valid: false 
      }, { status: 404 })
    }

    // Ensure admin is assigned to the session
    if (!payment.admin_user_id) {
      const { error: updateError } = await supabase
        .from('meetgreet_payments')
        .update({ 
          admin_user_id: 1, // Super admin ID
          requires_admin_approval: true 
        })
        .eq('id', payment.id)

      if (updateError) {
        console.error('Error assigning admin to session:', updateError)
      }
    }

    return NextResponse.json({
      valid: true,
      payment: {
        id: payment.id,
        reference: payment.payment_reference,
        amount: payment.amount,
        currency: payment.currency,
        sessionRoomId: payment.session_room_id,
        adminSessionRoomId: payment.admin_session_room_id,
        sessionStatus: payment.session_status,
        expiresAt: payment.expires_at,
        requiresAdminApproval: payment.requires_admin_approval,
        userInfo: payment.users,
        adminInfo: payment.admin_user
      }
    })

  } catch (error: any) {
    console.error("Payment verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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