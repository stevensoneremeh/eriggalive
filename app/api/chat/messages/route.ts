import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { publishEvent, ABLY_CHANNELS } from "@/lib/ably"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get("room_id")

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 })
    }

    const { data: messages, error } = await supabase
      .from("chat_messages")
      .select(`
        *,
        user:users!chat_messages_user_id_fkey(
          username,
          full_name,
          avatar_url,
          tier
        )
      `)
      .eq("room_id", roomId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })
      .limit(50)

    if (error) {
      console.error("Error fetching messages:", error)
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error in messages API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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

    const body = await request.json()
    const { content, room_id } = body

    if (!content?.trim() || !room_id) {
      return NextResponse.json({ error: "Content and room_id are required" }, { status: 400 })
    }

    // Get user profile
    const { data: profile } = await supabase.from("users").select("id").eq("auth_user_id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Insert message
    const { data: message, error: insertError } = await supabase
      .from("chat_messages")
      .insert({
        content: content.trim(),
        user_id: profile.id,
        room_id,
      })
      .select(`
        *,
        user:users!chat_messages_user_id_fkey(
          username,
          full_name,
          avatar_url,
          tier
        )
      `)
      .single()

    if (insertError) {
      console.error("Error inserting message:", insertError)
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }

    // Publish real-time event
    try {
      await publishEvent(ABLY_CHANNELS.CHAT_ROOM(room_id), "message:new", {
        message,
        room_id,
      })
    } catch (ablyError) {
      console.error("Failed to publish message event:", ablyError)
      // Don't fail the request if real-time publishing fails
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error("Error in messages POST API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
