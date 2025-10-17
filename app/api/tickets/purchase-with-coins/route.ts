import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateSecureToken } from "@/lib/security/validation"

export async function POST(request: NextRequest) {
  try {
    const { eventId, userId, coinAmount, surveyData } = await request.json()

    const supabase = createClient()

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check user's coin balance
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("coins")
      .eq("auth_user_id", userId)
      .single()

    if (profileError) {
      return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
    }

    if (profile.coins < coinAmount) {
      return NextResponse.json({ error: "Insufficient coin balance" }, { status: 400 })
    }

    // Get event details
    const { data: event, error: eventError } = await supabase.from("events").select("*").eq("id", eventId).single()

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if event is still available
    const { data: ticketCount } = await supabase
      .from("tickets")
      .select("id", { count: "exact" })
      .eq("event_id", eventId)

    if (ticketCount && ticketCount.length >= event.capacity) {
      return NextResponse.json({ error: "Event is sold out" }, { status: 400 })
    }

    // Generate unique ticket number and QR code
    const ticketNumber = `EL${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    const qrToken = generateSecureToken(userId, eventId, ticketNumber)

    // Start transaction
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        event_id: eventId,
        user_id: userId,
        ticket_number: ticketNumber,
        qr_code: qrToken,
        ticket_type: "premium",
        price_paid: 0, // Paid with coins
        payment_method: "erigga_coins",
        payment_reference: `COINS_${Date.now()}`,
        status: "active",
        survey_data: surveyData,
      })
      .select()
      .single()

    if (ticketError) {
      return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 })
    }

    // Deduct coins from user balance
    const { error: balanceError } = await supabase
      .from("users")
      .update({ coins: profile.coins - coinAmount })
      .eq("auth_user_id", userId)

    if (balanceError) {
      // Rollback ticket creation
      await supabase.from("tickets").delete().eq("id", ticket.id)
      return NextResponse.json({ error: "Failed to process payment" }, { status: 500 })
    }

    // Log transaction
    await supabase.from("transactions").insert({
      user_id: userId,
      type: "ticket_purchase",
      amount: coinAmount,
      currency: "coins",
      reference: `COINS_${Date.now()}`,
      status: "completed",
      metadata: {
        ticket_id: ticket.id,
        event_id: eventId,
        survey_data: surveyData,
      },
    })

    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
      ticketNumber: ticket.ticket_number,
      qrCode: ticket.qr_code,
    })
  } catch (error) {
    console.error("Coin payment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
