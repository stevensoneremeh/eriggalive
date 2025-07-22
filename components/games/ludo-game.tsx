'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Trophy, Coins } from 'lucide-react'

interface Player {
  id: string
  name: string
  color: string
  pieces: number[]
  isAI?: boolean
}

interface GameState {
  players: Player[]
  currentPlayer: number
  diceValue: number
  gameStatus: 'waiting' | 'playing' | 'finished'
  winner?: string
  lastRoll?: number
}

const DICE_ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6]

const initialPlayers: Player[] = [
  { id: '1', name: 'You', color: 'bg-red-500', pieces: [0, 0, 0, 0] },
  { id: '2', name: 'AI Player', color: 'bg-blue-500', pieces: [0, 0, 0, 0], isAI: true }
]

export default function LudoGame() {
  const [gameState, setGameState] = useState<GameState>({
    players: initialPlayers,
    currentPlayer: 0,
    diceValue: 1,
    gameStatus: 'waiting',
    lastRoll: undefined
  })
  const [isRolling, setIsRolling] = useState(false)
  const [coins, setCoins] = useState(1000) // Mock coin balance

  const rollDice = useCallback(() => {
    if (isRolling || gameState.gameStatus !== 'playing') return

    setIsRolling(true)
    
    // Simulate dice rolling animation
    let rollCount = 0
    const rollInterval = setInterval(() => {
      const randomValue = Math.floor(Math.random() * 6) + 1
      setGameState(prev => ({ ...prev, diceValue: randomValue }))
      rollCount++
      
      if (rollCount >= 10) {
        clearInterval(rollInterval)
        const finalValue = Math.floor(Math.random() * 6) + 1
        
        setGameState(prev => ({
          ...prev,
          diceValue: finalValue,
          lastRoll: finalValue,
          currentPlayer: (prev.currentPlayer + 1) % prev.players.length
        }))
        
        setIsRolling(false)
        
        // Simulate AI turn after player
        if (gameState.currentPlayer === 0) {
          setTimeout(() => {
            if (Math.random() > 0.3) { // 70% chance AI makes a move
              simulateAITurn()
            }
          }, 1500)
        }
      }
    }, 100)
  }, [isRolling, gameState.gameStatus, gameState.currentPlayer])

  const simulateAITurn = () => {
    setIsRolling(true)
    
    setTimeout(() => {
      const aiRoll = Math.floor(Math.random() * 6) + 1
      setGameState(prev => ({
        ...prev,
        diceValue: aiRoll,
        lastRoll: aiRoll,
        currentPlayer: 0 // Back to player
      }))
      setIsRolling(false)
    }, 1000)
  }

  const startGame = (mode: 'ai' | 'multiplayer') => {
    setGameState(prev => ({
      ...prev,
      gameStatus: 'playing',
      currentPlayer: 0
    }))
  }

  const endGame = (winner: string) => {
    setGameState(prev => ({
      ...prev,
      gameStatus: 'finished',
      winner
    }))
    
    // Award coins for winning
    if (winner === 'You') {
      const reward = 50 // AI mode reward
      setCoins(prev => prev + reward)
    }
  }

  const resetGame = () => {
    setGameState({
      players: initialPlayers,
      currentPlayer: 0,
      diceValue: 1,
      gameStatus: 'waiting',
      lastRoll: undefined
    })
  }

  const DiceIcon = DICE_ICONS[gameState.diceValue - 1]
  const currentPlayerData = gameState.players[gameState.currentPlayer]

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Trophy className="h-6 w-6 mr-2" />
              Ludo Game
            </CardTitle>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="flex items-center">
                <Coins className="h-4 w-4 mr-1" />
                {coins.toLocaleString()} coins
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {gameState.gameStatus === 'waiting' && (
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Choose Game Mode</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                  <Button 
                    onClick={() => startGame('ai')}
                    className="h-20 flex flex-col"
                  >
                    <span className="font-semibold">vs AI</span>
                    <span className="text-sm opacity-80">Win 50 coins</span>
                  </Button>
                  <Button 
                    onClick={() => startGame('multiplayer')}
                    variant="outline"
                    className="h-20 flex flex-col"
                  >
                    <span className="font-semibold">Multiplayer</span>
                    <span className="text-sm opacity-80">Win 100 coins</span>
                  </Button>
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-lg max-w-md mx-auto">
                <h4 className="font-semibold mb-2">How to Play</h4>
                <ul className="text-sm space-y-1 text-left">
                  <li>• Roll the dice to move your pieces</li>
                  <li>• Get all 4 pieces to the center to win</li>
                  <li>• Roll a 6 to get an extra turn</li>
                  <li>• Land on opponents to send them back</li>
                </ul>
              </div>
            </div>
          )}

          {gameState.gameStatus === 'playing' && (
            <div className="space-y-6">
              {/* Game Board Placeholder */}
              <div className="aspect-square max-w-md mx-auto bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-lg border-4 border-green-500 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎲</div>
                  <p className="text-lg font-semibold">Ludo Board</p>
                  <p className="text-sm text-muted-foreground">Game in progress...</p>
                </div>
              </div>

              {/* Current Player & Dice */}
              <div className="text-center space-y-4">
                <div>
                  <p className="text-lg font-semibold">
                    Current Turn: <span className={`px-2 py-1 rounded text-white ${currentPlayerData.color}`}>
                      {currentPlayerData.name}
                    </span>
                  </p>
                </div>

                <div className="flex items-center justify-center space-x-4">
                  <Button
                    onClick={rollDice}
                    disabled={isRolling || (gameState.currentPlayer === 1 && currentPlayerData.isAI)}
                    size="lg"
                    className="flex items-center space-x-2"
                  >
                    <DiceIcon className={`h-8 w-8 ${isRolling ? 'animate-spin' : ''}`} />
                    <span>{isRolling ? 'Rolling...' : 'Roll Dice'}</span>
                  </Button>
                </div>

                {gameState.lastRoll && (
                  <p className="text-sm text-muted-foreground">
                    Last roll: {gameState.lastRoll}
                  </p>
                )}
              </div>

              {/* Players Status */}
              <div className="grid grid-cols-2 gap-4">
                {gameState.players.map((player, index) => (
                  <Card key={player.id} className={`${index === gameState.currentPlayer ? 'ring-2 ring-primary' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className={`w-4 h-4 rounded-full ${player.color}`} />
                        <span className="font-semibold">{player.name}</span>
                        {player.isAI && <Badge variant="secondary" className="text-xs">AI</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Pieces in play: {player.pieces.filter(p => p > 0).length}/4
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-center space-x-2">
                <Button variant="outline" onClick={resetGame}>
                  New Game
                </Button>
                <Button variant="outline" onClick={() => endGame('You')}>
                  End Game (Test)
                </Button>
              </div>
            </div>
          )}

          {gameState.gameStatus === 'finished' && (
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <Trophy className="h-16 w-16 mx-auto text-yellow-500" />
                <h3 className="text-2xl font-bold">
                  {gameState.winner === 'You' ? '🎉 You Won!' : '😔 You Lost!'}
                </h3>
                {gameState.winner === 'You' && (
                  <div className="flex items-center justify-center space-x-2">
                    <Coins className="h-5 w-5 text-yellow-500" />
                    <span className="text-lg font-semibold">+50 coins earned!</span>
                  </div>
                )}
              </div>
              
              <div className="space-x-4">
                <Button onClick={resetGame}>
                  Play Again
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Back to Games
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
