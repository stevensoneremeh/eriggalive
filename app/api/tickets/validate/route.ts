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
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
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
      return NextResponse.json({ success: false, error: authError || "Unauthorized" }, { status: 401 })
    }

    const requestData = await request.json()
    const { qrCode, qrToken, eventId, scanLocation } = requestData

    if (!qrCode || !qrToken) {
      return NextResponse.json({ success: false, error: "QR code and token required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Find ticket by QR code
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
        users:user_id (
          id,
          full_name,
          email
        )
      `)
      .eq("qr_code", qrCode)
      .single()

    if (ticketError || !ticket) {
      // Log scan attempt
      await supabase.from("scan_logs").insert({
        ticket_id: null,
        event_id: eventId,
        scanned_by: user.id,
        scan_result: "invalid",
        scan_location: scanLocation,
        device_info: { user_agent: request.headers.get("user-agent") },
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      })

      return NextResponse.json(
        {
          success: false,
          error: "Invalid QR code",
          result: "invalid",
        },
        { status: 404 },
      )
    }

    // Validate QR token
    const { data: isValidToken, error: tokenError } = await supabase.rpc("validate_qr_token", {
      ticket_id: ticket.id,
      token: qrToken,
    })

    if (tokenError || !isValidToken) {
      // Log scan attempt
      await supabase.from("scan_logs").insert({
        ticket_id: ticket.id,
        event_id: ticket.event_id,
        scanned_by: user.id,
        scan_result: "invalid",
        scan_location: scanLocation,
        device_info: { user_agent: request.headers.get("user-agent") },
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      })

      return NextResponse.json(
        {
          success: false,
          error: "Invalid QR token",
          result: "invalid",
        },
        { status: 400 },
      )
    }

    // Check if ticket is for the correct event
    if (eventId && ticket.event_id !== eventId) {
      // Log scan attempt
      await supabase.from("scan_logs").insert({
        ticket_id: ticket.id,
        event_id: eventId,
        scanned_by: user.id,
        scan_result: "wrong_event",
        scan_location: scanLocation,
        device_info: { user_agent: request.headers.get("user-agent") },
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      })

      return NextResponse.json(
        {
          success: false,
          error: "Ticket is not valid for this event",
          result: "wrong_event",
          ticket: {
            ticket_number: ticket.ticket_number,
            event_title: ticket.events?.title,
            holder_name: ticket.users?.full_name,
          },
        },
        { status: 400 },
      )
    }

    // Check if already admitted
    if (ticket.admission_status === "admitted") {
      // Log scan attempt
      await supabase.from("scan_logs").insert({
        ticket_id: ticket.id,
        event_id: ticket.event_id,
        scanned_by: user.id,
        scan_result: "already_admitted",
        scan_location: scanLocation,
        device_info: { user_agent: request.headers.get("user-agent") },
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      })

      return NextResponse.json(
        {
          success: false,
          error: "Ticket holder has already been admitted",
          result: "already_admitted",
          ticket: {
            ticket_number: ticket.ticket_number,
            event_title: ticket.events?.title,
            holder_name: ticket.users?.full_name,
            admitted_at: ticket.admitted_at,
            seating_assignment: ticket.seating_assignment,
          },
        },
        { status: 400 },
      )
    }

    // Check if ticket is already used (old system compatibility)
    if (ticket.status === "used") {
      // Log scan attempt
      await supabase.from("scan_logs").insert({
        ticket_id: ticket.id,
        event_id: ticket.event_id,
        scanned_by: user.id,
        scan_result: "already_used",
        scan_location: scanLocation,
        device_info: { user_agent: request.headers.get("user-agent") },
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      })

      return NextResponse.json(
        {
          success: false,
          error: "Ticket has already been used",
          result: "already_used",
          ticket: {
            ticket_number: ticket.ticket_number,
            event_title: ticket.events?.title,
            holder_name: ticket.users?.full_name,
            used_at: ticket.used_at,
          },
        },
        { status: 400 },
      )
    }

    // Check if ticket is expired or cancelled
    if (ticket.status === "expired" || ticket.status === "cancelled") {
      // Log scan attempt
      await supabase.from("scan_logs").insert({
        ticket_id: ticket.id,
        event_id: ticket.event_id,
        scanned_by: user.id,
        scan_result: "expired",
        scan_location: scanLocation,
        device_info: { user_agent: request.headers.get("user-agent") },
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      })

      return NextResponse.json(
        {
          success: false,
          error: `Ticket is ${ticket.status}`,
          result: "expired",
          ticket: {
            ticket_number: ticket.ticket_number,
            event_title: ticket.events?.title,
            holder_name: ticket.users?.full_name,
            status: ticket.status,
          },
        },
        { status: 400 },
      )
    }

    // Check if event is still active
    if (ticket.events?.status === "cancelled" || ticket.events?.status === "completed") {
      // Log scan attempt
      await supabase.from("scan_logs").insert({
        ticket_id: ticket.id,
        event_id: ticket.event_id,
        scanned_by: user.id,
        scan_result: "expired",
        scan_location: scanLocation,
        device_info: { user_agent: request.headers.get("user-agent") },
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      })

      return NextResponse.json(
        {
          success: false,
          error: `Event is ${ticket.events.status}`,
          result: "expired",
          ticket: {
            ticket_number: ticket.ticket_number,
            event_title: ticket.events?.title,
            holder_name: ticket.users?.full_name,
          },
        },
        { status: 400 },
      )
    }

    // Valid ticket - mark as admitted
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        status: "used",
        admission_status: "admitted",
        admitted_at: new Date().toISOString(),
        admitted_by: user.id,
        used_at: new Date().toISOString(),
        checked_in_by: user.id,
        check_in_location: scanLocation,
      })
      .eq("id", ticket.id)

    if (updateError) {
      console.error("Error updating ticket status:", updateError)
      return NextResponse.json({ success: false, error: "Failed to update ticket status" }, { status: 500 })
    }

    // Log successful scan
    await supabase.from("scan_logs").insert({
      ticket_id: ticket.id,
      event_id: ticket.event_id,
      scanned_by: user.id,
      scan_result: "valid",
      scan_location: scanLocation,
      device_info: { user_agent: request.headers.get("user-agent") },
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
    })

    // Update event attendance
    await supabase
      .from("events")
      .update({
        current_attendance: (ticket.events?.current_attendance || 0) + 1,
      })
      .eq("id", ticket.event_id)

    return NextResponse.json({
      success: true,
      result: "valid",
      message: "Ticket validated successfully - Admission granted",
      ticket: {
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        ticket_type: ticket.ticket_type,
        event_title: ticket.events?.title,
        event_date: ticket.events?.event_date,
        venue: ticket.events?.venue,
        holder_name: ticket.users?.full_name,
        holder_email: ticket.users?.email,
        seating_assignment: ticket.seating_assignment,
        seating_priority: ticket.seating_priority,
        price_paid: ticket.custom_amount || ticket.price_paid_naira,
        admitted_at: new Date().toISOString(),
        admitted_by: profile.full_name,
        checked_in_at: new Date().toISOString(),
        checked_in_by: profile.full_name,
      },
    })
  } catch (error) {
    console.error("Ticket validation error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ success: false, error: "Method not allowed" }, { status: 405 })
}
