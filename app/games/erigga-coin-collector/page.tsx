"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Home, Play, Pause, RotateCcw, Coins, Trophy, Target } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

interface Position {
  x: number
  y: number
}

interface Coin {
  id: number
  x: number
  y: number
  collected: boolean
}

interface Obstacle {
  id: number
  x: number
  y: number
  width: number
  height: number
}

export default function EriggaCoinCollectorPage() {
  const { user, profile } = useAuth()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>()

  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "gameOver">("menu")
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [lives, setLives] = useState(3)
  const [coinsCollected, setCoinsCollected] = useState(0)
  const [totalCoinsEarned, setTotalCoinsEarned] = useState(0)

  const [player, setPlayer] = useState<Position>({ x: 50, y: 300 })
  const [coins, setCoins] = useState<Coin[]>([])
  const [obstacles, setObstacles] = useState<Obstacle[]>([])
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({})

  const CANVAS_WIDTH = 800
  const CANVAS_HEIGHT = 400
  const PLAYER_SIZE = 20
  const COIN_SIZE = 15
  const PLAYER_SPEED = 5

  // Initialize game
  const initializeGame = useCallback(() => {
    setPlayer({ x: 50, y: CANVAS_HEIGHT / 2 })
    setScore(0)
    setLevel(1)
    setLives(3)
    setCoinsCollected(0)

    // Generate initial coins
    const initialCoins: Coin[] = []
    for (let i = 0; i < 10; i++) {
      initialCoins.push({
        id: i,
        x: Math.random() * (CANVAS_WIDTH - 100) + 100,
        y: Math.random() * (CANVAS_HEIGHT - 100) + 50,
        collected: false,
      })
    }
    setCoins(initialCoins)

    // Generate obstacles
    const initialObstacles: Obstacle[] = []
    for (let i = 0; i < 3; i++) {
      initialObstacles.push({
        id: i,
        x: Math.random() * (CANVAS_WIDTH - 200) + 200,
        y: Math.random() * (CANVAS_HEIGHT - 100) + 50,
        width: 40,
        height: 40,
      })
    }
    setObstacles(initialObstacles)
  }, [])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys((prev) => ({ ...prev, [e.key.toLowerCase()]: true }))
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys((prev) => ({ ...prev, [e.key.toLowerCase()]: false }))
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  // Update player position
  const updatePlayer = useCallback(() => {
    setPlayer((prev) => {
      let newX = prev.x
      let newY = prev.y

      if (keys["arrowleft"] || keys["a"]) newX = Math.max(0, prev.x - PLAYER_SPEED)
      if (keys["arrowright"] || keys["d"]) newX = Math.min(CANVAS_WIDTH - PLAYER_SIZE, prev.x + PLAYER_SPEED)
      if (keys["arrowup"] || keys["w"]) newY = Math.max(0, prev.y - PLAYER_SPEED)
      if (keys["arrowdown"] || keys["s"]) newY = Math.min(CANVAS_HEIGHT - PLAYER_SIZE, prev.y + PLAYER_SPEED)

      return { x: newX, y: newY }
    })
  }, [keys])

  // Check collisions
  const checkCollisions = useCallback(() => {
    // Check coin collection
    setCoins((prev) => {
      const newCoins = prev.map((coin) => {
        if (
          !coin.collected &&
          player.x < coin.x + COIN_SIZE &&
          player.x + PLAYER_SIZE > coin.x &&
          player.y < coin.y + COIN_SIZE &&
          player.y + PLAYER_SIZE > coin.y
        ) {
          setScore((s) => s + 10)
          setCoinsCollected((c) => c + 1)
          return { ...coin, collected: true }
        }
        return coin
      })

      return newCoins
    })

    // Check obstacle collision
    obstacles.forEach((obstacle) => {
      if (
        player.x < obstacle.x + obstacle.width &&
        player.x + PLAYER_SIZE > obstacle.x &&
        player.y < obstacle.y + obstacle.height &&
        player.y + PLAYER_SIZE > obstacle.y
      ) {
        setLives((prev) => {
          const newLives = prev - 1
          if (newLives <= 0) {
            setGameState("gameOver")
            const coinsEarned = Math.floor(score / 100)
            setTotalCoinsEarned(coinsEarned)
            if (score > highScore) {
              setHighScore(score)
            }
            if (coinsEarned > 0) {
              toast.success(`Game Over! You earned ${coinsEarned} Erigga coins!`)
            }
          } else {
            toast.warning(`Hit obstacle! ${newLives} lives remaining`)
          }
          return newLives
        })

        // Reset player position
        setPlayer({ x: 50, y: CANVAS_HEIGHT / 2 })
      }
    })
  }, [player, obstacles, score, highScore])

  // Game loop
  const gameLoop = useCallback(() => {
    if (gameState === "playing") {
      updatePlayer()
      checkCollisions()

      // Check if all coins collected
      const allCoinsCollected = coins.every((coin) => coin.collected)
      if (allCoinsCollected) {
        setLevel((prev) => prev + 1)
        // Generate new coins for next level
        const newCoins: Coin[] = []
        for (let i = 0; i < 10 + level; i++) {
          newCoins.push({
            id: Date.now() + i,
            x: Math.random() * (CANVAS_WIDTH - 100) + 100,
            y: Math.random() * (CANVAS_HEIGHT - 100) + 50,
            collected: false,
          })
        }
        setCoins(newCoins)
        toast.success(`Level ${level + 1}! More coins to collect!`)
      }
    }
  }, [gameState, updatePlayer, checkCollisions, coins, level])

  // Start game loop
  useEffect(() => {
    if (gameState === "playing") {
      gameLoopRef.current = requestAnimationFrame(function animate() {
        gameLoop()
        gameLoopRef.current = requestAnimationFrame(animate)
      })
    } else {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [gameState, gameLoop])

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = "#1a1a2e"
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw background pattern
    ctx.strokeStyle = "#16213e"
    ctx.lineWidth = 1
    for (let i = 0; i < CANVAS_WIDTH; i += 40) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, CANVAS_HEIGHT)
      ctx.stroke()
    }
    for (let i = 0; i < CANVAS_HEIGHT; i += 40) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(CANVAS_WIDTH, i)
      ctx.stroke()
    }

    if (gameState === "playing" || gameState === "paused") {
      // Draw coins
      coins.forEach((coin) => {
        if (!coin.collected) {
          ctx.fillStyle = "#ffd700"
          ctx.beginPath()
          ctx.arc(coin.x + COIN_SIZE / 2, coin.y + COIN_SIZE / 2, COIN_SIZE / 2, 0, Math.PI * 2)
          ctx.fill()

          // Add shine effect
          ctx.fillStyle = "#ffff99"
          ctx.beginPath()
          ctx.arc(coin.x + COIN_SIZE / 2 - 3, coin.y + COIN_SIZE / 2 - 3, 3, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      // Draw obstacles
      obstacles.forEach((obstacle) => {
        ctx.fillStyle = "#ff4444"
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)

        // Add border
        ctx.strokeStyle = "#cc0000"
        ctx.lineWidth = 2
        ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)
      })

      // Draw player
      ctx.fillStyle = "#00ff88"
      ctx.fillRect(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE)

      // Add player border
      ctx.strokeStyle = "#00cc66"
      ctx.lineWidth = 2
      ctx.strokeRect(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE)
    }

    // Draw pause overlay
    if (gameState === "paused") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      ctx.fillStyle = "#ffffff"
      ctx.font = "48px Arial"
      ctx.textAlign = "center"
      ctx.fillText("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
    }

    // Draw game over screen
    if (gameState === "gameOver") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      ctx.fillStyle = "#ff4444"
      ctx.font = "48px Arial"
      ctx.textAlign = "center"
      ctx.fillText("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40)

      ctx.fillStyle = "#ffffff"
      ctx.font = "24px Arial"
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20)
      ctx.fillText(`Coins Earned: ${totalCoinsEarned}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60)
    }
  }, [gameState, player, coins, obstacles, score, totalCoinsEarned])

  const startGame = () => {
    initializeGame()
    setGameState("playing")
  }

  const pauseGame = () => {
    setGameState(gameState === "paused" ? "playing" : "paused")
  }

  const resetGame = () => {
    setGameState("menu")
    initializeGame()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 pt-16">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Coins className="text-white h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Erigga Coin Collector</h1>
              <p className="text-muted-foreground">Collect coins and avoid obstacles</p>
            </div>
          </div>

          <Button asChild variant="outline">
            <Link href="/games">
              <Home className="h-4 w-4 mr-2" />
              Back to Games
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Game Canvas */}
          <div className="lg:col-span-3">
            <Card className="p-6">
              <div className="text-center mb-4">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  className="border-2 border-muted rounded-lg max-w-full h-auto"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>

              {/* Game Controls */}
              <div className="flex flex-wrap justify-center gap-3">
                {gameState === "menu" && (
                  <Button onClick={startGame} className="bg-gradient-to-r from-green-600 to-blue-600">
                    <Play className="h-4 w-4 mr-2" />
                    Start Game
                  </Button>
                )}

                {(gameState === "playing" || gameState === "paused") && (
                  <>
                    <Button onClick={pauseGame} variant="outline">
                      <Pause className="h-4 w-4 mr-2" />
                      {gameState === "paused" ? "Resume" : "Pause"}
                    </Button>
                    <Button onClick={resetGame} variant="outline">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </>
                )}

                {gameState === "gameOver" && (
                  <Button onClick={startGame} className="bg-gradient-to-r from-green-600 to-blue-600">
                    <Play className="h-4 w-4 mr-2" />
                    Play Again
                  </Button>
                )}
              </div>

              {/* Controls Instructions */}
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Use Arrow Keys or WASD to move • Collect golden coins • Avoid red obstacles
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Game Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Game Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Score:</span>
                  <Badge variant="outline" className="font-bold">
                    {score.toLocaleString()}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>High Score:</span>
                  <Badge variant="outline" className="font-bold text-yellow-600">
                    {highScore.toLocaleString()}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Level:</span>
                  <Badge variant="outline" className="font-bold text-blue-600">
                    {level}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Lives:</span>
                  <div className="flex gap-1">
                    {Array.from({ length: 3 }, (_, i) => (
                      <div key={i} className={`w-3 h-3 rounded-full ${i < lives ? "bg-red-500" : "bg-gray-300"}`} />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Coins Collected:</span>
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    <Coins className="h-3 w-3 mr-1" />
                    {coinsCollected}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Rewards */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  Rewards
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Per Coin:</span>
                  <span className="font-medium">10 points</span>
                </div>
                <div className="flex justify-between">
                  <span>Level Bonus:</span>
                  <span className="font-medium">50 points</span>
                </div>
                <div className="flex justify-between">
                  <span>Erigga Coins:</span>
                  <span className="font-medium text-yellow-600">1 per 100 points</span>
                </div>
                {totalCoinsEarned > 0 && (
                  <div className="pt-2 border-t">
                    <div className="flex justify-between font-bold">
                      <span>Total Earned:</span>
                      <span className="text-yellow-600">{totalCoinsEarned} coins</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* How to Play */}
            <Card>
              <CardHeader>
                <CardTitle>How to Play</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>• Move with Arrow Keys or WASD</p>
                <p>• Collect golden coins for points</p>
                <p>• Avoid red obstacles (lose a life)</p>
                <p>• Complete levels to progress</p>
                <p>• Earn Erigga coins based on score</p>
              </CardContent>
            </Card>

            {/* Leaderboard Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-500" />
                  Your Best
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Best Score:</span>
                    <span className="font-medium">{highScore.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Coins Earned:</span>
                    <span className="font-medium text-yellow-600">{Math.floor(highScore / 100)}</span>
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
