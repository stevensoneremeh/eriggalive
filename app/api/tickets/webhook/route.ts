import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const secret = process.env.PAYSTACK_SECRET_KEY!

async function handleTicketPayment(body: any) {
  const event = body.event

  if (event !== "charge.success") {
    console.log(`Ignoring unhandled event: ${event}`)
    return
  }

  const reference = body.data?.reference
  const amountKobo = body.data?.amount
  const email = body.data?.customer?.email
  const status = body.data?.status

  if (!reference || !amountKobo || !email || status !== "success") {
    console.error("Missing required webhook data or payment not successful:", { reference, amountKobo, email, status })
    return
  }

  // Find the ticket payment record
  const { data: payment, error: paymentError } = await supabase
    .from("ticket_payments")
    .select(`
      *,
      events (
        id,
        title,
        ticket_price,
        tickets_sold,
        max_capacity
      )
    `)
    .eq("paystack_reference", reference)
    .single()

  if (paymentError || !payment) {
    console.error(`Ticket payment not found for reference: ${reference}`, paymentError)
    return
  }

  // Skip if already processed
  if (payment.status === "success") {
    console.log(`Ticket payment already processed: ${reference}`)
    return
  }

  // Verify amount matches
  if (Math.abs(amountKobo - payment.amount) > 100) {
    // Allow 1 NGN tolerance
    console.error(`Amount mismatch for ticket payment: expected ${payment.amount}, got ${amountKobo}`)
    return
  }

  try {
    // Update payment status
    const { error: updatePaymentError } = await supabase
      .from("ticket_payments")
      .update({
        status: "success",
        metadata: {
          ...payment.metadata,
          paystack_webhook_data: body.data,
          processed_at: new Date().toISOString(),
        },
      })
      .eq("id", payment.id)

    if (updatePaymentError) {
      console.error("Error updating ticket payment:", updatePaymentError)
      throw updatePaymentError
    }

    // If ticket doesn't exist yet, create it
    if (!payment.ticket_id) {
      // Generate ticket number and QR code
      const ticketNumber = `TKT${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`

      const qrCode = crypto
        .createHash("sha256")
        .update(
          JSON.stringify({
            eventId: payment.event_id,
            userId: payment.user_id,
            ticketId: ticketNumber,
            timestamp: Date.now(),
          }),
        )
        .digest("hex")

      // Create the ticket
      const { data: ticket, error: ticketError } = await supabase
        .from("tickets")
        .insert({
          event_id: payment.event_id,
          user_id: payment.user_id,
          ticket_number: ticketNumber,
          qr_code: qrCode,
          payment_method: "paystack",
          payment_reference: reference,
          amount_paid: payment.amount,
          status: "valid",
        })
        .select()
        .single()

      if (ticketError) {
        console.error("Error creating ticket:", ticketError)
        throw ticketError
      }

      // Update payment record with ticket ID
      await supabase.from("ticket_payments").update({ ticket_id: ticket.id }).eq("id", payment.id)

      // Update event tickets sold count
      await supabase
        .from("events")
        .update({
          tickets_sold: (payment.events?.tickets_sold || 0) + 1,
        })
        .eq("id", payment.event_id)

      console.log(`Successfully processed ticket webhook: ${reference} - Ticket ${ticket.ticket_number} created`)
    } else {
      console.log(`Ticket payment webhook processed: ${reference} - Ticket already exists`)
    }
  } catch (error) {
    console.error("Error processing ticket payment webhook:", error)

    // Mark payment as failed
    await supabase.from("ticket_payments").update({ status: "failed" }).eq("id", payment.id)

    throw error
  }
}

export async function POST(req: NextRequest) {
  const raw = await req.text()
  const signature = req.headers.get("x-paystack-signature") || ""

  if (!secret) {
    console.error("Paystack secret key not configured")
    return NextResponse.json({ error: "Configuration error" }, { status: 500 })
  }

  const hash = crypto.createHmac("sha512", secret).update(raw).digest("hex")

  if (hash !== signature) {
    console.error("Invalid webhook signature for ticket payment")
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  try {
    const parsedBody = JSON.parse(raw)
    await handleTicketPayment(parsedBody)
    return NextResponse.json({
      ok: true,
      message: "Ticket payment webhook processed successfully",
      event: parsedBody.event,
      reference: parsedBody.data?.reference,
    })
  } catch (e: any) {
    console.error("Ticket payment webhook processing error:", e)
    return NextResponse.json(
      {
        error: "Webhook processing failed",
        details: e.message,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Ticket payment webhook endpoint is active",
    timestamp: new Date().toISOString(),
  })
}
