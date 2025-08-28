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
      .select("*")
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

// Generate unique ticket number and QR code
function generateTicketData(eventId: string, userId: string) {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)

  const ticketNumber = `TKT-${timestamp}-${random}`.toUpperCase()
  const qrCode = `ERIGGA-${eventId.substr(0, 8)}-${userId.substr(0, 8)}-${timestamp}`
  const qrToken = crypto
    .createHmac("sha256", process.env.NEXTAUTH_SECRET || "erigga-live-secret")
    .update(`${eventId}${userId}${timestamp}`)
    .digest("hex")

  return { ticketNumber, qrCode, qrToken }
}

// Mock Paystack verification for preview mode
async function mockPaystackVerification(reference: string, expectedAmount: number) {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return {
    status: true,
    data: {
      status: "success",
      amount: expectedAmount * 100,
      reference,
      paid_at: new Date().toISOString(),
      channel: "card",
      currency: "NGN",
      customer: { email: "user@example.com" },
    },
  }
}

// Real Paystack verification
async function verifyWithPaystack(reference: string, paystackSecretKey: string) {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Paystack API error: ${response.status}`)
  }

  return await response.json()
}

export async function POST(request: NextRequest) {
  try {
    const { user, profile, error: authError } = await verifyUser(request)
    if (authError || !user || !profile) {
      return NextResponse.json({ success: false, error: authError || "Unauthorized" }, { status: 401 })
    }

    const requestData = await request.json()
    const { eventId, ticketType, quantity = 1, paymentMethod, paymentReference, surveyData } = requestData

    if (!eventId || !ticketType || !paymentMethod) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    const EVENT_PRICING = {
      "erigga-intimate-session-2025": {
        ticket_price_naira: 20000,
        ticket_price_coins: 10000,
        max_capacity: 200,
      },
    }

    const eventConfig = EVENT_PRICING[eventId as keyof typeof EVENT_PRICING]
    if (!eventConfig) {
      return NextResponse.json({ success: false, error: "Invalid event" }, { status: 400 })
    }

    // Get event details
    const { data: event, error: eventError } = await supabase.from("events").select("*").eq("id", eventId).single()

    if (eventError || !event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 })
    }

    // Check event capacity
    if (event.current_attendance + quantity > eventConfig.max_capacity) {
      return NextResponse.json({ success: false, error: "Event is sold out" }, { status: 400 })
    }

    const ticketPrice = eventConfig.ticket_price_naira
    const coinPrice = eventConfig.ticket_price_coins

    const totalPrice = ticketPrice * quantity
    const totalCoins = coinPrice * quantity

    // Process payment based on method
    if (paymentMethod === "paystack") {
      if (!paymentReference) {
        return NextResponse.json({ success: false, error: "Payment reference required for Paystack" }, { status: 400 })
      }

      // Verify payment with Paystack
      let paystackData
      try {
        if (isPreviewMode()) {
          paystackData = await mockPaystackVerification(paymentReference, totalPrice)
        } else {
          const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
          if (!paystackSecretKey) {
            return NextResponse.json({ success: false, error: "Payment gateway not configured" }, { status: 500 })
          }
          paystackData = await verifyWithPaystack(paymentReference, paystackSecretKey)
        }

        if (!paystackData.status || paystackData.data.status !== "success") {
          return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 400 })
        }

        const expectedAmountKobo = Math.round(totalPrice * 100)
        if (Math.abs(paystackData.data.amount - expectedAmountKobo) > 100) {
          return NextResponse.json({ success: false, error: "Payment amount mismatch" }, { status: 400 })
        }
      } catch (error) {
        console.error("Payment verification error:", error)
        return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 500 })
      }
    } else if (paymentMethod === "coins") {
      if (profile.coins_balance < totalCoins) {
        return NextResponse.json({ success: false, error: "Insufficient coins balance" }, { status: 400 })
      }

      // Deduct coins
      const { error: coinsError } = await supabase
        .from("profiles")
        .update({
          coins_balance: profile.coins_balance - totalCoins,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (coinsError) {
        return NextResponse.json({ success: false, error: "Failed to deduct coins" }, { status: 500 })
      }
    } else if (paymentMethod === "free") {
      if (totalPrice > 0 || totalCoins > 0) {
        return NextResponse.json({ success: false, error: "This event is not free" }, { status: 400 })
      }
    }

    // Create tickets with enhanced QR generation
    const tickets = []
    for (let i = 0; i < quantity; i++) {
      const { ticketNumber, qrCode, qrToken } = generateTicketData(eventId, user.id)

      const { data: ticket, error: ticketError } = await supabase
        .from("tickets")
        .insert({
          event_id: eventId,
          user_id: user.id,
          ticket_type: ticketType,
          ticket_number: ticketNumber,
          qr_code: qrCode,
          qr_token: qrToken,
          price_paid_naira: paymentMethod === "paystack" ? ticketPrice : null,
          price_paid_coins: paymentMethod === "coins" ? coinPrice : null,
          payment_method: paymentMethod,
          payment_reference: paymentReference,
          status: "valid",
          metadata: {
            survey_data: surveyData,
            original_price_naira: 50000,
            discounted_price_naira: ticketPrice,
          },
        })
        .select()
        .single()

      if (ticketError) {
        console.error("Ticket creation error:", ticketError)
        return NextResponse.json({ success: false, error: "Failed to create ticket" }, { status: 500 })
      }

      tickets.push(ticket)
    }

    // Update event attendance
    await supabase
      .from("events")
      .update({
        current_attendance: event.current_attendance + quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId)

    // Create transaction record
    await supabase.from("transactions").insert({
      user_id: user.id,
      type: "purchase",
      category: "ticket",
      amount_naira: paymentMethod === "paystack" ? totalPrice : null,
      amount_coins: paymentMethod === "coins" ? totalCoins : null,
      payment_method: paymentMethod,
      paystack_reference: paymentReference,
      status: "completed",
      description: `Purchased ${quantity} ${ticketType} ticket(s) for ${event.title}`,
      reference_id: eventId,
      reference_type: "event",
      metadata: {
        ticket_ids: tickets.map((t) => t.id),
        event_title: event.title,
        ticket_type: ticketType,
        quantity: quantity,
      },
    })

    return NextResponse.json({
      success: true,
      tickets: tickets.map((ticket) => ({
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        qr_code: ticket.qr_code,
        event_title: "ERIGGA Live - Intimate Session",
        event_date: "2025-09-03T20:00:00",
        ticket_type: ticket.ticket_type,
        venue: "Uncle Jaffi at The Playground, Warri",
        status: ticket.status,
      })),
      message: `Successfully purchased ${quantity} ticket(s)`,
      totalPaid: paymentMethod === "paystack" ? totalPrice : totalCoins,
      paymentMethod,
    })
  } catch (error) {
    console.error("Ticket purchase error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ success: false, error: "Method not allowed" }, { status: 405 })
}
