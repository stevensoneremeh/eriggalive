import { createClient } from "@/lib/supabase/server"
import { LudoGame } from "@/components/game/ludo-game"
import { notFound, redirect } from "next/navigation"

interface GamePageProps {
  params: {
    gameId: string
  }
}

export default async function GamePage({ params }: GamePageProps) {
  const supabase = createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch game data
  const { data: game, error } = await supabase
    .from("ludo_games")
    .select(`
      *,
      profiles!ludo_games_host_id_fkey(username)
    `)
    .eq("id", params.gameId)
    .single()

  if (error || !game) {
    notFound()
  }

  // Get all players in the game
  const playerIds = Object.keys(game.game_state.players || {})
  const { data: players } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", playerIds)

  return (
    <LudoGame
      gameId={params.gameId}
      initialGameState={game.game_state}
      roomName={game.room_name}
      prizePool={game.prize_pool}
      players={players || []}
    />
  )
}
