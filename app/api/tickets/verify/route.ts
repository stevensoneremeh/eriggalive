import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase-utils"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get("reference")

    if (!reference) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/events?error=missing_reference`)
    }

    // Verify payment with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    })

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok) {
      console.error("Paystack verification failed:", paystackData)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/events?error=verification_failed`)
    }

    const { data } = paystackData
    const expectedAmount = (Number(process.env.TICKET_FIXED_PRICE) || 20000) * 100

    if (data.status === "success" && data.amount === expectedAmount) {
      // Update payment status
      const { error: paymentError } = await supabase
        .from("payments")
        .update({
          status: "paid",
          external_reference: reference,
          processed_at: new Date().toISOString(),
          metadata: {
            paystack_data: data,
            verified_at: new Date().toISOString(),
          },
        })
        .eq("reference", reference)

      if (paymentError) {
        console.error("Failed to update payment:", paymentError)
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/events?error=update_failed`)
      }

      // Create ticket with QR code
      const ticketId = `ERIGGA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      const qrData = JSON.stringify({
        ticketId,
        eventId: data.metadata.event_id,
        userId: data.metadata.user_id,
        amount: data.amount / 100,
        timestamp: new Date().toISOString(),
      })

      const { error: ticketError } = await supabase.from("tickets").insert({
        id: ticketId,
        user_id: data.metadata.user_id,
        event_id: data.metadata.event_id,
        payment_id: reference,
        ticket_type: "premium",
        price: data.amount / 100,
        currency: "NGN",
        status: "unused",
        qr_code: qrData,
        metadata: {
          survey_data: data.metadata.survey_data,
          payment_reference: reference,
        },
      })

      if (ticketError) {
        console.error("Failed to create ticket:", ticketError)
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/events?error=ticket_creation_failed`)
      }

      // Redirect to tickets page
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/tickets?success=ticket_purchased&ticketId=${ticketId}`,
      )
    } else {
      // Mark payment as failed
      await supabase
        .from("payments")
        .update({
          status: "failed",
          metadata: {
            paystack_data: data,
            failure_reason: "Payment verification failed",
          },
        })
        .eq("reference", reference)

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/events?error=payment_failed`)
    }
  } catch (error) {
    console.error("Ticket verification error:", error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/events?error=server_error`)
  }
}
