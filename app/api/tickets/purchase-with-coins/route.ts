import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

const EVENT_PRICING = {
  "erigga-intimate-session-2025": {
    ticket_price_naira: 20000,
    ticket_price_coins: 10000,
    max_capacity: 200,
  },
}

function generateSecureQRData(eventId: string, userId: string, ticketNumber: string) {
  const timestamp = Date.now()
  const secret = process.env.NEXTAUTH_SECRET || "erigga-live-secret-key"

  // Generate QR code in format: ERIGGA-{eventId}-{userId}-{timestamp}
  const qrCode = `ERIGGA-${eventId.substr(0, 8)}-${userId.substr(0, 8)}-${timestamp}`

  // Generate cryptographically secure token
  const qrToken = crypto
    .createHmac("sha256", secret)
    .update(`${eventId}${userId}${ticketNumber}${timestamp}`)
    .digest("hex")

  // Generate hashed token for database storage
  const hashedToken = crypto.createHash("sha256").update(qrToken).digest("hex")

  return { qrCode, qrToken, hashedToken }
}

export async function POST(request: NextRequest) {
  try {
    const { eventId, userId, coinAmount, surveyData } = await request.json()

    const eventConfig = EVENT_PRICING[eventId as keyof typeof EVENT_PRICING]
    if (!eventConfig) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 })
    }

    if (coinAmount !== eventConfig.ticket_price_coins) {
      return NextResponse.json(
        {
          error: `Invalid price. Expected ${eventConfig.ticket_price_coins} coins`,
        },
        { status: 400 },
      )
    }

    const supabase = createClient()

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check user's coin balance from wallet context
    const { data: wallet, error: walletError } = await supabase
      .from("user_wallets")
      .select("coin_balance")
      .eq("user_id", userId)
      .single()

    if (walletError) {
      return NextResponse.json({ error: "Failed to fetch wallet balance" }, { status: 500 })
    }

    if (wallet.coin_balance < coinAmount) {
      return NextResponse.json({ error: "Insufficient coin balance" }, { status: 400 })
    }

    // Check event capacity
    const { data: ticketCount } = await supabase
      .from("tickets")
      .select("id", { count: "exact" })
      .eq("event_id", eventId)

    if (ticketCount && ticketCount.length >= eventConfig.max_capacity) {
      return NextResponse.json({ error: "Event is sold out" }, { status: 400 })
    }

    // Generate unique ticket number and secure QR data
    const ticketNumber = `EL${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    const { qrCode, qrToken, hashedToken } = generateSecureQRData(eventId, userId, ticketNumber)

    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        event_id: eventId,
        user_id: userId,
        ticket_number: ticketNumber,
        qr_code: qrCode,
        qr_token: hashedToken, // Store hashed token in database
        ticket_type: "premium",
        price_paid_naira: null,
        price_paid_coins: coinAmount,
        payment_method: "coins",
        payment_reference: `COINS_${Date.now()}`,
        status: "valid",
        metadata: {
          survey_data: surveyData,
          original_price_naira: 50000,
          discounted_price_naira: eventConfig.ticket_price_naira,
        },
      })
      .select()
      .single()

    if (ticketError) {
      console.error("Ticket creation error:", ticketError)
      return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 })
    }

    // Deduct coins from user wallet
    const { error: balanceError } = await supabase
      .from("user_wallets")
      .update({
        coin_balance: wallet.coin_balance - coinAmount,
        total_spent: supabase.sql`total_spent + ${coinAmount}`,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)

    if (balanceError) {
      // Rollback ticket creation
      await supabase.from("tickets").delete().eq("id", ticket.id)
      return NextResponse.json({ error: "Failed to process payment" }, { status: 500 })
    }

    // Log transaction
    await supabase.from("wallet_transactions").insert({
      user_id: userId,
      type: "purchase",
      category: "ticket",
      amount_coins: coinAmount,
      payment_method: "coins",
      status: "completed",
      description: `Purchased ticket for Erigga Intimate Session`,
      reference_id: ticket.id,
      reference_type: "ticket",
      metadata: {
        event_id: eventId,
        ticket_number: ticketNumber,
        survey_data: surveyData,
      },
    })

    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
      ticketNumber: ticket.ticket_number,
      qrCode: ticket.qr_code,
      qrToken: qrToken,
    })
  } catch (error) {
    console.error("Coin payment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
