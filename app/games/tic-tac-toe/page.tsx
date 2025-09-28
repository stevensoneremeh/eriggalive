"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RotateCcw, Home, Trophy, Users } from "lucide-react"
import Link from "next/link"

type Player = "X" | "O" | null
type Board = Player[]

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

export default function TicTacToePage() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null))
  const [currentPlayer, setCurrentPlayer] = useState<"X" | "O">("X")
  const [winner, setWinner] = useState<Player>(null)
  const [isDraw, setIsDraw] = useState(false)
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 })

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
        setScores((prev) => ({
          ...prev,
          [gameWinner]: prev[gameWinner] + 1,
        }))
      } else if (gameDraw) {
        setIsDraw(true)
        setScores((prev) => ({
          ...prev,
          draws: prev.draws + 1,
        }))
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
  }, [])

  const resetScores = useCallback(() => {
    setScores({ X: 0, O: 0, draws: 0 })
    resetGame()
  }, [resetGame])

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">⚡</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Tic Tac Toe</h1>
              <p className="text-muted-foreground">Classic 3x3 strategy game</p>
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
            <Card className="p-6">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-xl">
                  {winner ? (
                    <div className="flex items-center justify-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      Player {winner} Wins!
                    </div>
                  ) : isDraw ? (
                    "It's a Draw!"
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Users className="h-5 w-5" />
                      Player {currentPlayer}'s Turn
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
                        ${cell === "X" ? "text-blue-600 bg-blue-50 border-blue-200" : ""}
                        ${cell === "O" ? "text-red-600 bg-red-50 border-red-200" : ""}
                        ${winningCells.includes(index) ? "ring-2 ring-yellow-400 bg-yellow-50" : ""}
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
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">X</Badge>
                    <span>Player X</span>
                  </div>
                  <span className="font-bold text-lg">{scores.X}</span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-800 border-red-200">O</Badge>
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

            {/* How to Play */}
            <Card>
              <CardHeader>
                <CardTitle>How to Play</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="space-y-2 text-sm">
                  <p>• Players take turns placing X's and O's</p>
                  <p>• Get 3 in a row to win (horizontal, vertical, or diagonal)</p>
                  <p>• If all squares are filled with no winner, it's a draw</p>
                  <p>• Click "New Game" to play again</p>
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
