import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { roomId: string } }) {
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

    const roomId = params.roomId

    // Check if room exists and has space
    const { data: room, error: roomError } = await supabase
      .from("game_rooms")
      .select("*")
      .eq("id", roomId)
      .eq("status", "waiting")
      .single()

    if (roomError || !room) {
      return NextResponse.json({ error: "Game room not found or not available" }, { status: 404 })
    }

    if (room.current_players >= room.max_players) {
      return NextResponse.json({ error: "Game room is full" }, { status: 400 })
    }

    // Check if user is already in the room
    const { data: existingPlayer } = await supabase
      .from("game_players")
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", profile.id)
      .is("left_at", null)
      .single()

    if (existingPlayer) {
      return NextResponse.json({ error: "Already in this game room" }, { status: 400 })
    }

    // Determine player color and position
    const { data: existingPlayers } = await supabase
      .from("game_players")
      .select("player_color, player_position")
      .eq("room_id", roomId)
      .is("left_at", null)

    const usedColors = existingPlayers?.map((p) => p.player_color) || []
    const availableColors = ["red", "blue", "green", "yellow"].filter((color) => !usedColors.includes(color))
    const playerColor = availableColors[0] || "blue"
    const playerPosition = existingPlayers?.length || 0

    // Add player to game
    const { error: joinError } = await supabase.from("game_players").insert({
      room_id: roomId,
      user_id: profile.id,
      player_color: playerColor,
      player_position: playerPosition,
    })

    if (joinError) {
      console.error("Error joining game room:", joinError)
      return NextResponse.json({ error: "Failed to join game room" }, { status: 500 })
    }

    // Start game if room is full
    if (room.current_players + 1 >= room.max_players) {
      await supabase.from("game_rooms").update({ status: "playing" }).eq("id", roomId)

      // Create game session
      await supabase.from("game_sessions").insert({
        room_id: roomId,
        game_state: {
          players: [],
          currentPlayer: 0,
          diceValue: 1,
          gameStatus: "playing",
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in POST /api/games/rooms/[roomId]/join:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
