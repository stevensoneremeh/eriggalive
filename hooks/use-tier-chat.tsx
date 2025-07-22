"use client"

import { createClient } from "@/lib/supabase/client"
import { useCallback, useEffect, useState } from "react"

interface UseTierChatProps {
  userTier: string
  username: string
}

export interface TierChatMessage {
  id: string
  content: string
  user: {
    name: string
    tier: string
  }
  createdAt: string
  isGlobal?: boolean
}

const EVENT_MESSAGE_TYPE = "tier_message"

export function useTierChat({ userTier, username }: UseTierChatProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<TierChatMessage[]>([])
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const roomName = `${userTier.toLowerCase()}-chat`

  useEffect(() => {
    const newChannel = supabase.channel(roomName)

    newChannel
      .on("broadcast", { event: EVENT_MESSAGE_TYPE }, (payload) => {
        setMessages((current) => [...current, payload.payload as TierChatMessage])
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true)
        }
      })

    setChannel(newChannel)

    return () => {
      supabase.removeChannel(newChannel)
    }
  }, [roomName, supabase])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!channel || !isConnected) return

      const message: TierChatMessage = {
        id: crypto.randomUUID(),
        content,
        user: {
          name: username,
          tier: userTier,
        },
        createdAt: new Date().toISOString(),
      }

      // Update local state immediately for the sender
      setMessages((current) => [...current, message])

      // Store message in database
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          // Get the room ID for this tier
          const { data: room } = await supabase.from("chat_rooms").select("id").eq("tier", userTier).single()

          if (room) {
            await supabase.from("chat_messages").insert({
              content,
              user_id: user.id,
              room_id: room.id,
            })
          }
        }
      } catch (error) {
        console.error("Error saving message:", error)
      }

      // Broadcast to other users in the same tier
      await channel.send({
        type: "broadcast",
        event: EVENT_MESSAGE_TYPE,
        payload: message,
      })
    },
    [channel, isConnected, username, userTier, supabase],
  )

  return { messages, sendMessage, isConnected }
}
