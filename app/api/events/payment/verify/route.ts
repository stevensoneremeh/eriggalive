import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

export const dynamic = "force-dynamic"

function generateQRCode(ticketId: string, eventId: string, userId: string, amount: number): { qrCode: string; qrToken: string } {
  const timestamp = Date.now()

  const qrData = {
    ticket: ticketId,
    event: eventId,
    user: userId.slice(0, 8),
    amount,
    timestamp,
  }

  const qrString = JSON.stringify(qrData)
  const qrCode = Buffer.from(qrString).toString("base64")

  const qrToken = crypto
    .createHmac("sha256", process.env.NEXTAUTH_SECRET || "erigga-live-secret-2025")
    .update(`${ticketId}${eventId}${userId}${timestamp}`)
    .digest("hex")

  return { qrCode, qrToken }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get("reference")
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

    if (!reference) {
      return NextResponse.redirect(
        `${baseUrl}/events?error=missing_reference`
      )
    }

    const supabase = await createClient()

    const { data: payment, error: paymentError } = await supabase
      .from("event_payments")
      .select("*, events(*)")
      .eq("paystack_reference", reference)
      .single()

    if (paymentError || !payment) {
      console.error("Payment not found:", paymentError)
      return NextResponse.redirect(
        `${baseUrl}/events?error=payment_not_found`
      )
    }

    if (payment.status === "paid") {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/events?success=already_processed`
      )
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
      return NextResponse.redirect(
        `${baseUrl}/events?error=config_error`
      )
    }

    // Get user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.redirect(`${baseUrl}/events?error=unauthorized`)
    }

    // Ensure profile exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (!profile) {
      // Create profile if it doesn't exist
      await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          username: user.email?.split('@')[0] || 'user',
          full_name: user.user_metadata?.full_name || '',
          coins_balance: 0,
          tier: 'free'
        })
    }

    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      }
    )

    const verifyData = await verifyResponse.json()

    if (!verifyResponse.ok || !verifyData.status) {
      console.error("Paystack verification failed:", verifyData)

      await supabase
        .from("event_payments")
        .update({ status: "failed" })
        .eq("paystack_reference", reference)

      return NextResponse.redirect(
        `${baseUrl}/events?error=verification_failed`
      )
    }

    const transactionData = verifyData.data

    if (transactionData.status !== "success") {
      await supabase
        .from("event_payments")
        .update({ status: "failed" })
        .eq("paystack_reference", reference)

      return NextResponse.redirect(
        `${baseUrl}/events?error=payment_failed`
      )
    }

    const expectedAmount = payment.amount * 100
    const paidAmount = transactionData.amount

    if (paidAmount < expectedAmount) {
      console.error("Amount mismatch:", { expected: expectedAmount, paid: paidAmount })

      await supabase
        .from("event_payments")
        .update({ status: "failed" })
        .eq("paystack_reference", reference)

      return NextResponse.redirect(
        `${baseUrl}/events?error=amount_mismatch`
      )
    }

    const ticketNumber = `ELT-${Date.now().toString().slice(-8)}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`

    const ticketId = crypto.randomUUID()
    const { qrCode, qrToken } = generateQRCode(
      ticketId,
      payment.event_id,
      payment.user_id,
      payment.amount
    )

    const { error: ticketError } = await supabase
      .from("tickets")
      .insert({
        id: ticketId,
        event_id: payment.event_id,
        user_id: payment.user_id,
        ticket_type: payment.custom_amount ? "vip" : "regular",
        ticket_number: ticketNumber,
        qr_code: qrCode,
        qr_token: qrToken,
        price_paid_naira: payment.amount,
        custom_amount: payment.custom_amount ? payment.amount : null,
        payment_method: "paystack",
        payment_reference: reference,
        status: "valid",
        admission_status: "pending",
        metadata: {
          transaction_id: transactionData.id,
          paid_at: transactionData.paid_at,
          channel: transactionData.channel,
        },
      })

    if (ticketError) {
      console.error("Failed to create ticket:", ticketError)
      return NextResponse.redirect(
        `${baseUrl}/events?error=ticket_creation_failed`
      )
    }

    const { error: updatePaymentError } = await supabase
      .from("event_payments")
      .update({
        status: "paid",
        ticket_id: ticketId,
        paid_at: new Date().toISOString(),
        metadata: {
          ...payment.metadata,
          transaction_data: transactionData,
        },
      })
      .eq("paystack_reference", reference)

    if (updatePaymentError) {
      console.error("Failed to update payment:", updatePaymentError)
    }

    const { error: seatingError } = await supabase.rpc("assign_seating", {
      p_ticket_id: ticketId,
    })

    if (seatingError) {
      console.error("Failed to assign seating:", seatingError)
    }

    return NextResponse.redirect(
      `${baseUrl}/dashboard/events?success=payment_complete&ticket=${ticketId}`
    )

  } catch (error) {
    console.error("Payment verification error:", error)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    return NextResponse.redirect(
      `${baseUrl}/events?error=server_error`
    )
  }
}