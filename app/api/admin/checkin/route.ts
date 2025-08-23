import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { token, scanner_id } = await request.json()

    if (!token || !scanner_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Token and scanner ID required",
        },
        { status: 400 },
      )
    }

    const supabase = createClient()

    // Verify admin permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 },
      )
    }

    const { data: profile } = await supabase.from("users").select("role").eq("auth_user_id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required",
        },
        { status: 403 },
      )
    }

    // Find ticket by QR token
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select(`
        id,
        status,
        admitted_at,
        user:users(username, email),
        event:events_v2(title, starts_at, status)
      `)
      .eq("qr_token_hash", token)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({
        success: false,
        message: "Invalid ticket - QR code not found",
      })
    }

    // Check if event is active
    if (ticket.event?.status !== "active") {
      return NextResponse.json({
        success: false,
        message: "Event is not currently active",
      })
    }

    // Check if ticket is already used
    if (ticket.status === "admitted") {
      return NextResponse.json({
        success: false,
        message: `Ticket already used at ${new Date(ticket.admitted_at).toLocaleString()}`,
        ticket: {
          id: ticket.id,
          event_title: ticket.event?.title,
          holder_name: ticket.user?.username || ticket.user?.email,
          status: ticket.status,
        },
      })
    }

    // Check if ticket is valid
    if (ticket.status !== "unused") {
      return NextResponse.json({
        success: false,
        message: "Invalid ticket status",
      })
    }

    // Admit the ticket
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        status: "admitted",
        admitted_at: new Date().toISOString(),
        admitted_by: user.id,
      })
      .eq("id", ticket.id)

    if (updateError) {
      console.error("Failed to update ticket:", updateError)
      return NextResponse.json(
        {
          success: false,
          message: "Failed to process check-in",
        },
        { status: 500 },
      )
    }

    // Log the check-in
    await supabase.from("scan_logs").insert({
      ticket_id: ticket.id,
      scanner_id: user.id,
      action: "admit",
      result: "success",
    })

    // Send real-time update to user
    await supabase.channel(`user:${ticket.user?.id || "unknown"}`).send({
      type: "broadcast",
      event: "ticket_admitted",
      payload: {
        ticket_id: ticket.id,
        admitted_at: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      message: "✅ Ticket verified - Welcome to the event!",
      ticket: {
        id: ticket.id,
        event_title: ticket.event?.title,
        holder_name: ticket.user?.username || ticket.user?.email,
        status: "admitted",
      },
    })
  } catch (error) {
    console.error("Check-in error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "System error - please try again",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Admin check-in endpoint is active",
    timestamp: new Date().toISOString(),
  })
}
