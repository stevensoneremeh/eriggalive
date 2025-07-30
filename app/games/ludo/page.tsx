"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Plus, Play, ArrowLeft, Clock } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { LudoGame } from "@/components/games/ludo-game"
import { createClient } from "@/lib/supabase/client"

interface GameRoom {
  id: string
  name: string
  host: string
  players: number
  maxPlayers: number
  status: "waiting" | "playing" | "finished"
  created_at: string
}

export default function LudoPage() {
  const [gameRooms, setGameRooms] = useState<GameRoom[]>([])
  const [currentGame, setCurrentGame] = useState<string | null>(null)
  const [roomName, setRoomName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { isAuthenticated, profile } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    loadGameRooms()
  }, [isAuthenticated, router])

  const loadGameRooms = async () => {
    try {
      // Mock data for now - in production, this would fetch from Supabase
      const mockRooms: GameRoom[] = [
        {
          id: "1",
          name: "Erigga Fans Room",
          host: "player1",
          players: 2,
          maxPlayers: 4,
          status: "waiting",
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Quick Game",
          host: "player2",
          players: 3,
          maxPlayers: 4,
          status: "waiting",
          created_at: new Date().toISOString(),
        },
      ]
      setGameRooms(mockRooms)
    } catch (error) {
      console.error("Error loading game rooms:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const createRoom = async () => {
    if (!roomName.trim() || !profile) return

    setIsCreating(true)
    try {
      // Mock room creation - in production, this would create in Supabase
      const newRoom: GameRoom = {
        id: Date.now().toString(),
        name: roomName.trim(),
        host: profile.username,
        players: 1,
        maxPlayers: 4,
        status: "waiting",
        created_at: new Date().toISOString(),
      }

      setGameRooms((prev) => [newRoom, ...prev])
      setRoomName("")
      setCurrentGame(newRoom.id)
    } catch (error) {
      console.error("Error creating room:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const joinRoom = (roomId: string) => {
    setCurrentGame(roomId)
  }

  const leaveGame = () => {
    setCurrentGame(null)
  }

  if (!isAuthenticated) {
    return null
  }

  if (currentGame) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-4">
            <Button variant="outline" onClick={leaveGame}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Leave Game
            </Button>
          </div>
          <LudoGame roomId={currentGame} onLeave={leaveGame} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button variant="outline" onClick={() => router.push("/games")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Games
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Ludo</h1>
            <p className="text-muted-foreground">Classic board game for 2-4 players</p>
          </div>
        </div>

        <Tabs defaultValue="rooms" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rooms">Game Rooms</TabsTrigger>
            <TabsTrigger value="create">Create Room</TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Available Rooms</h2>
              <Button onClick={loadGameRooms} variant="outline">
                Refresh
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded mb-4 w-2/3"></div>
                      <div className="h-8 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : gameRooms.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No active rooms</h3>
                  <p className="text-muted-foreground mb-4">
                    Be the first to create a game room and invite other players!
                  </p>
                  <Button onClick={() => document.querySelector('[value="create"]')?.click()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Room
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gameRooms.map((room) => (
                  <Card key={room.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{room.name}</CardTitle>
                        <Badge variant={room.status === "waiting" ? "default" : "secondary"}>{room.status}</Badge>
                      </div>
                      <CardDescription>Hosted by {room.host}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="h-4 w-4 mr-1" />
                          {room.players}/{room.maxPlayers} players
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(room.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => joinRoom(room.id)}
                        disabled={room.players >= room.maxPlayers || room.status !== "waiting"}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {room.players >= room.maxPlayers ? "Room Full" : "Join Game"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create New Game Room</CardTitle>
                <CardDescription>Set up a new Ludo game and invite other players to join.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roomName">Room Name</Label>
                  <Input
                    id="roomName"
                    placeholder="Enter room name..."
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    maxLength={50}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Game Settings</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">Max Players</span>
                      <Badge>4</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">Game Mode</span>
                      <Badge>Classic</Badge>
                    </div>
                  </div>
                </div>

                <Button onClick={createRoom} disabled={!roomName.trim() || isCreating} className="w-full">
                  {isCreating ? (
                    "Creating..."
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Room
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
