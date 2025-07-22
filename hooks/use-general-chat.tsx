"use client"

import { createClient } from "@/lib/supabase/client"
import { useCallback, useEffect, useState } from "react"

interface UseGeneralChatProps {
  username: string
  userTier: string
}

export interface GeneralChatMessage {
  id: string
  content: string
  user: {
    name: string
    tier: string
  }
  createdAt: string
}

const EVENT_MESSAGE_TYPE = "general_message"

export function useGeneralChat({ username, userTier }: UseGeneralChatProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<GeneralChatMessage[]>([])
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const roomName = "general-chat"

  useEffect(() => {
    const newChannel = supabase.channel(roomName)

    newChannel
      .on("broadcast", { event: EVENT_MESSAGE_TYPE }, (payload) => {
        setMessages((current) => [...current, payload.payload as GeneralChatMessage])
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

      const message: GeneralChatMessage = {
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
          // Get the general room ID
          const { data: room } = await supabase.from("chat_rooms").select("id").eq("name", "General").single()

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

      // Broadcast to all users
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
