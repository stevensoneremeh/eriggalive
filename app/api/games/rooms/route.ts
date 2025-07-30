import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    const { data: rooms, error } = await supabase
      .from("game_rooms")
      .select(`
        *,
        host:users!host_user_id(username, avatar_url),
        players:game_players(user_id, users(username, avatar_url))
      `)
      .eq("status", "waiting")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching game rooms:", error)
      return NextResponse.json({ error: "Failed to fetch game rooms" }, { status: 500 })
    }

    return NextResponse.json({ rooms })
  } catch (error) {
    console.error("Error in GET /api/games/rooms:", error)
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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const { name, gameType = "ludo", maxPlayers = 4 } = await request.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Room name is required" }, { status: 400 })
    }

    // Create game room
    const { data: room, error: roomError } = await supabase
      .from("game_rooms")
      .insert({
        name: name.trim(),
        game_type: gameType,
        host_user_id: profile.id,
        max_players: maxPlayers,
      })
      .select()
      .single()

    if (roomError) {
      console.error("Error creating game room:", roomError)
      return NextResponse.json({ error: "Failed to create game room" }, { status: 500 })
    }

    // Add host as first player
    const { error: playerError } = await supabase.from("game_players").insert({
      room_id: room.id,
      user_id: profile.id,
      player_color: "red",
      player_position: 0,
    })

    if (playerError) {
      console.error("Error adding host to game:", playerError)
      // Clean up the room if we can't add the host
      await supabase.from("game_rooms").delete().eq("id", room.id)
      return NextResponse.json({ error: "Failed to join game room" }, { status: 500 })
    }

    return NextResponse.json({ room })
  } catch (error) {
    console.error("Error in POST /api/games/rooms:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
