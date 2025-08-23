import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function verifyAdmin(request: NextRequest) {
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

    if (profileError || !profile || profile.role !== "admin") {
      return { error: "Admin access required", user: null, profile: null }
    }

    return { user, profile, error: null }
  } catch (error) {
    console.error("Admin verification error:", error)
    return { error: "Authentication failed", user: null, profile: null }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, profile, error: authError } = await verifyAdmin(request)
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

    const { ticketId, qrCode } = requestData

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

    // Verify and use the ticket using the database function
    try {
      const { data: result, error: scanError } = await supabase.rpc("validate_and_use_ticket", {
        p_ticket_id: ticketId,
        p_scanned_by: user.id,
      })

      if (scanError) {
        return NextResponse.json(
          {
            success: false,
            error: scanError.message,
            code: "SCAN_ERROR",
          },
          { status: 400 },
        )
      }

      // Get the updated ticket with event and user details
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
            error: "Failed to retrieve ticket details",
            code: "TICKET_RETRIEVAL_ERROR",
          },
          { status: 500 },
        )
      }

      return NextResponse.json({
        success: true,
        message: "Ticket scanned successfully",
        ticket: {
          id: ticket.id,
          ticket_number: ticket.ticket_number,
          status: ticket.status,
          used_at: ticket.used_at,
          scanned_by: profile.email,
        },
        event: {
          id: ticket.events?.id,
          title: ticket.events?.title,
          event_date: ticket.events?.event_date,
          venue: ticket.events?.venue,
        },
        attendee: {
          id: ticket.profiles?.id,
          email: ticket.profiles?.email,
          username: ticket.profiles?.username,
        },
      })
    } catch (error) {
      console.error("Ticket scanning error:", error)
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Ticket scanning failed",
          code: "SCAN_FAILED",
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Admin scan API error:", error)
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
