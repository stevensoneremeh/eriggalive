import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== "info@eriggalive.com") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("live_streams")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    return NextResponse.json({ streams: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== "info@eriggalive.com") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    
    // Create Mux live stream if we have Mux credentials
    let muxData = {}
    if (process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET) {
      try {
        const muxResponse = await fetch("https://api.mux.com/video/v1/live-streams", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(`${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`).toString("base64")}`,
          },
          body: JSON.stringify({
            playback_policy: ["public"],
            new_asset_settings: { playback_policy: ["public"] },
          }),
        })

        if (muxResponse.ok) {
          const muxStream = await muxResponse.json()
          muxData = {
            mux_playback_id: muxStream.data.playback_ids?.[0]?.id,
            mux_stream_key: muxStream.data.stream_key,
            mux_asset_id: muxStream.data.id,
          }
        }
      } catch (muxError) {
        console.error("Mux API error:", muxError)
      }
    }

    const { data, error } = await supabase
      .from("live_streams")
      .insert([{ ...body, ...muxData, created_by: user.id }])
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ stream: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== "info@eriggalive.com") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    const { data, error } = await supabase
      .from("live_streams")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ stream: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
