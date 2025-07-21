"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { getAblyClient, ABLY_CHANNELS } from "@/lib/ably"
import { useAuth } from "@/contexts/auth-context"
import type { Types } from "ably"

interface AblyContextType {
  isConnected: boolean
  connectionState: string
  subscribeToFeed: (callback: (data: any) => void) => () => void
  subscribeToPostVotes: (postId: number, callback: (data: any) => void) => () => void
  subscribeToPostComments: (postId: number, callback: (data: any) => void) => () => void
  subscribeToCommentLikes: (commentId: number, callback: (data: any) => void) => () => void
}

const AblyContext = createContext<AblyContextType | undefined>(undefined)

export function AblyProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState("disconnected")
  const { user } = useAuth()

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_ABLY_API_KEY) {
      console.warn("Ably API key not found. Real-time features will be disabled.")
      return
    }

    try {
      const ably = getAblyClient()

      const handleConnectionStateChange = (stateChange: Types.ConnectionStateChange) => {
        setConnectionState(stateChange.current)
        setIsConnected(stateChange.current === "connected")
      }

      ably.connection.on("connected", () => {
        setIsConnected(true)
        setConnectionState("connected")
      })

      ably.connection.on("disconnected", () => {
        setIsConnected(false)
        setConnectionState("disconnected")
      })

      ably.connection.on("failed", () => {
        setIsConnected(false)
        setConnectionState("failed")
      })

      ably.connection.on(handleConnectionStateChange)

      return () => {
        ably.connection.off(handleConnectionStateChange)
      }
    } catch (error) {
      console.error("Failed to initialize Ably:", error)
    }
  }, [])

  const subscribeToFeed = (callback: (data: any) => void) => {
    try {
      const ably = getAblyClient()
      const channel = ably.channels.get(ABLY_CHANNELS.COMMUNITY_FEED)

      const messageHandler = (message: Types.Message) => {
        callback(message.data)
      }

      channel.subscribe("post:created", messageHandler)

      return () => {
        channel.unsubscribe("post:created", messageHandler)
      }
    } catch (error) {
      console.error("Failed to subscribe to feed:", error)
      return () => {}
    }
  }

  const subscribeToPostVotes = (postId: number, callback: (data: any) => void) => {
    try {
      const ably = getAblyClient()
      const channel = ably.channels.get(ABLY_CHANNELS.POST_VOTES(postId))

      const messageHandler = (message: Types.Message) => {
        callback(message.data)
      }

      channel.subscribe("post:voted", messageHandler)

      return () => {
        channel.unsubscribe("post:voted", messageHandler)
      }
    } catch (error) {
      console.error("Failed to subscribe to post votes:", error)
      return () => {}
    }
  }

  const subscribeToPostComments = (postId: number, callback: (data: any) => void) => {
    try {
      const ably = getAblyClient()
      const channel = ably.channels.get(ABLY_CHANNELS.POST_COMMENTS(postId))

      const messageHandler = (message: Types.Message) => {
        callback(message.data)
      }

      channel.subscribe("comment:created", messageHandler)

      return () => {
        channel.unsubscribe("comment:created", messageHandler)
      }
    } catch (error) {
      console.error("Failed to subscribe to post comments:", error)
      return () => {}
    }
  }

  const subscribeToCommentLikes = (commentId: number, callback: (data: any) => void) => {
    try {
      const ably = getAblyClient()
      const channel = ably.channels.get(ABLY_CHANNELS.COMMENT_LIKES(commentId))

      const messageHandler = (message: Types.Message) => {
        callback(message.data)
      }

      channel.subscribe("comment:liked", messageHandler)

      return () => {
        channel.unsubscribe("comment:liked", messageHandler)
      }
    } catch (error) {
      console.error("Failed to subscribe to comment likes:", error)
      return () => {}
    }
  }

  const value: AblyContextType = {
    isConnected,
    connectionState,
    subscribeToFeed,
    subscribeToPostVotes,
    subscribeToPostComments,
    subscribeToCommentLikes,
  }

  return <AblyContext.Provider value={value}>{children}</AblyContext.Provider>
}

export function useAbly() {
  const context = useContext(AblyContext)
  if (context === undefined) {
    throw new Error("useAbly must be used within an AblyProvider")
  }
  return context
}
