"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { Gamepad2, Users, Coins, Plus, Play, Trophy, Clock, Star, Loader2 } from "lucide-react"
import Link from "next/link"

interface GameRoom {
  id: string
  name: string
  created_by: string
  creator_username: string
  entry_fee: number
  prize_pool: number
  max_players: number
  current_players: number
  status: "waiting" | "playing" | "finished"
  created_at: string
}

const mockGameRooms: GameRoom[] = [
  {
    id: "1",
    name: "Quick Match",
    created_by: "user1",
    creator_username: "EriggaFan123",
    entry_fee: 50,
    prize_pool: 200,
    max_players: 4,
    current_players: 2,
    status: "waiting",
    created_at: "2024-01-20T10:00:00Z",
  },
  {
    id: "2",
    name: "High Stakes",
    created_by: "user2",
    creator_username: "LudoMaster",
    entry_fee: 100,
    prize_pool: 400,
    max_players: 4,
    current_players: 3,
    status: "waiting",
    created_at: "2024-01-20T09:30:00Z",
  },
  {
    id: "3",
    name: "Beginner Friendly",
    created_by: "user3",
    creator_username: "NewPlayer",
    entry_fee: 25,
    prize_pool: 100,
    max_players: 4,
    current_players: 1,
    status: "waiting",
    created_at: "2024-01-20T11:00:00Z",
  },
]

export default function GamesPage() {
  const { user, profile, isAuthenticated } = useAuth()
  const [gameRooms, setGameRooms] = useState<GameRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [createRoomOpen, setCreateRoomOpen] = useState(false)
  const [roomName, setRoomName] = useState("")
  const [entryFee, setEntryFee] = useState(50)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    // Simulate loading game rooms
    const timer = setTimeout(() => {
      setGameRooms(mockGameRooms)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handleCreateRoom = async () => {
    if (!isAuthenticated || !profile) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a game room",
        variant: "destructive",
      })
      return
    }

    if (!roomName.trim()) {
      toast({
        title: "Room Name Required",
        description: "Please enter a name for your game room",
        variant: "destructive",
      })
      return
    }

    if (profile.coins_balance < entryFee) {
      toast({
        title: "Insufficient Coins",
        description: `You need ${entryFee} coins to create this room`,
        variant: "destructive",
      })
      return
    }

    setCreating(true)

    try {
      // Simulate room creation
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const newRoom: GameRoom = {
        id: Date.now().toString(),
        name: roomName,
        created_by: user!.id,
        creator_username: profile.username,
        entry_fee: entryFee,
        prize_pool: entryFee,
        max_players: 4,
        current_players: 1,
        status: "waiting",
        created_at: new Date().toISOString(),
      }

      setGameRooms((prev) => [newRoom, ...prev])
      setCreateRoomOpen(false)
      setRoomName("")
      setEntryFee(50)

      toast({
        title: "Room Created!",
        description: `Your game room "${roomName}" has been created`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create game room. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const handleJoinRoom = async (room: GameRoom) => {
    if (!isAuthenticated || !profile) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to join a game room",
        variant: "destructive",
      })
      return
    }

    if (profile.coins_balance < room.entry_fee) {
      toast({
        title: "Insufficient Coins",
        description: `You need ${room.entry_fee} coins to join this room`,
        variant: "destructive",
      })
      return
    }

    if (room.current_players >= room.max_players) {
      toast({
        title: "Room Full",
        description: "This game room is already full",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Joining Game...",
      description: `Joining "${room.name}"`,
    })

    // Simulate joining and redirect to game
    setTimeout(() => {
      window.location.href = `/games/ludo/${room.id}`
    }, 1000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "bg-green-500"
      case "playing":
        return "bg-yellow-500"
      case "finished":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "waiting":
        return "Waiting for Players"
      case "playing":
        return "Game in Progress"
      case "finished":
        return "Game Finished"
      default:
        return "Unknown"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Gamepad2 className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Game Lobby</h1>
            </div>
            <p className="text-muted-foreground">Join or create Ludo game rooms and compete with other players</p>
          </div>

          {isAuthenticated && profile && (
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <Coins className="h-4 w-4 mr-2" />
                {profile.coins_balance?.toLocaleString() || 0} Coins
              </Badge>

              <Dialog open={createRoomOpen} onOpenChange={setCreateRoomOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Create Room</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Game Room</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="roomName">Room Name</Label>
                      <Input
                        id="roomName"
                        placeholder="Enter room name..."
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="entryFee">Entry Fee (Coins)</Label>
                      <Input
                        id="entryFee"
                        type="number"
                        min="25"
                        max="500"
                        step="25"
                        value={entryFee}
                        onChange={(e) => setEntryFee(Number(e.target.value))}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Winner takes all: {entryFee * 4} coins prize pool
                      </p>
                    </div>
                    <Button onClick={handleCreateRoom} disabled={creating} className="w-full">
                      {creating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Room
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>

      {/* Authentication Check */}
      {!isAuthenticated ? (
        <Card>
          <CardContent className="text-center py-12">
            <Gamepad2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Sign In to Play</h3>
            <p className="text-muted-foreground mb-4">
              Create an account to join game rooms and compete with other players
            </p>
            <div className="space-x-2">
              <Button asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Game Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Rooms</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{gameRooms.filter((room) => room.status === "waiting").length}</div>
                <p className="text-xs text-muted-foreground">Waiting for players</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Prize Pool</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {gameRooms.reduce((total, room) => total + room.prize_pool, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Coins available to win</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Your Balance</CardTitle>
                <Coins className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile?.coins_balance?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">Available coins</p>
              </CardContent>
            </Card>
          </div>

          {/* Game Rooms */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Available Game Rooms</h2>

            {gameRooms.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Gamepad2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Game Rooms</h3>
                  <p className="text-muted-foreground mb-4">Be the first to create a game room!</p>
                  <Button onClick={() => setCreateRoomOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Room
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gameRooms.map((room) => (
                  <Card key={room.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{room.name}</CardTitle>
                        <Badge className={`text-white ${getStatusColor(room.status)}`}>
                          {getStatusText(room.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Created by {room.creator_username}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Coins className="h-4 w-4 text-yellow-500" />
                          <span>Entry: {room.entry_fee}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          <span>Prize: {room.prize_pool}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          <span>
                            {room.current_players}/{room.max_players}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>{new Date(room.created_at).toLocaleTimeString()}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        {room.status === "waiting" ? (
                          <Button
                            onClick={() => handleJoinRoom(room)}
                            disabled={
                              room.current_players >= room.max_players || (profile?.coins_balance || 0) < room.entry_fee
                            }
                            className="flex-1"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Join Game
                          </Button>
                        ) : (
                          <Button disabled className="flex-1">
                            {room.status === "playing" ? "In Progress" : "Finished"}
                          </Button>
                        )}

                        {room.created_by === user?.id && room.status === "waiting" && (
                          <Button variant="outline" asChild>
                            <Link href={`/games/ludo/${room.id}`}>
                              <Star className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>

                      {(profile?.coins_balance || 0) < room.entry_fee && (
                        <p className="text-xs text-red-500">Insufficient coins to join</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
