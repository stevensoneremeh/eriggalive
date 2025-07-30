"use client"
import { AuthGuard } from "@/components/auth-guard"
import { LudoGame } from "@/components/game/ludo-game"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface GamePageProps {
  params: {
    gameId: string
  }
}

export default function GamePage({ params }: GamePageProps) {
  return (
    <AuthGuard requireAuth>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Link
            href="/games"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Lobby
          </Link>
        </div>

        <LudoGame gameId={params.gameId} />
      </div>
    </AuthGuard>
  )
}
