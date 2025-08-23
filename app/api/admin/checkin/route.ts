import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import crypto from "crypto"

const checkinSchema = z.object({
  token: z.string(),
  device_fingerprint: z.string().optional(),
  gate: z.string().optional(),
})

// Verify QR token hash
function verifyQRToken(token: string, storedHash: string): boolean {
  const secret = process.env.QR_SIGNING_SECRET || "default-secret-change-in-production"
  const computedHash = crypto.createHmac("sha256", secret).update(token).digest("hex")
  return computedHash === storedHash
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verify admin authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase.from("admin_users").select("role").eq("user_id", user.id).single()

    if (!profile || !["admin", "scanner"].includes(profile.role)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { token, device_fingerprint, gate } = checkinSchema.parse(body)

    // Find ticket by QR token hash
    const { data: tickets, error: ticketError } = await supabase
      .from("tickets")
      .select(`
        *,
        events!inner(
          id,
          title,
          venue,
          event_date,
          status
        )
      `)
      .not("qr_token_hash", "is", null)

    if (ticketError) {
      console.error("Ticket search error:", ticketError)
      return NextResponse.json({ error: "Failed to verify ticket" }, { status: 500 })
    }

    // Find matching ticket by verifying token against each hash
    let matchingTicket = null
    for (const ticket of tickets || []) {
      if (verifyQRToken(token, ticket.qr_token_hash)) {
        matchingTicket = ticket
        break
      }
    }

    if (!matchingTicket) {
      // Log invalid scan attempt
      await supabase.from("scan_logs").insert({
        ticket_id: null,
        admin_user_id: user.id,
        scan_result: "invalid",
        device_fingerprint,
        location_hint: gate,
        scanned_at: new Date().toISOString(),
      })

      return NextResponse.json({
        result: "reject",
        reason: "Invalid QR code",
        ticket_id: null,
      })
    }

    // Check if ticket is expired
    if (matchingTicket.qr_expires_at && new Date(matchingTicket.qr_expires_at) < new Date()) {
      await supabase.from("scan_logs").insert({
        ticket_id: matchingTicket.id,
        admin_user_id: user.id,
        scan_result: "invalid",
        device_fingerprint,
        location_hint: gate,
        scanned_at: new Date().toISOString(),
      })

      return NextResponse.json({
        result: "reject",
        reason: "QR code expired",
        ticket_id: matchingTicket.id,
        user_masked: `${matchingTicket.events.title} ticket holder`,
        event: {
          title: matchingTicket.events.title,
          venue: matchingTicket.events.venue,
        },
      })
    }

    // Check if event is active
    if (matchingTicket.events.status !== "active") {
      await supabase.from("scan_logs").insert({
        ticket_id: matchingTicket.id,
        admin_user_id: user.id,
        scan_result: "invalid",
        device_fingerprint,
        location_hint: gate,
        scanned_at: new Date().toISOString(),
      })

      return NextResponse.json({
        result: "reject",
        reason: "Event not active",
        ticket_id: matchingTicket.id,
        user_masked: `${matchingTicket.events.title} ticket holder`,
        event: {
          title: matchingTicket.events.title,
          venue: matchingTicket.events.venue,
        },
      })
    }

    // Check if already admitted
    if (matchingTicket.status === "admitted") {
      await supabase.from("scan_logs").insert({
        ticket_id: matchingTicket.id,
        admin_user_id: user.id,
        scan_result: "duplicate",
        device_fingerprint,
        location_hint: gate,
        scanned_at: new Date().toISOString(),
      })

      return NextResponse.json({
        result: "reject",
        reason: "Already admitted",
        ticket_id: matchingTicket.id,
        user_masked: `${matchingTicket.events.title} ticket holder`,
        event: {
          title: matchingTicket.events.title,
          venue: matchingTicket.events.venue,
        },
        warnings: [`Previously admitted at ${new Date(matchingTicket.admitted_at).toLocaleString()}`],
        previous_status: "admitted",
      })
    }

    // Check if ticket is valid status
    if (matchingTicket.status !== "unused") {
      await supabase.from("scan_logs").insert({
        ticket_id: matchingTicket.id,
        admin_user_id: user.id,
        scan_result: "invalid",
        device_fingerprint,
        location_hint: gate,
        scanned_at: new Date().toISOString(),
      })

      return NextResponse.json({
        result: "reject",
        reason: `Ticket status: ${matchingTicket.status}`,
        ticket_id: matchingTicket.id,
        user_masked: `${matchingTicket.events.title} ticket holder`,
        event: {
          title: matchingTicket.events.title,
          venue: matchingTicket.events.venue,
        },
        previous_status: matchingTicket.status,
      })
    }

    // Admit the ticket holder
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        status: "admitted",
        admitted_at: new Date().toISOString(),
      })
      .eq("id", matchingTicket.id)

    if (updateError) {
      console.error("Ticket update error:", updateError)
      return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 })
    }

    // Log successful admission
    await supabase.from("scan_logs").insert({
      ticket_id: matchingTicket.id,
      admin_user_id: user.id,
      scan_result: "admitted",
      device_fingerprint,
      location_hint: gate,
      scanned_at: new Date().toISOString(),
    })

    return NextResponse.json({
      result: "admit",
      ticket_id: matchingTicket.id,
      user_masked: `${matchingTicket.events.title} ticket holder`,
      event: {
        title: matchingTicket.events.title,
        venue: matchingTicket.events.venue,
        event_date: matchingTicket.events.event_date,
      },
      admitted_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Check-in API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
