"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { getAblyClient, subscribeToChannel, ABLY_CHANNELS, cleanupAbly } from "@/lib/ably"
import type Ably from "ably"

interface AblyContextType {
  isConnected: boolean
  connectionState: string
  subscribeToFeed: (callback: (data: any) => void) => () => void
  subscribeToPostVotes: (postId: number, callback: (data: any) => void) => () => void
  subscribeToPostComments: (postId: number, callback: (data: any) => void) => () => void
  subscribeToUserNotifications: (userId: string, callback: (data: any) => void) => () => void
}

const AblyContext = createContext<AblyContextType | null>(null)

export function AblyProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState("disconnected")
  const [client, setClient] = useState<Ably.Realtime | null>(null)

  useEffect(() => {
    // Only initialize Ably on the client side
    if (typeof window === "undefined") return

    // Check if Ably API key is available
    if (!process.env.NEXT_PUBLIC_ABLY_API_KEY) {
      console.warn("Ably API key not configured. Real-time features will be disabled.")
      return
    }

    try {
      const ablyClient = getAblyClient()
      setClient(ablyClient)

      // Set up connection state listeners
      const handleConnectionStateChange = (stateChange: Ably.ConnectionStateChange) => {
        setConnectionState(stateChange.current)
        setIsConnected(stateChange.current === "connected")
      }

      ablyClient.connection.on(handleConnectionStateChange)

      // Set initial state
      setConnectionState(ablyClient.connection.state)
      setIsConnected(ablyClient.connection.state === "connected")

      // Cleanup on unmount
      return () => {
        ablyClient.connection.off(handleConnectionStateChange)
        cleanupAbly()
      }
    } catch (error) {
      console.error("Failed to initialize Ably:", error)
      setIsConnected(false)
      setConnectionState("failed")
    }
  }, [])

  const subscribeToFeed = useCallback(
    (callback: (data: any) => void) => {
      if (!client) return () => {}

      return subscribeToChannel(ABLY_CHANNELS.COMMUNITY_FEED, "post:created", (message: Ably.Message) => {
        callback(message.data)
      })
    },
    [client],
  )

  const subscribeToPostVotes = useCallback(
    (postId: number, callback: (data: any) => void) => {
      if (!client) return () => {}

      return subscribeToChannel(ABLY_CHANNELS.POST_VOTES(postId), "post:voted", (message: Ably.Message) => {
        callback(message.data)
      })
    },
    [client],
  )

  const subscribeToPostComments = useCallback(
    (postId: number, callback: (data: any) => void) => {
      if (!client) return () => {}

      return subscribeToChannel(ABLY_CHANNELS.POST_COMMENTS(postId), "comment:created", (message: Ably.Message) => {
        callback(message.data)
      })
    },
    [client],
  )

  const subscribeToUserNotifications = useCallback(
    (userId: string, callback: (data: any) => void) => {
      if (!client) return () => {}

      return subscribeToChannel(
        ABLY_CHANNELS.USER_NOTIFICATIONS(userId),
        "notification:new",
        (message: Ably.Message) => {
          callback(message.data)
        },
      )
    },
    [client],
  )

  const value: AblyContextType = {
    isConnected,
    connectionState,
    subscribeToFeed,
    subscribeToPostVotes,
    subscribeToPostComments,
    subscribeToUserNotifications,
  }

  return <AblyContext.Provider value={value}>{children}</AblyContext.Provider>
}

export function useAbly(): AblyContextType {
  const context = useContext(AblyContext)
  if (!context) {
    throw new Error("useAbly must be used within an AblyProvider")
  }
  return context
}
