"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"

interface GameRoom {
  id: string
  name: string
  game_type: string
  host_user_id: number
  max_players: number
  current_players: number
  status: "waiting" | "playing" | "finished"
  created_at: string
  updated_at: string
}

interface GamePlayer {
  id: string
  room_id: string
  user_id: number
  player_color: string
  player_position: number
  joined_at: string
  left_at?: string
  user: {
    username: string
    avatar_url?: string
  }
}

export function useGameRoom(roomId?: string) {
  const [rooms, setRooms] = useState<GameRoom[]>([])
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null)
  const [players, setPlayers] = useState<GamePlayer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { profile } = useAuth()
  const supabase = createClient()

  const loadRooms = useCallback(async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("game_rooms")
        .select("*")
        .eq("status", "waiting")
        .order("created_at", { ascending: false })

      if (error) throw error
      setRooms(data || [])
    } catch (err) {
      console.error("Error loading rooms:", err)
      setError("Failed to load game rooms")
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  const loadRoomDetails = useCallback(
    async (id: string) => {
      try {
        const { data: roomData, error: roomError } = await supabase.from("game_rooms").select("*").eq("id", id).single()

        if (roomError) throw roomError
        setCurrentRoom(roomData)

        const { data: playersData, error: playersError } = await supabase
          .from("game_players")
          .select(`
          *,
          user:users(username, avatar_url)
        `)
          .eq("room_id", id)
          .is("left_at", null)

        if (playersError) throw playersError
        setPlayers(playersData || [])
      } catch (err) {
        console.error("Error loading room details:", err)
        setError("Failed to load room details")
      }
    },
    [supabase],
  )

  const createRoom = useCallback(
    async (name: string, gameType = "ludo") => {
      if (!profile) return null

      try {
        const response = await fetch("/api/games/rooms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            gameType,
            maxPlayers: 4,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to create room")
        }

        const { room } = await response.json()
        await loadRooms()
        return room
      } catch (err) {
        console.error("Error creating room:", err)
        setError(err instanceof Error ? err.message : "Failed to create room")
        return null
      }
    },
    [profile, loadRooms],
  )

  const joinRoom = useCallback(
    async (id: string) => {
      if (!profile) return false

      try {
        const response = await fetch(`/api/games/rooms/${id}/join`, {
          method: "POST",
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to join room")
        }

        await loadRoomDetails(id)
        return true
      } catch (err) {
        console.error("Error joining room:", err)
        setError(err instanceof Error ? err.message : "Failed to join room")
        return false
      }
    },
    [profile, loadRoomDetails],
  )

  // Set up real-time subscriptions
  useEffect(() => {
    if (!roomId) return

    const channel = supabase
      .channel(`game-room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          console.log("Room updated:", payload)
          if (payload.new) {
            setCurrentRoom(payload.new as GameRoom)
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_players",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log("Players updated:", payload)
          loadRoomDetails(roomId)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, supabase, loadRoomDetails])

  useEffect(() => {
    loadRooms()
  }, [loadRooms])

  useEffect(() => {
    if (roomId) {
      loadRoomDetails(roomId)
    }
  }, [roomId, loadRoomDetails])

  return {
    rooms,
    currentRoom,
    players,
    isLoading,
    error,
    loadRooms,
    createRoom,
    joinRoom,
    clearError: () => setError(null),
  }
}
