import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 })
    }

    const supabase = createClient()

    // Find ticket by token hash
    const { data: ticket, error } = await supabase
      .from("tickets")
      .select(`
        id,
        status,
        event:events_v2(title, starts_at, venue)
      `)
      .eq("qr_token_hash", token)
      .single()

    if (error || !ticket) {
      return NextResponse.json({ error: "Invalid ticket" }, { status: 404 })
    }

    // Return minimal public info (no PII)
    return NextResponse.json({
      valid: ticket.status === "unused",
      status: ticket.status,
      event: ticket.event?.title,
      venue: ticket.event?.venue,
    })
  } catch (error) {
    console.error("Ticket verification error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
