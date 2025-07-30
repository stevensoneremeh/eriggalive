import { LudoGame } from "@/components/game/ludo-game"

interface GamePageProps {
  params: {
    gameId: string
  }
}

export default function GamePage({ params }: GamePageProps) {
  return <LudoGame gameId={params.gameId} />
}
