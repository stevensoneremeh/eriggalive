"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RotateCcw, Home, Trophy, Users, Copy, Share2, Coins, Crown } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

type Player = "X" | "O" | null
type Board = Player[]
type GameMode = "local" | "online"

const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8], // Rows
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8], // Columns
  [0, 4, 8],
  [2, 4, 6], // Diagonals
]

export default function EriggaXAndOPage() {
  const { user, profile } = useAuth()
  const [gameMode, setGameMode] = useState<GameMode>("local")
  const [board, setBoard] = useState<Board>(Array(9).fill(null))
  const [currentPlayer, setCurrentPlayer] = useState<"X" | "O">("X")
  const [winner, setWinner] = useState<Player>(null)
  const [isDraw, setIsDraw] = useState(false)
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 })
  const [sessionCode, setSessionCode] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [isHost, setIsHost] = useState(false)
  const [opponent, setOpponent] = useState<any>(null)
  const [gameStatus, setGameStatus] = useState<"waiting" | "active" | "completed">("waiting")
  const [coinsEarned, setCoinsEarned] = useState(0)

  const checkWinner = useCallback((board: Board): Player => {
    for (const combination of WINNING_COMBINATIONS) {
      const [a, b, c] = combination
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a]
      }
    }
    return null
  }, [])

  const checkDraw = useCallback(
    (board: Board): boolean => {
      return board.every((cell) => cell !== null) && !checkWinner(board)
    },
    [checkWinner],
  )

  const handleCellClick = useCallback(
    (index: number) => {
      if (board[index] || winner || isDraw) return

      const newBoard = [...board]
      newBoard[index] = currentPlayer
      setBoard(newBoard)

      const gameWinner = checkWinner(newBoard)
      const gameDraw = checkDraw(newBoard)

      if (gameWinner) {
        setWinner(gameWinner)
        const coins = gameWinner === "X" ? 10 : 10
        setCoinsEarned(coins)
        setScores((prev) => ({
          ...prev,
          [gameWinner]: prev[gameWinner] + 1,
        }))
        toast.success(`Player ${gameWinner} wins! +${coins} coins earned!`)
      } else if (gameDraw) {
        setIsDraw(true)
        setCoinsEarned(5)
        setScores((prev) => ({
          ...prev,
          draws: prev.draws + 1,
        }))
        toast.info("It's a draw! +5 coins for both players!")
      } else {
        setCurrentPlayer(currentPlayer === "X" ? "O" : "X")
      }
    },
    [board, currentPlayer, winner, isDraw, checkWinner, checkDraw],
  )

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null))
    setCurrentPlayer("X")
    setWinner(null)
    setIsDraw(false)
    setCoinsEarned(0)
  }, [])

  const resetScores = useCallback(() => {
    setScores({ X: 0, O: 0, draws: 0 })
    resetGame()
  }, [resetGame])

  const createOnlineGame = useCallback(async () => {
    if (!user) {
      toast.error("Please sign in to play online")
      return
    }

    try {
      // Generate a random session code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase()
      setSessionCode(code)
      setIsHost(true)
      setGameStatus("waiting")
      toast.success(`Game created! Share code: ${code}`)
    } catch (error) {
      toast.error("Failed to create game")
    }
  }, [user])

  const joinOnlineGame = useCallback(async () => {
    if (!user) {
      toast.error("Please sign in to play online")
      return
    }

    if (!joinCode.trim()) {
      toast.error("Please enter a game code")
      return
    }

    try {
      // Simulate joining game
      setSessionCode(joinCode.toUpperCase())
      setIsHost(false)
      setGameStatus("active")
      setOpponent({ username: "Player 2", tier: "erigga_citizen" })
      toast.success("Joined game successfully!")
    } catch (error) {
      toast.error("Failed to join game")
    }
  }, [user, joinCode])

  const copySessionCode = useCallback(() => {
    if (sessionCode) {
      navigator.clipboard.writeText(sessionCode)
      toast.success("Game code copied to clipboard!")
    }
  }, [sessionCode])

  const getWinningCells = useCallback((): number[] => {
    if (!winner) return []

    for (const combination of WINNING_COMBINATIONS) {
      const [a, b, c] = combination
      if (board[a] === winner && board[b] === winner && board[c] === winner) {
        return combination
      }
    }
    return []
  }, [board, winner])

  const winningCells = getWinningCells()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 pt-16">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">⚡</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Erigga X and O</h1>
              <p className="text-muted-foreground">Classic strategy game with Erigga style</p>
            </div>
          </div>

          <Button asChild variant="outline">
            <Link href="/games">
              <Home className="h-4 w-4 mr-2" />
              Back to Games
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Game Board */}
          <div className="lg:col-span-2">
            <Tabs value={gameMode} onValueChange={(value) => setGameMode(value as GameMode)} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="local">Local Play</TabsTrigger>
                <TabsTrigger value="online">Online Multiplayer</TabsTrigger>
              </TabsList>

              <TabsContent value="online" className="mt-4">
                {!sessionCode ? (
                  <Card className="p-4">
                    <div className="space-y-4">
                      <div className="text-center">
                        <Button onClick={createOnlineGame} className="w-full mb-4">
                          Create New Game
                        </Button>
                        <p className="text-sm text-muted-foreground mb-4">or</p>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter game code"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            className="uppercase"
                          />
                          <Button onClick={joinOnlineGame}>Join</Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-4">
                    <div className="text-center space-y-2">
                      <p className="font-medium">Game Code:</p>
                      <div className="flex items-center justify-center gap-2">
                        <Badge variant="outline" className="text-lg px-4 py-2">
                          {sessionCode}
                        </Badge>
                        <Button size="sm" variant="outline" onClick={copySessionCode}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      {gameStatus === "waiting" && (
                        <p className="text-sm text-muted-foreground">Waiting for opponent to join...</p>
                      )}
                    </div>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            <Card className="p-6">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-xl">
                  {winner ? (
                    <div className="flex items-center justify-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        Player {winner} Wins!
                      </span>
                      {coinsEarned > 0 && (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          <Coins className="h-3 w-3 mr-1" />+{coinsEarned}
                        </Badge>
                      )}
                    </div>
                  ) : isDraw ? (
                    <div className="flex items-center justify-center gap-2">
                      <span>It's a Draw!</span>
                      {coinsEarned > 0 && (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          <Coins className="h-3 w-3 mr-1" />+{coinsEarned}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Users className="h-5 w-5" />
                      <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        Player {currentPlayer}'s Turn
                      </span>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-3 gap-2 max-w-md mx-auto mb-6">
                  {board.map((cell, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className={`
                        aspect-square text-4xl font-bold h-20 w-20 sm:h-24 sm:w-24 
                        transition-all duration-200 hover:scale-105
                        ${cell === "X" ? "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20" : ""}
                        ${cell === "O" ? "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20" : ""}
                        ${winningCells.includes(index) ? "ring-2 ring-yellow-400 bg-yellow-50 dark:bg-yellow-900/20" : ""}
                        ${!cell && !winner && !isDraw ? "hover:bg-muted/50" : ""}
                      `}
                      onClick={() => handleCellClick(index)}
                      disabled={!!cell || !!winner || isDraw}
                    >
                      {cell}
                    </Button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={resetGame} variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    New Game
                  </Button>
                  <Button onClick={resetScores} variant="outline">
                    Reset Scores
                  </Button>
                  {gameMode === "online" && sessionCode && (
                    <Button variant="outline" onClick={copySessionCode}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Code
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Online Game Info */}
            {gameMode === "online" && opponent && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    Opponent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{opponent.username?.charAt(0) || "P"}</span>
                    </div>
                    <div>
                      <p className="font-medium">{opponent.username}</p>
                      <div className="flex items-center gap-1">
                        <Crown className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs text-muted-foreground">
                          {opponent.tier?.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Scoreboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Scoreboard
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400">
                      X
                    </Badge>
                    <span>Player X</span>
                  </div>
                  <span className="font-bold text-lg">{scores.X}</span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400">
                      O
                    </Badge>
                    <span>Player O</span>
                  </div>
                  <span className="font-bold text-lg">{scores.O}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Draws</span>
                  <span className="font-bold text-lg">{scores.draws}</span>
                </div>
              </CardContent>
            </Card>

            {/* Coin Rewards */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  Coin Rewards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Win:</span>
                    <span className="font-medium text-yellow-600">+10 coins</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Draw:</span>
                    <span className="font-medium text-yellow-600">+5 coins</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Win Streak (3+):</span>
                    <span className="font-medium text-yellow-600">+5 bonus</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How to Play */}
            <Card>
              <CardHeader>
                <CardTitle>How to Play</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="space-y-2 text-sm">
                  <p>• Players take turns placing X's and O's</p>
                  <p>• Get 3 in a row to win (horizontal, vertical, or diagonal)</p>
                  <p>• Win games to earn Erigga coins</p>
                  <p>• Challenge friends online with game codes</p>
                </CardDescription>
              </CardContent>
            </Card>

            {/* Game Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Game Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Games:</span>
                    <span className="font-medium">{scores.X + scores.O + scores.draws}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>X Win Rate:</span>
                    <span className="font-medium">
                      {scores.X + scores.O + scores.draws > 0
                        ? `${Math.round((scores.X / (scores.X + scores.O + scores.draws)) * 100)}%`
                        : "0%"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>O Win Rate:</span>
                    <span className="font-medium">
                      {scores.X + scores.O + scores.draws > 0
                        ? `${Math.round((scores.O / (scores.X + scores.O + scores.draws)) * 100)}%`
                        : "0%"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Coins Earned:</span>
                    <span className="font-medium text-yellow-600">{(scores.X + scores.O) * 10 + scores.draws * 5}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
