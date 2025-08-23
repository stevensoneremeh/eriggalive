import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

// Check if we're in preview/development mode
const isPreviewMode = () => {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.VERCEL_ENV === "preview" ||
    !process.env.PAYSTACK_SECRET_KEY ||
    process.env.PAYSTACK_SECRET_KEY.startsWith("pk_test_")
  )
}

async function verifyUser(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Authentication required", user: null, profile: null }
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return { error: "User profile not found", user: null, profile: null }
    }

    return { user, profile, error: null }
  } catch (error) {
    console.error("Authentication error:", error)
    return { error: "Authentication failed", user: null, profile: null }
  }
}

// Generate encrypted QR code data
function generateQRCode(eventId: string, userId: string, ticketId: string): string {
  const data = JSON.stringify({
    eventId,
    userId,
    ticketId,
    timestamp: Date.now(),
  })
  return crypto.createHash("sha256").update(data).digest("hex")
}

// Mock Paystack verification for preview mode
async function mockPaystackVerification(reference: string, expectedAmount: number) {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return {
    status: true,
    data: {
      status: "success",
      amount: expectedAmount * 100, // Convert to kobo
      reference,
      paid_at: new Date().toISOString(),
      channel: "card",
      currency: "NGN",
      customer: {
        email: "user@example.com",
      },
    },
  }
}

// Real Paystack verification for production
async function verifyWithPaystack(reference: string, paystackSecretKey: string) {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Paystack API error: ${response.status} - ${response.statusText}`)
  }

  return await response.json()
}

export async function POST(request: NextRequest) {
  try {
    const { user, profile, error: authError } = await verifyUser(request)
    if (authError || !user || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: authError || "Unauthorized",
          code: "AUTH_ERROR",
        },
        { status: 401 },
      )
    }

    let requestData
    try {
      requestData = await request.json()
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
          code: "INVALID_JSON",
        },
        { status: 400 },
      )
    }

    const { eventId, paymentMethod, reference, amount } = requestData

    if (!eventId || !paymentMethod || (!reference && paymentMethod === "paystack")) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .eq("status", "upcoming")
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        {
          success: false,
          error: "Event not found or not available for purchase",
          code: "EVENT_NOT_FOUND",
        },
        { status: 404 },
      )
    }

    // Check if event is sold out
    if (event.tickets_sold >= event.max_capacity) {
      return NextResponse.json(
        {
          success: false,
          error: "Event is sold out",
          code: "SOLD_OUT",
        },
        { status: 400 },
      )
    }

    // Check if user already has a ticket for this event
    const { data: existingTicket } = await supabase
      .from("tickets")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single()

    if (existingTicket) {
      return NextResponse.json(
        {
          success: false,
          error: "You already have a ticket for this event",
          code: "DUPLICATE_TICKET",
        },
        { status: 400 },
      )
    }

    // Handle coin payment
    if (paymentMethod === "coins") {
      if (!event.coin_price) {
        return NextResponse.json(
          {
            success: false,
            error: "Coin payment not available for this event",
            code: "COINS_NOT_ACCEPTED",
          },
          { status: 400 },
        )
      }

      try {
        // Use the database function to purchase with coins
        const { data: ticketId, error: purchaseError } = await supabase.rpc("purchase_ticket_with_coins", {
          p_event_id: eventId,
          p_user_id: user.id,
          p_coin_amount: event.coin_price,
        })

        if (purchaseError) {
          return NextResponse.json(
            {
              success: false,
              error: purchaseError.message,
              code: "COIN_PURCHASE_FAILED",
            },
            { status: 400 },
          )
        }

        // Get the created ticket
        const { data: ticket, error: ticketError } = await supabase
          .from("tickets")
          .select("*")
          .eq("id", ticketId)
          .single()

        if (ticketError || !ticket) {
          return NextResponse.json(
            {
              success: false,
              error: "Failed to retrieve ticket",
              code: "TICKET_RETRIEVAL_ERROR",
            },
            { status: 500 },
          )
        }

        return NextResponse.json({
          success: true,
          ticket: {
            id: ticket.id,
            ticket_number: ticket.ticket_number,
            qr_code: ticket.qr_code,
            event_id: ticket.event_id,
            payment_method: ticket.payment_method,
            amount_paid: ticket.amount_paid,
            status: ticket.status,
            purchased_at: ticket.purchased_at,
          },
          event: {
            title: event.title,
            event_date: event.event_date,
            venue: event.venue,
          },
          message: `Ticket purchased successfully with ${event.coin_price} Erigga Coins`,
        })
      } catch (error) {
        console.error("Coin purchase error:", error)
        return NextResponse.json(
          {
            success: false,
            error: "Failed to process coin payment",
            code: "COIN_PAYMENT_ERROR",
          },
          { status: 500 },
        )
      }
    }

    // Handle Paystack payment
    if (paymentMethod === "paystack") {
      // Verify the amount matches event price
      const expectedAmount = Math.floor(event.ticket_price / 100) // Convert from kobo to naira
      if (Math.abs(amount - expectedAmount) > 1) {
        return NextResponse.json(
          {
            success: false,
            error: "Amount doesn't match ticket price",
            code: "AMOUNT_MISMATCH",
          },
          { status: 400 },
        )
      }

      // Check for duplicate payment reference
      const { data: existingPayment } = await supabase
        .from("ticket_payments")
        .select("id")
        .eq("paystack_reference", reference)
        .single()

      if (existingPayment) {
        return NextResponse.json(
          {
            success: false,
            error: "Payment reference already exists",
            code: "DUPLICATE_REFERENCE",
          },
          { status: 400 },
        )
      }

      // Verify transaction with Paystack
      let paystackData
      try {
        if (isPreviewMode()) {
          console.log("Using mock Paystack verification for preview mode")
          paystackData = await mockPaystackVerification(reference, amount)
        } else {
          const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
          if (!paystackSecretKey) {
            return NextResponse.json(
              {
                success: false,
                error: "Payment gateway configuration error",
                code: "CONFIG_ERROR",
              },
              { status: 500 },
            )
          }

          paystackData = await verifyWithPaystack(reference, paystackSecretKey)
        }

        if (!paystackData.status || paystackData.data.status !== "success") {
          return NextResponse.json(
            {
              success: false,
              error: "Payment verification failed",
              code: "PAYMENT_FAILED",
            },
            { status: 400 },
          )
        }

        // Verify amount matches
        const expectedAmountKobo = Math.round(amount * 100)
        const actualAmount = paystackData.data.amount

        if (Math.abs(actualAmount - expectedAmountKobo) > 100) {
          return NextResponse.json(
            {
              success: false,
              error: "Payment amount mismatch",
              code: "AMOUNT_MISMATCH",
            },
            { status: 400 },
          )
        }
      } catch (error) {
        console.error("Payment verification error:", error)
        return NextResponse.json(
          {
            success: false,
            error: "Payment verification failed",
            code: "VERIFICATION_ERROR",
          },
          { status: 500 },
        )
      }

      // Create ticket payment record
      const { data: payment, error: paymentError } = await supabase
        .from("ticket_payments")
        .insert({
          user_id: user.id,
          event_id: eventId,
          payment_method: "paystack",
          amount: event.ticket_price, // Store in kobo
          currency: "NGN",
          paystack_reference: reference,
          status: "success",
          metadata: {
            paystack_data: paystackData.data,
            is_preview_mode: isPreviewMode(),
          },
        })
        .select()
        .single()

      if (paymentError) {
        console.error("Payment record creation error:", paymentError)
        return NextResponse.json(
          {
            success: false,
            error: "Failed to create payment record",
            code: "PAYMENT_RECORD_ERROR",
          },
          { status: 500 },
        )
      }

      // Generate ticket number and QR code
      const ticketNumber = `TKT${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`

      // Create ticket
      const { data: ticket, error: ticketError } = await supabase
        .from("tickets")
        .insert({
          event_id: eventId,
          user_id: user.id,
          ticket_number: ticketNumber,
          qr_code: generateQRCode(eventId, user.id, ticketNumber),
          payment_method: "paystack",
          payment_reference: reference,
          amount_paid: event.ticket_price,
          status: "valid",
        })
        .select()
        .single()

      if (ticketError) {
        console.error("Ticket creation error:", ticketError)
        return NextResponse.json(
          {
            success: false,
            error: "Failed to create ticket",
            code: "TICKET_CREATION_ERROR",
          },
          { status: 500 },
        )
      }

      // Update payment record with ticket ID
      await supabase.from("ticket_payments").update({ ticket_id: ticket.id }).eq("id", payment.id)

      // Update event tickets sold count
      await supabase
        .from("events")
        .update({ tickets_sold: event.tickets_sold + 1 })
        .eq("id", eventId)

      return NextResponse.json({
        success: true,
        ticket: {
          id: ticket.id,
          ticket_number: ticket.ticket_number,
          qr_code: ticket.qr_code,
          event_id: ticket.event_id,
          payment_method: ticket.payment_method,
          amount_paid: Math.floor(ticket.amount_paid / 100), // Convert to naira for display
          status: ticket.status,
          purchased_at: ticket.purchased_at,
        },
        event: {
          title: event.title,
          event_date: event.event_date,
          venue: event.venue,
        },
        payment: {
          id: payment.id,
          reference: payment.paystack_reference,
          amount: Math.floor(payment.amount / 100), // Convert to naira for display
        },
        message: `Ticket purchased successfully for ₦${Math.floor(event.ticket_price / 100)}`,
        isPreviewMode: isPreviewMode(),
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid payment method",
        code: "INVALID_PAYMENT_METHOD",
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("Ticket purchase API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    },
    { status: 405 },
  )
}
