import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { ticketId, qrCode } = await request.json()

    if (!ticketId || !qrCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing ticket ID or QR code",
          code: "MISSING_DATA",
        },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    // Get ticket with event details
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select(`
        *,
        events (
          id,
          title,
          event_date,
          venue,
          status
        ),
        profiles (
          id,
          email,
          username
        )
      `)
      .eq("id", ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json(
        {
          success: false,
          error: "Ticket not found",
          code: "TICKET_NOT_FOUND",
        },
        { status: 404 },
      )
    }

    // Verify QR code matches
    if (ticket.qr_code !== qrCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid QR code",
          code: "INVALID_QR_CODE",
        },
        { status: 400 },
      )
    }

    // Check ticket status
    if (ticket.status !== "valid") {
      return NextResponse.json(
        {
          success: false,
          error: `Ticket is ${ticket.status}`,
          code: "INVALID_TICKET_STATUS",
          ticketStatus: ticket.status,
        },
        { status: 400 },
      )
    }

    // Check if event is still upcoming or live
    if (ticket.events?.status === "completed" || ticket.events?.status === "cancelled") {
      return NextResponse.json(
        {
          success: false,
          error: `Event is ${ticket.events.status}`,
          code: "EVENT_NOT_ACTIVE",
          eventStatus: ticket.events.status,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        status: ticket.status,
        purchased_at: ticket.purchased_at,
        used_at: ticket.used_at,
      },
      event: {
        id: ticket.events?.id,
        title: ticket.events?.title,
        event_date: ticket.events?.event_date,
        venue: ticket.events?.venue,
        status: ticket.events?.status,
      },
      user: {
        id: ticket.profiles?.id,
        email: ticket.profiles?.email,
        username: ticket.profiles?.username,
      },
      message: "Ticket is valid and ready for check-in",
    })
  } catch (error) {
    console.error("Ticket verification error:", error)
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
