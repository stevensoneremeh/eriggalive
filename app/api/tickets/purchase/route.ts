import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateSecureToken } from "@/lib/security/validation"
import { z } from "zod"

const FEATURE_UI_FIXES_V1 = process.env.NEXT_PUBLIC_FEATURE_UI_FIXES_V1 === "true"

const purchaseRequestSchema = z.object({
  eventId: z.string().uuid("Invalid event ID"),
  quantity: z.number().min(1, "Quantity must be at least 1").max(10, "Maximum 10 tickets per purchase"),
  paymentMethod: z.enum(["paystack", "coins", "free"], {
    required_error: "Payment method is required",
  }),
  paymentReference: z.string().optional(),
  amount: z.number().optional(),
  ticketType: z.string().optional(),
  surveyData: z.any().optional(),
})

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
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Authentication required", user: null, profile: null }
    }

    const { data: profile, error: profileError } = await supabase.from("users").select("*").eq("id", user.id).single()

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
  const random = Math.random().toString(36).substr(2, 9)

  const ticketNumber = `TKT-${timestamp}-${random}`.toUpperCase()

  if (FEATURE_UI_FIXES_V1) {
    // Use secure token generation
    const qrToken = generateSecureToken(userId, eventId, ticketNumber)
    const qrCode = `${process.env.NEXT_PUBLIC_BASE_URL || "https://eriggalive.com"}/api/tickets/validate?token=${qrToken}`
    return { ticketNumber, qrCode, qrToken }
  } else {
    // Legacy format
    const qrCode = `ERIGGA-${eventId.substr(0, 8)}-${userId.substr(0, 8)}-${timestamp}`
    const qrToken = qrCode
    return { ticketNumber, qrCode, qrToken }
  }
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
      "Cache-Control": "no-cache",
    },
  })

  if (!response.ok) {
    console.error(`Paystack API error: ${response.status} - ${response.statusText}`)
    throw new Error(`Paystack API error: ${response.status} - ${response.statusText}`)
  }

  return await response.json()
}

export async function POST(request: NextRequest) {
  if (FEATURE_UI_FIXES_V1 === false) {
    return NextResponse.json(
      {
        success: false,
        error: "Feature not enabled",
        code: "FEATURE_DISABLED",
      },
      { status: 405 },
    )
  }

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

    // Parse and validate request body
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

    // Validate request data
    const validationResult = purchaseRequestSchema.safeParse(requestData)

    if (!validationResult.success) {
      const formattedError = validationResult.error.format()
      console.error("Purchase validation error:", formattedError)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: formattedError,
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      )
    }

    const { eventId, quantity, paymentMethod, paymentReference, amount, ticketType, surveyData } = validationResult.data

    const supabase = createClient()

    const { data: event, error: eventError } = await supabase.from("events").select("*").eq("id", eventId).single()

    if (eventError || !event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 })
    }

    // Check event capacity
    if (event.current_attendance + quantity > event.max_capacity) {
      return NextResponse.json({ success: false, error: "Event is sold out" }, { status: 400 })
    }

    // Check membership requirements
    if (event.requires_membership && event.requires_membership !== "free") {
      const membershipTiers = ["free", "pro", "enterprise"]
      const requiredTierIndex = membershipTiers.indexOf(event.requires_membership)
      const userTierIndex = membershipTiers.indexOf(profile.membership_tier)

      if (userTierIndex < requiredTierIndex) {
        return NextResponse.json(
          { success: false, error: `This event requires ${event.requires_membership} membership` },
          { status: 403 },
        )
      }
    }

    let ticketPrice = 0
    let coinPrice = 0

    if (ticketType === "early_bird" && event.early_bird_ends && new Date() < new Date(event.early_bird_ends)) {
      ticketPrice = event.early_bird_price_naira || 0
      coinPrice = event.early_bird_price_coins || 0
    } else if (ticketType === "vip") {
      ticketPrice = event.vip_price_naira || 0
      coinPrice = event.vip_price_coins || 0
    } else {
      ticketPrice = event.ticket_price_naira || (FEATURE_UI_FIXES_V1 ? 20000 : 1000000)
      coinPrice = event.ticket_price_coins || (FEATURE_UI_FIXES_V1 ? 10000 : 1000000)
    }

    // Apply membership discount
    const discountPercentage =
      profile.membership_tier === "pro" ? 10 : profile.membership_tier === "enterprise" ? 20 : 0
    if (discountPercentage > 0) {
      ticketPrice = Math.floor(ticketPrice * (1 - discountPercentage / 100))
      coinPrice = Math.floor(coinPrice * (1 - discountPercentage / 100))
    }

    const totalPrice = ticketPrice * quantity
    const totalCoins = coinPrice * quantity

    if (paymentMethod === "paystack" && amount) {
      const expectedAmountKobo = totalPrice * 100
      const submittedAmountKobo = amount

      if (Math.abs(submittedAmountKobo - expectedAmountKobo) > 100) {
        // Allow 1 NGN tolerance
        return NextResponse.json(
          {
            success: false,
            error: "Price mismatch. Please refresh and try again.",
            details: { expected: expectedAmountKobo, submitted: submittedAmountKobo },
          },
          { status: 400 },
        )
      }
    }

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

        // Verify amount
        const expectedAmountKobo = Math.round(totalPrice * 100)
        if (Math.abs(paystackData.data.amount - expectedAmountKobo) > 100) {
          return NextResponse.json({ success: false, error: "Payment amount mismatch" }, { status: 400 })
        }
      } catch (error) {
        console.error("Payment verification error:", error)
        return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 500 })
      }
    } else if (paymentMethod === "coins") {
      if (profile.coins < totalCoins) {
        return NextResponse.json({ success: false, error: "Insufficient coins balance" }, { status: 400 })
      }

      // Deduct coins
      const { error: coinsError } = await supabase
        .from("users")
        .update({
          coins: profile.coins - totalCoins,
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

    // Create tickets
    const tickets = []
    for (let i = 0; i < quantity; i++) {
      const { ticketNumber, qrCode, qrToken } = generateTicketData(eventId, user.id)

      const { data: ticket, error: ticketError } = await supabase
        .from("tickets")
        .insert({
          event_id: eventId,
          user_id: user.id,
          ticket_type: ticketType || "general",
          ticket_number: ticketNumber,
          qr_code: qrCode,
          qr_token: qrToken,
          price_paid_naira: paymentMethod === "paystack" ? ticketPrice : null,
          price_paid_coins: paymentMethod === "coins" ? coinPrice : null,
          payment_method: paymentMethod,
          payment_reference: paymentReference,
          status: FEATURE_UI_FIXES_V1 ? "unused" : "valid", // Use 'unused' status for new tickets
          survey_data: surveyData,
          metadata: {
            discount_applied: discountPercentage,
            original_price_naira: event.ticket_price_naira,
            original_price_coins: event.ticket_price_coins,
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

    await supabase.from("transactions").insert({
      user_id: user.id,
      type: "purchase",
      category: "ticket",
      amount_naira: paymentMethod === "paystack" ? totalPrice : null,
      amount_coins: paymentMethod === "coins" ? totalCoins : null,
      payment_method: paymentMethod,
      paystack_reference: paymentReference,
      status: "completed",
      description: `Purchased ${quantity} ${ticketType || "general"} ticket(s) for ${event.title}`,
      reference_id: eventId,
      reference_type: "event",
      metadata: {
        ticket_ids: tickets.map((t) => t.id),
        event_title: event.title,
        ticket_type: ticketType || "general",
        quantity: quantity,
        reason: "purchase",
      },
    })

    return NextResponse.json({
      success: true,
      tickets: tickets.map((ticket) => ({
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        qr_code: ticket.qr_code,
        qr_token: ticket.qr_token,
        event_title: event.title,
        event_date: event.event_date,
        ticket_type: ticket.ticket_type,
        venue: event.venue,
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
