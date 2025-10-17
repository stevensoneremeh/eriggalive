import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

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
    const supabase = await createClient()

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

    const parsedMaxAttendees = parseInt(max_attendees)
    const parsedTicketPriceNaira = parseFloat(ticket_price_naira)
    const parsedTicketPriceCoins = parseFloat(ticket_price_coins)
    const parsedVipPriceNaira = parseFloat(vip_price_naira)

    const { data: event, error } = await supabase
      .from("events")
      .insert([
        {
          title,
          description: description || null,
          event_date,
          venue,
          city: city || null,
          max_attendees: isNaN(parsedMaxAttendees) || max_attendees === "" ? 0 : parsedMaxAttendees,
          current_attendance: 0,
          ticket_price_naira: isNaN(parsedTicketPriceNaira) || ticket_price_naira === "" ? 0 : parsedTicketPriceNaira,
          ticket_price_coins: isNaN(parsedTicketPriceCoins) || ticket_price_coins === "" ? 0 : parsedTicketPriceCoins,
          vip_price_naira: isNaN(parsedVipPriceNaira) || vip_price_naira === "" ? 0 : parsedVipPriceNaira,
          original_price_naira: isNaN(parsedTicketPriceNaira) || ticket_price_naira === "" ? 0 : parsedTicketPriceNaira,
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