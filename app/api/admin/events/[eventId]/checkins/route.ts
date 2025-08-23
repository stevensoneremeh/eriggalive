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

export async function GET(request: NextRequest, { params }: { params: { eventId: string } }) {
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

    const { eventId } = params

    if (!eventId) {
      return NextResponse.json(
        {
          success: false,
          error: "Event ID is required",
          code: "MISSING_EVENT_ID",
        },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    // Get event details
    const { data: event, error: eventError } = await supabase.from("events").select("*").eq("id", eventId).single()

    if (eventError || !event) {
      return NextResponse.json(
        {
          success: false,
          error: "Event not found",
          code: "EVENT_NOT_FOUND",
        },
        { status: 404 },
      )
    }

    // Get check-in statistics
    const { data: checkins, error: checkinsError } = await supabase
      .from("event_checkins")
      .select(`
        *,
        tickets (
          ticket_number,
          payment_method,
          amount_paid
        ),
        profiles!event_checkins_user_id_fkey (
          id,
          email,
          username
        ),
        profiles!event_checkins_checked_in_by_fkey (
          id,
          email
        )
      `)
      .eq("event_id", eventId)
      .order("checked_in_at", { ascending: false })

    if (checkinsError) {
      console.error("Check-ins fetch error:", checkinsError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch check-ins",
          code: "CHECKINS_FETCH_ERROR",
        },
        { status: 500 },
      )
    }

    // Get total tickets sold for this event
    const { count: totalTickets } = await supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "valid")

    const checkedInCount = checkins?.length || 0
    const attendanceRate = totalTickets ? Math.round((checkedInCount / totalTickets) * 100) : 0

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        event_date: event.event_date,
        venue: event.venue,
        max_capacity: event.max_capacity,
        tickets_sold: event.tickets_sold,
      },
      statistics: {
        total_tickets: totalTickets || 0,
        checked_in: checkedInCount,
        attendance_rate: attendanceRate,
        remaining_capacity: Math.max(0, event.max_capacity - checkedInCount),
      },
      checkins:
        checkins?.map((checkin) => ({
          id: checkin.id,
          checked_in_at: checkin.checked_in_at,
          ticket: {
            ticket_number: checkin.tickets?.ticket_number,
            payment_method: checkin.tickets?.payment_method,
            amount_paid: checkin.tickets?.amount_paid,
          },
          attendee: {
            id: checkin.profiles?.id,
            email: checkin.profiles?.email,
            username: checkin.profiles?.username,
          },
          scanned_by: {
            id: checkin.profiles?.id,
            email: checkin.profiles?.email,
          },
        })) || [],
    })
  } catch (error) {
    console.error("Admin checkins API error:", error)
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
