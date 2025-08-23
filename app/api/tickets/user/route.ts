import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's tickets with event details
    const { data: tickets, error } = await supabase
      .from("tickets")
      .select(`
        *,
        events!inner(
          id,
          title,
          venue,
          event_date,
          ticket_price,
          status
        ),
        payments(
          provider,
          amount_ngn,
          status
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Tickets fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      tickets: tickets || [],
    })
  } catch (error) {
    console.error("User tickets API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
