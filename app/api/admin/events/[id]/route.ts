import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (event_date !== undefined) updateData.event_date = event_date
    if (venue !== undefined) updateData.venue = venue
    if (city !== undefined) updateData.city = city
    if (max_attendees !== undefined) {
      const parsed = parseInt(max_attendees)
      updateData.max_attendees = isNaN(parsed) || max_attendees === "" ? 0 : parsed
    }
    if (ticket_price_naira !== undefined) {
      const parsed = parseFloat(ticket_price_naira)
      updateData.ticket_price_naira = isNaN(parsed) || ticket_price_naira === "" ? 0 : parsed
    }
    if (ticket_price_coins !== undefined) {
      const parsed = parseFloat(ticket_price_coins)
      updateData.ticket_price_coins = isNaN(parsed) || ticket_price_coins === "" ? 0 : parsed
    }
    if (vip_price_naira !== undefined) {
      const parsed = parseFloat(vip_price_naira)
      updateData.vip_price_naira = isNaN(parsed) || vip_price_naira === "" ? 0 : parsed
    }
    if (image_url !== undefined) updateData.image_url = image_url
    if (status !== undefined) {
      updateData.status = status
      updateData.is_published = status === "upcoming" || status === "live"
    }
    if (contact !== undefined) updateData.contact = contact

    updateData.updated_at = new Date().toISOString()

    const { data: event, error } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("[Events API] Error updating event:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ event })
  } catch (error: any) {
    console.error("[Events API] Unexpected error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { error } = await supabase.from("events").delete().eq("id", params.id)

    if (error) {
      console.error("[Events API] Error deleting event:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Events API] Unexpected error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}