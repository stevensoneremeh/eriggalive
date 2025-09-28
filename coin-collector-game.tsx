"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Play, RotateCcw } from "lucide-react"

interface Player {
  x: number
  y: number
  width: number
  height: number
  velocityY: number
  onGround: boolean
}

interface Coin {
  id: number
  x: number
  y: number
  size: number
  collected: boolean
  type: "normal" | "bonus" | "mega"
  value: number
  color: string
}

interface Platform {
  x: number
  y: number
  width: number
  height: number
}

interface CoinCollectorGameProps {
  onBack: () => void
  themeColor: string
}

export default function CoinCollectorGame({ onBack, themeColor }: CoinCollectorGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const keysRef = useRef<Set<string>>(new Set())
  const playerImageRef = useRef<HTMLImageElement | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  const [gameState, setGameState] = useState<"menu" | "playing" | "gameOver">("menu")
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(90)
  const [coinsCollected, setCoinsCollected] = useState(0)
  const [level, setLevel] = useState(1)

  const [player, setPlayer] = useState<Player>({
    x: 100,
    y: 400,
    width: 40, // Increased size for better visibility of custom image
    height: 40,
    velocityY: 0,
    onGround: false,
  })

  const [coins, setCoins] = useState<Coin[]>([])
  const [platforms] = useState<Platform[]>([
    { x: 0, y: 450, width: 800, height: 20 }, // Ground
    { x: 200, y: 350, width: 150, height: 20 },
    { x: 450, y: 280, width: 120, height: 20 },
    { x: 650, y: 200, width: 100, height: 20 },
    { x: 100, y: 200, width: 80, height: 20 },
    { x: 350, y: 150, width: 100, height: 20 },
  ])

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      playerImageRef.current = img
      setImageLoaded(true)
      console.log("[v0] Player image loaded successfully")
    }
    img.onerror = () => {
      console.log("[v0] Player image failed to load, using fallback")
      setImageLoaded(false)
    }
    img.src = "/images/player-character.jpg"
  }, [])

  // Load best score
  useEffect(() => {
    const saved = localStorage.getItem("coin-collector-best-score")
    if (saved) setBestScore(Number.parseInt(saved))
  }, [])

  // Save best score
  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score)
      localStorage.setItem("coin-collector-best-score", score.toString())
    }
  }, [score, bestScore])

  // Generate coins
  const generateCoins = useCallback(() => {
    const newCoins: Coin[] = []
    const coinTypes = [
      { type: "normal" as const, value: 10, color: "#ffd700", probability: 0.7 },
      { type: "bonus" as const, value: 25, color: "#ff6b35", probability: 0.25 },
      { type: "mega" as const, value: 50, color: "#8b5cf6", probability: 0.05 },
    ]

    platforms.forEach((platform, index) => {
      if (index === 0) return // Skip ground platform

      const numCoins = Math.floor(Math.random() * 3) + 1
      for (let i = 0; i < numCoins; i++) {
        const rand = Math.random()
        let coinType = coinTypes[0]

        for (const type of coinTypes) {
          if (rand < type.probability) {
            coinType = type
            break
          }
        }

        newCoins.push({
          id: Math.random(),
          x: platform.x + (platform.width / (numCoins + 1)) * (i + 1),
          y: platform.y - 30,
          size: coinType.type === "mega" ? 20 : coinType.type === "bonus" ? 16 : 12,
          collected: false,
          type: coinType.type,
          value: coinType.value,
          color: coinType.color,
        })
      }
    })

    setCoins(newCoins)
  }, [platforms])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase())
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase())
    }

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const touch = e.touches[0]
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top

      // Left half = move left, right half = move right, tap to jump
      if (x < canvas.width / 2) {
        keysRef.current.add("a")
      } else {
        keysRef.current.add("d")
      }

      // Any touch triggers jump
      keysRef.current.add(" ")
    }

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      keysRef.current.clear()
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    const canvas = canvasRef.current
    if (canvas) {
      canvas.addEventListener("touchstart", handleTouchStart, { passive: false })
      canvas.addEventListener("touchend", handleTouchEnd, { passive: false })
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      if (canvas) {
        canvas.removeEventListener("touchstart", handleTouchStart)
        canvas.removeEventListener("touchend", handleTouchEnd)
      }
    }
  }, [])

  // Game timer
  useEffect(() => {
    if (gameState === "playing" && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && gameState === "playing") {
      setGameState("gameOver")
    }
  }, [gameState, timeLeft])

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return

    const gameLoop = () => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext("2d")
      if (!canvas || !ctx) return

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update player
      setPlayer((prevPlayer) => {
        const newPlayer = { ...prevPlayer }

        // Horizontal movement
        if (keysRef.current.has("a") || keysRef.current.has("arrowleft")) {
          newPlayer.x = Math.max(0, newPlayer.x - 5)
        }
        if (keysRef.current.has("d") || keysRef.current.has("arrowright")) {
          newPlayer.x = Math.min(canvas.width - newPlayer.width, newPlayer.x + 5)
        }

        // Jumping
        if (
          (keysRef.current.has(" ") || keysRef.current.has("w") || keysRef.current.has("arrowup")) &&
          newPlayer.onGround
        ) {
          newPlayer.velocityY = -12
          newPlayer.onGround = false
        }

        // Apply gravity
        newPlayer.velocityY += 0.5
        newPlayer.y += newPlayer.velocityY

        // Platform collision
        newPlayer.onGround = false
        platforms.forEach((platform) => {
          if (
            newPlayer.x < platform.x + platform.width &&
            newPlayer.x + newPlayer.width > platform.x &&
            newPlayer.y + newPlayer.height > platform.y &&
            newPlayer.y + newPlayer.height < platform.y + platform.height + 10 &&
            newPlayer.velocityY >= 0
          ) {
            newPlayer.y = platform.y - newPlayer.height
            newPlayer.velocityY = 0
            newPlayer.onGround = true
          }
        })

        return newPlayer
      })

      // Draw platforms
      ctx.fillStyle = "#4a5568"
      platforms.forEach((platform) => {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
      })

      if (imageLoaded && playerImageRef.current) {
        // Draw circular avatar with border
        ctx.save()

        // Create circular clipping path
        ctx.beginPath()
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width / 2 - 2, 0, Math.PI * 2)
        ctx.clip()

        // Draw the image
        ctx.drawImage(playerImageRef.current, player.x + 2, player.y + 2, player.width - 4, player.height - 4)

        ctx.restore()

        // Draw border
        ctx.strokeStyle = themeColor
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width / 2, 0, Math.PI * 2)
        ctx.stroke()
      } else {
        // Fallback: Draw simple rectangle player
        ctx.fillStyle = themeColor
        ctx.fillRect(player.x, player.y, player.width, player.height)

        // Add simple player face
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(player.x + 10, player.y + 10, 6, 6) // Left eye
        ctx.fillRect(player.x + 24, player.y + 10, 6, 6) // Right eye
        ctx.fillRect(player.x + 12, player.y + 24, 16, 3) // Mouth
      }

      // Check coin collection and draw coins
      setCoins((prevCoins) => {
        return prevCoins.map((coin) => {
          if (
            !coin.collected &&
            player.x < coin.x + coin.size &&
            player.x + player.width > coin.x &&
            player.y < coin.y + coin.size &&
            player.y + player.height > coin.y
          ) {
            setScore((prev) => prev + coin.value)
            setCoinsCollected((prev) => prev + 1)
            return { ...coin, collected: true }
          }
          return coin
        })
      })

      // Draw coins
      coins.forEach((coin) => {
        if (!coin.collected) {
          // Coin glow effect
          const gradient = ctx.createRadialGradient(
            coin.x + coin.size / 2,
            coin.y + coin.size / 2,
            0,
            coin.x + coin.size / 2,
            coin.y + coin.size / 2,
            coin.size,
          )
          gradient.addColorStop(0, coin.color)
          gradient.addColorStop(1, coin.color + "40")

          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(coin.x + coin.size / 2, coin.y + coin.size / 2, coin.size, 0, Math.PI * 2)
          ctx.fill()

          // Coin shine
          ctx.fillStyle = "#ffffff80"
          ctx.beginPath()
          ctx.arc(
            coin.x + coin.size / 2 - coin.size / 4,
            coin.y + coin.size / 2 - coin.size / 4,
            coin.size / 3,
            0,
            Math.PI * 2,
          )
          ctx.fill()

          // Coin value text for bonus/mega coins
          if (coin.type !== "normal") {
            ctx.fillStyle = "#ffffff"
            ctx.font = "bold 10px Arial"
            ctx.textAlign = "center"
            ctx.fillText(coin.value.toString(), coin.x + coin.size / 2, coin.y + coin.size / 2 + 3)
          }
        }
      })

      // Level progression
      if (coinsCollected > 0 && coinsCollected % 10 === 0 && coinsCollected / 10 > level - 1) {
        setLevel((prev) => prev + 1)
        generateCoins() // Generate new coins
      }

      animationRef.current = requestAnimationFrame(gameLoop)
    }

    animationRef.current = requestAnimationFrame(gameLoop)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameState, player, coins, coinsCollected, level, themeColor, platforms, generateCoins, imageLoaded])

  const startGame = () => {
    setGameState("playing")
    setScore(0)
    setTimeLeft(90)
    setCoinsCollected(0)
    setLevel(1)
    setPlayer({
      x: 100,
      y: 400,
      width: 40,
      height: 40,
      velocityY: 0,
      onGround: false,
    })
    generateCoins()
  }

  const resetGame = () => {
    setGameState("menu")
    setCoins([])
  }

  if (gameState === "menu") {
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center p-4"
        style={{ backgroundColor: "#f0f9ff" }}
      >
        <Button
          onClick={onBack}
          variant="outline"
          size="sm"
          className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm hover:bg-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="w-full max-w-md">
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="mb-6">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: themeColor }}
              >
                <span className="text-2xl">🪙</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Coin Collector</h1>
              <p className="text-gray-600 text-sm sm:text-base">Jump and collect coins before time runs out!</p>
            </div>

            <div className="space-y-3 text-sm text-gray-600 mb-6">
              <div className="flex items-center justify-between">
                <span>🟡 Normal Coin</span>
                <span>10 points</span>
              </div>
              <div className="flex items-center justify-between">
                <span>🟠 Bonus Coin</span>
                <span>25 points</span>
              </div>
              <div className="flex items-center justify-between">
                <span>🟣 Mega Coin</span>
                <span>50 points</span>
              </div>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg text-sm">
              <p className="font-semibold mb-2">Controls:</p>
              <div className="space-y-1">
                <p className="hidden sm:block">A/D or Arrow Keys - Move</p>
                <p className="hidden sm:block">W/Space/Up Arrow - Jump</p>
                <p className="sm:hidden">Tap left/right side to move</p>
                <p className="sm:hidden">Tap anywhere to jump</p>
              </div>
            </div>

            {bestScore > 0 && (
              <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Best Score</p>
                <p className="text-xl sm:text-2xl font-bold" style={{ color: themeColor }}>
                  {bestScore.toLocaleString()}
                </p>
              </div>
            )}

            <Button onClick={startGame} className="w-full" style={{ backgroundColor: themeColor }}>
              <Play className="w-4 h-4 mr-2" />
              Start Game
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (gameState === "gameOver") {
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center p-4"
        style={{ backgroundColor: "#f0f9ff" }}
      >
        <Card className="w-full max-w-md">
          <CardContent className="p-6 sm:p-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Time's Up!</h1>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Final Score</p>
                <p className="text-2xl sm:text-3xl font-bold" style={{ color: themeColor }}>
                  {score.toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600">Coins Collected</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">{coinsCollected}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600">Level Reached</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">{level}</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Best Score</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{bestScore.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={startGame} className="flex-1" style={{ backgroundColor: themeColor }}>
                <Play className="w-4 h-4 mr-2" />
                Play Again
              </Button>
              <Button onClick={resetGame} variant="outline" className="flex-1 bg-transparent">
                <RotateCcw className="w-4 h-4 mr-2" />
                Menu
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
    >
      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-10 flex justify-between items-start gap-2">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 sm:p-3 min-w-[80px] sm:min-w-[120px]">
          <div className="text-xs text-gray-600">Score</div>
          <div className="text-lg sm:text-xl font-bold text-gray-900">{score.toLocaleString()}</div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 sm:p-3 min-w-[60px] sm:min-w-[80px] text-center">
          <div className="text-xs text-gray-600">Time</div>
          <div className="text-lg sm:text-xl font-bold text-gray-900">{timeLeft}s</div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 sm:p-3 min-w-[70px] sm:min-w-[100px] text-center">
          <div className="text-xs text-gray-600">Level</div>
          <div className="text-lg sm:text-xl font-bold" style={{ color: themeColor }}>
            {level}
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 sm:p-3 min-w-[70px] sm:min-w-[100px] text-center">
          <div className="text-xs text-gray-600">Coins</div>
          <div className="text-lg sm:text-xl font-bold text-yellow-600">{coinsCollected}</div>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-sky-200 rounded-lg shadow-lg touch-none"
        style={{
          maxWidth: "95vw",
          maxHeight: "60vh",
          minHeight: "300px",
        }}
      />

      <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 px-2">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 text-center">
          <span className="hidden sm:inline">Use A/D or Arrow Keys to move, W/Space/Up to jump</span>
          <span className="sm:hidden">Tap left/right to move, anywhere to jump</span>
        </div>
      </div>
    </div>
  )
}
