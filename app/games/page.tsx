"use client"

import { AuthGuard } from "@/components/auth-guard"
import { GameLobby } from "@/components/game/game-lobby"

export default function GamesPage() {
  return (
    <AuthGuard requireAuth>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <GameLobby />
      </div>
    </AuthGuard>
  )
}
