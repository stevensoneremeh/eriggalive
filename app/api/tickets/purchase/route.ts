import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import crypto from "crypto"

const purchaseSchema = z.object({
  event_id: z.number(),
  method: z.enum(["paystack", "coin"]),
  payment_reference: z.string().optional(),
})

// Generate secure QR token
function generateQRToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

// Hash QR token for storage
function hashQRToken(token: string): string {
  const secret = process.env.QR_SIGNING_SECRET || "default-secret-change-in-production"
  return crypto.createHmac("sha256", secret).update(token).digest("hex")
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { event_id, method, payment_reference } = purchaseSchema.parse(body)

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", event_id)
      .eq("status", "active")
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found or not available" }, { status: 404 })
    }

    // Check capacity
    if (event.current_reservations >= event.max_capacity) {
      return NextResponse.json({ error: "Event is sold out" }, { status: 400 })
    }

    // Check if user already has a ticket for this event
    const { data: existingTicket } = await supabase
      .from("tickets")
      .select("id")
      .eq("event_id", event_id)
      .eq("user_id", user.id)
      .eq("status", "unused")
      .single()

    if (existingTicket) {
      return NextResponse.json({ error: "You already have a ticket for this event" }, { status: 400 })
    }

    let paymentId = null

    // Handle payment processing
    if (method === "paystack") {
      if (!payment_reference) {
        return NextResponse.json({ error: "Payment reference required for Paystack payments" }, { status: 400 })
      }

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          user_id: user.id,
          context: "ticket",
          context_id: event_id.toString(),
          provider: "paystack",
          provider_ref: payment_reference,
          amount_ngn: event.ticket_price,
          status: "paid", // Assume verified by frontend
        })
        .select()
        .single()

      if (paymentError) {
        console.error("Payment creation error:", paymentError)
        return NextResponse.json({ error: "Failed to process payment" }, { status: 500 })
      }

      paymentId = payment.id
    } else if (method === "coin") {
      // Debit coins from wallet
      const coinAmount = event.ticket_price * 2 // 1 NGN = 2 coins

      const { error: debitError } = await supabase.rpc("update_wallet_balance", {
        p_user_id: user.id,
        p_amount_coins: coinAmount,
        p_type: "debit",
        p_reason: "ticket_purchase",
        p_ref_id: event_id.toString(),
      })

      if (debitError) {
        console.error("Wallet debit error:", debitError)
        return NextResponse.json(
          {
            error: debitError.message.includes("Insufficient balance") ? "Insufficient coins" : "Payment failed",
          },
          { status: 400 },
        )
      }

      // Create payment record for coins
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          user_id: user.id,
          context: "ticket",
          context_id: event_id.toString(),
          provider: "coin",
          amount_ngn: event.ticket_price,
          status: "paid",
        })
        .select()
        .single()

      if (paymentError) {
        console.error("Payment creation error:", paymentError)
        return NextResponse.json({ error: "Failed to process payment" }, { status: 500 })
      }

      paymentId = payment.id
    }

    // Generate secure QR token
    const qrToken = generateQRToken()
    const qrTokenHash = hashQRToken(qrToken)
    const qrExpiresAt = new Date()
    qrExpiresAt.setHours(qrExpiresAt.getHours() + 24) // QR expires in 24 hours

    // Create ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        event_id,
        user_id: user.id,
        purchase_id: paymentId,
        qr_token_hash: qrTokenHash,
        qr_expires_at: qrExpiresAt.toISOString(),
        status: "unused",
      })
      .select(`
        *,
        events!inner(title, venue, event_date)
      `)
      .single()

    if (ticketError) {
      console.error("Ticket creation error:", ticketError)
      return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 })
    }

    // Update event capacity
    await supabase
      .from("events")
      .update({
        current_reservations: event.current_reservations + 1,
      })
      .eq("id", event_id)

    return NextResponse.json({
      success: true,
      ticket: {
        ...ticket,
        qr_token: qrToken, // Return raw token for QR generation
      },
    })
  } catch (error) {
    console.error("Ticket purchase error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
