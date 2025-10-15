import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

export const dynamic = "force-dynamic"

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

function generateTicketData(eventId: string, userId: string) {
  const timestamp = Date.now()
  const random = crypto.randomBytes(4).toString("hex").toUpperCase()

  const ticketNumber = `ELT-${timestamp.toString().slice(-8)}-${random}`

  // Create a more secure QR code with multiple verification layers
  const qrData = {
    event: eventId,
    user: userId.slice(0, 8),
    timestamp,
    ticket: ticketNumber,
  }

  const qrString = JSON.stringify(qrData)
  const qrCode = Buffer.from(qrString).toString("base64")

  // Generate secure verification token
  const qrToken = crypto
    .createHmac("sha256", process.env.NEXTAUTH_SECRET || "erigga-live-secret-2025")
    .update(`${eventId}${userId}${timestamp}${ticketNumber}`)
    .digest("hex")

  return { ticketNumber, qrCode, qrToken, qrData }
}

// Mock Paystack verification for preview mode
async function mockPaystackVerification(reference: string, expectedAmount: number) {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return {
    status: true,
    data: {
      status: "success",
      amount: expectedAmount,
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
    const { eventId, ticketType = "general", quantity = 1, paymentMethod, paymentReference } = requestData

    if (!eventId || !paymentMethod) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get event details - for now use hardcoded values for the intimate session
    const eventData = {
      id: eventId,
      title: "ERIGGA Live - Intimate Session",
      event_date: "2025-09-03T20:00:00",
      venue: "Uncle Jaffi at The Playground",
      city: "Warri, Nigeria",
      max_capacity: 200,
      current_attendance: 45,
      ticket_price_naira: 20000, // Updated to correct price
      ticket_price_coins: 10000, // Updated to correct coin price
      status: "upcoming",
    }

    // Check event capacity
    if (eventData.current_attendance + quantity > eventData.max_capacity) {
      return NextResponse.json({ success: false, error: "Event is sold out" }, { status: 400 })
    }

    // Calculate price
    const ticketPrice = eventData.ticket_price_naira
    const coinPrice = eventData.ticket_price_coins
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
          paystackData = await mockPaystackVerification(paymentReference, totalPrice * 100) // Convert to kobo
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

        // Verify amount (Paystack returns amount in kobo)
        const expectedAmountKobo = totalPrice * 100
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
        console.error("Coins deduction error:", coinsError) // Added error logging
        return NextResponse.json({ success: false, error: "Failed to deduct coins" }, { status: 500 })
      }
    }

    // Create tickets with enhanced QR codes
    const tickets = []
    for (let i = 0; i < quantity; i++) {
      const { ticketNumber, qrCode, qrToken, qrData } = generateTicketData(eventId, user.id)

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
            qr_data: qrData,
            event_title: eventData.title,
            venue: eventData.venue,
            event_date: eventData.event_date,
            generated_at: new Date().toISOString(),
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
      description: `Purchased ${quantity} ${ticketType} ticket(s) for ${eventData.title}`,
      reference_id: eventId,
      reference_type: "event",
      metadata: {
        ticket_ids: tickets.map((t) => t.id),
        event_title: eventData.title,
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
        event_title: eventData.title,
        event_date: eventData.event_date,
        ticket_type: ticket.ticket_type,
        venue: eventData.venue,
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

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  return NextResponse.json({ success: false, error: "Method not allowed" }, { status: 405 })
}
