import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.email !== "info@eriggalive.com") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: false })

    if (error) {
      console.error("[Events API] Error fetching events:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ events: events || [] })
  } catch (error: any) {
    console.error("[Events API] Unexpected error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.email !== "info@eriggalive.com") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      event_date,
      venue,
      city,
      max_attendees,
      ticket_price_naira,
      ticket_price_coins,
      vip_price_naira,
      image_url,
      status,
      contact,
    } = body

    if (!title || !event_date || !venue) {
      return NextResponse.json({ error: "Title, event date, and venue are required" }, { status: 400 })
    }

    const { data: event, error } = await supabase
      .from("events")
      .insert([
        {
          title,
          description: description || null,
          event_date,
          venue,
          city: city || null,
          max_attendees: parseInt(max_attendees) || 0,
          current_attendance: 0,
          ticket_price_naira: parseFloat(ticket_price_naira) || 0,
          ticket_price_coins: parseFloat(ticket_price_coins) || 0,
          vip_price_naira: parseFloat(vip_price_naira) || 0,
          original_price_naira: parseFloat(ticket_price_naira) || 0,
          image_url: image_url || null,
          status: status || "draft",
          contact: contact || null,
          created_by: user.id,
          is_featured: false,
          is_published: status === "upcoming" || status === "live",
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("[Events API] Error creating event:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ event }, { status: 201 })
  } catch (error: any) {
    console.error("[Events API] Unexpected error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
